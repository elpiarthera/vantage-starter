// test-2scenes-assembly.js
// 2-scene full assembly test using Rendi API.
// Tests: Video xfade merge (2 scenes) → Audio ducking mix (narration + music) → Final A/V merge.
// Run with: node tests/e2e/test-2scenes-assembly.js

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ============================================================
// 1. CONFIGURATION
// ============================================================

const API_KEY = process.env.RENDI_API_KEY;
const RENDI_BASE_URL = "https://api.rendi.dev/v1";

if (!API_KEY) {
	console.error("❌ RENDI_API_KEY not found in environment variables!");
	console.error("   Add it to your .env.local file");
	process.exit(1);
}

console.log(
	"🔑 API Key loaded (first 20 chars):",
	`${API_KEY.substring(0, 20)}...`,
);

// ============================================================
// INPUT FILES — 2 scenes + narration + music
// ============================================================

const SCENES = [
	"https://honorable-caribou-770.convex.cloud/api/storage/4a94fc11-14a4-47dd-a258-2e23003deb99", // Scene 1
	"https://honorable-caribou-770.convex.cloud/api/storage/5255267f-e0f9-4ad1-87c8-c2885894bdd7", // Scene 2
];

const NARRATION_URL =
	"https://v3b.fal.media/files/b/0a8bf99c/gDh9zw4m5ISV-ULdKcFKV_speech.mp3";
const MUSIC_URL =
	"https://v3b.fal.media/files/b/0a8bf9a7/MN_2E2r_2ZSvW3JP-JIb6_tmpcgnhlwtd.wav";

// ============================================================
// VIDEO SETTINGS
// ============================================================

const CLIP_DURATION = 10.0; // Each scene duration in seconds
const TRANSITION_DURATION = 0.5; // xfade transition duration

// 46 verified working transitions - see docs/MVP/x-fade-effects-tests.md
// Popular options: circleopen, fade, dissolve, smoothleft, zoomin, pixelize
// ⚠️ Do NOT use: hlwind, hrwind, vuwind, vdwind, cover*, reveal* (unsupported)
const TRANSITION_TYPE = "circleopen";

// ============================================================
// OUTPUT RESOLUTION SETTINGS (Sprint 17 fix)
// ============================================================

// Target output resolution - LANDSCAPE 16:9
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;

// Scaling algorithm: lanczos = high quality resampling
// Other options: bilinear, bicubic, neighbor (fast but blocky)
const SCALE_FLAGS = "lanczos";

const AUDIO_CONFIG = {
	musicPreVolume: 0.4,
	threshold: 0.03,
	ratio: 9,
	attack: 10,
	release: 200,
	makeup: 1,
	loudnormI: -16,
	loudnormTP: -1.5,
	loudnormLRA: 11,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function submitRendiCommand(
	ffmpegCommand,
	inputFiles,
	outputFiles,
	vcpuCount = 4,
) {
	const res = await fetch(`${RENDI_BASE_URL}/run-ffmpeg-command`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": API_KEY,
		},
		body: JSON.stringify({
			ffmpeg_command: ffmpegCommand,
			input_files: inputFiles,
			output_files: outputFiles,
			vcpu_count: vcpuCount,
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Submit failed (${res.status}): ${err}`);
	}

	const { command_id } = await res.json();
	return command_id;
}

async function pollRendiCommand(commandId, outputKey, maxWaitSeconds = 180) {
	const startTime = Date.now();
	let dots = 0;

	while (true) {
		await new Promise((r) => setTimeout(r, 2000));

		const res = await fetch(`${RENDI_BASE_URL}/commands/${commandId}`, {
			headers: { "X-API-KEY": API_KEY },
		});

		const data = await res.json();

		if (data.status === "SUCCESS") {
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
			console.log(`   ✅ Done! (${elapsed}s)`);
			const outputFile = data.output_files[outputKey];
			return {
				success: true,
				url: outputFile.storage_url,
				fileId: outputFile.file_id,
				duration: outputFile.duration,
				sizeMB: outputFile.size_mbytes,
				width: outputFile.width,
				height: outputFile.height,
				codec: outputFile.codec,
				frameRate: outputFile.frame_rate,
			};
		}

		if (data.status === "FAILED") {
			const msg = data.error_message || "Unknown error";
			const hint = /timedout|60 seconds|60 second/i.test(msg)
				? " (Rendi plan limit: 60s FFmpeg runtime. See https://app.rendi.dev/plans)"
				: "";
			throw new Error(`Command failed: ${msg}${hint}`);
		}

		if ((Date.now() - startTime) / 1000 > maxWaitSeconds) {
			throw new Error(`Timeout after ${maxWaitSeconds}s`);
		}

		dots++;
		process.stdout.write(`\r   Processing${".".repeat(dots % 4).padEnd(3)}`);
	}
}

// ============================================================
// STEP 1: MERGE VIDEOS WITH XFADE TRANSITIONS
// ============================================================

async function mergeVideosWithXfade() {
	console.log(`\n${"=".repeat(60)}`);
	console.log("📹 STEP 1: Merging video scenes with xfade transitions");
	console.log("=".repeat(60));
	console.log(`   Scenes: ${SCENES.length}`);
	console.log(`   Clip duration: ${CLIP_DURATION}s`);
	console.log(`   Transition: ${TRANSITION_TYPE} (${TRANSITION_DURATION}s)`);
	console.log(`   Output: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} (${SCALE_FLAGS})`);

	// Calculate offsets for xfade
	const offsets = [];
	let currentOffset = CLIP_DURATION - TRANSITION_DURATION;
	for (let i = 1; i < SCENES.length; i++) {
		offsets.push(currentOffset);
		currentOffset += CLIP_DURATION - TRANSITION_DURATION;
	}
	console.log(`   Offsets: [${offsets.join(", ")}]s`);

	// Build scale filter for normalization (Sprint 17 fix)
	// This ensures all videos are scaled to the same dimensions before xfade
	const scaleFilter = `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:flags=${SCALE_FLAGS},setsar=1`;

	// Build filter_complex with scaling normalization + xfade chain
	// Step 1: Scale all inputs to consistent dimensions
	// Step 2: Apply xfade transitions between scaled videos
	let filterComplex;
	if (SCENES.length === 2) {
		// Scale both videos, then xfade
		filterComplex = [
			`[0:v]${scaleFilter}[s0]`,
			`[1:v]${scaleFilter}[s1]`,
			`[s0][s1]xfade=transition=${TRANSITION_TYPE}:duration=${TRANSITION_DURATION}:offset=${offsets[0]},format=yuv420p[out]`,
		].join(";");
	} else if (SCENES.length === 3) {
		// Scale all three videos, then chain xfade
		filterComplex = [
			`[0:v]${scaleFilter}[s0]`,
			`[1:v]${scaleFilter}[s1]`,
			`[2:v]${scaleFilter}[s2]`,
			`[s0][s1]xfade=transition=${TRANSITION_TYPE}:duration=${TRANSITION_DURATION}:offset=${offsets[0]}[v1]`,
			`[v1][s2]xfade=transition=${TRANSITION_TYPE}:duration=${TRANSITION_DURATION}:offset=${offsets[1]},format=yuv420p[out]`,
		].join(";");
	} else {
		throw new Error("Only 2-3 scenes supported in this test");
	}

	// Build input placeholders
	const inputPlaceholders = SCENES.map(
		(_, i) => `-i {{in_scene${i + 1}}}`,
	).join(" ");
	const inputFiles = Object.fromEntries(
		SCENES.map((url, i) => [`in_scene${i + 1}`, url]),
	);

	const ffmpegCommand = `${inputPlaceholders} -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 {{out_video}}`;

	console.log("\n   📝 Filter complex (first 200 chars):");
	console.log(`      ${filterComplex.substring(0, 200)}...`);

	console.log("\n   🚀 Submitting to Rendi...");
	const commandId = await submitRendiCommand(
		ffmpegCommand,
		inputFiles,
		{ out_video: "merged_scenes.mp4" },
		8, // Higher vCPU for video
	);
	console.log(`   📋 Command ID: ${commandId}`);

	const result = await pollRendiCommand(commandId, "out_video");
	console.log(`   📹 Output: ${result.url}`);
	console.log(`   ⏱️  Duration: ${result.duration}s`);
	console.log(`   📦 Size: ${result.sizeMB?.toFixed(2)} MB`);
	console.log(`   📐 Dimensions: ${result.width}x${result.height}`);

	// Verify output dimensions
	if (result.width === OUTPUT_WIDTH && result.height === OUTPUT_HEIGHT) {
		console.log(
			`   ✅ Correct aspect ratio: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} (landscape)`,
		);
	} else {
		console.log(
			`   ⚠️  Unexpected dimensions: expected ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`,
		);
	}

	return result;
}

// ============================================================
// STEP 2: MIX AUDIO (NARRATION + MUSIC WITH DUCKING)
// ============================================================

async function mixAudioWithDucking() {
	console.log(`\n${"=".repeat(60)}`);
	console.log("🎵 STEP 2: Mixing audio with sidechain ducking");
	console.log("=".repeat(60));
	console.log(`   Music pre-volume: ${AUDIO_CONFIG.musicPreVolume * 100}%`);
	console.log(
		`   Sidechain: threshold=${AUDIO_CONFIG.threshold}, ratio=${AUDIO_CONFIG.ratio}`,
	);
	console.log(`   Loudnorm: I=${AUDIO_CONFIG.loudnormI} LUFS`);

	const c = AUDIO_CONFIG;
	const filterComplex = `[0:a]asplit=2[sc][narr];[1:a]volume=${c.musicPreVolume}[music];[music][sc]sidechaincompress=threshold=${c.threshold}:ratio=${c.ratio}:attack=${c.attack}:release=${c.release}:makeup=${c.makeup}[ducked];[narr][ducked]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=${c.loudnormI}:TP=${c.loudnormTP}:LRA=${c.loudnormLRA}`;

	const ffmpegCommand = `-i {{in_narration}} -stream_loop -1 -i {{in_music}} -filter_complex "${filterComplex}" -c:a aac -b:a 192k {{out_mixed}}`;

	console.log("\n   🚀 Submitting to Rendi...");
	const commandId = await submitRendiCommand(
		ffmpegCommand,
		{
			in_narration: NARRATION_URL,
			in_music: MUSIC_URL,
		},
		{ out_mixed: "mixed_audio.m4a" },
		2,
	);
	console.log(`   📋 Command ID: ${commandId}`);

	const result = await pollRendiCommand(commandId, "out_mixed", 120);
	console.log(`   🎵 Output: ${result.url}`);
	console.log(`   ⏱️  Duration: ${result.duration}s`);
	console.log(`   📦 Size: ${result.sizeMB?.toFixed(2)} MB`);

	return result;
}

// ============================================================
// STEP 3: FINAL MERGE (VIDEO + AUDIO)
// ============================================================

async function mergeVideoAndAudio(videoUrl, audioUrl) {
	console.log(`\n${"=".repeat(60)}`);
	console.log("🎬 STEP 3: Final merge (video + audio)");
	console.log("=".repeat(60));

	const ffmpegCommand = `-i {{in_video}} -i {{in_audio}} -c:v copy -c:a aac -b:a 192k -shortest {{out_final}}`;

	console.log("\n   🚀 Submitting to Rendi...");
	const commandId = await submitRendiCommand(
		ffmpegCommand,
		{
			in_video: videoUrl,
			in_audio: audioUrl,
		},
		{ out_final: "final_video.mp4" },
		4,
	);
	console.log(`   📋 Command ID: ${commandId}`);

	const result = await pollRendiCommand(commandId, "out_final");
	console.log(`   🎬 Output: ${result.url}`);
	console.log(`   ⏱️  Duration: ${result.duration}s`);
	console.log(`   📦 Size: ${result.sizeMB?.toFixed(2)} MB`);

	return result;
}

// ============================================================
// MAIN TEST RUNNER — 2 scenes + narration + music
// ============================================================

async function run2ScenesAssemblyTest() {
	console.log(`\n${"═".repeat(60)}`);
	console.log("🎬 2-SCENE FULL ASSEMBLY TEST (Rendi API)");
	console.log("═".repeat(60));
	console.log("\nThis test runs the full pipeline with 2 video scenes:");
	console.log("  1. Merge 2 video scenes with xfade transitions");
	console.log("  2. Mix narration + music with sidechain ducking (parallel)");
	console.log("  3. Merge video + audio into final output\n");

	const overallStart = Date.now();

	try {
		console.log("🔄 Running Steps 1 & 2 in PARALLEL...\n");
		const [videoResult, audioResult] = await Promise.all([
			mergeVideosWithXfade(),
			mixAudioWithDucking(),
		]);

		const finalResult = await mergeVideoAndAudio(
			videoResult.url,
			audioResult.url,
		);

		const totalTime = ((Date.now() - overallStart) / 1000).toFixed(1);

		console.log(`\n${"═".repeat(60)}`);
		console.log("✅ 2-SCENE FULL ASSEMBLY COMPLETE");
		console.log("═".repeat(60));
		console.log(`\n📊 Summary:`);
		console.log(`   Total time: ${totalTime}s`);
		console.log(`   Final duration: ${finalResult.duration}s`);
		console.log(`   Final size: ${finalResult.sizeMB?.toFixed(2)} MB`);
		console.log(
			`   Final dimensions: ${finalResult.width}x${finalResult.height}`,
		);
		console.log(`   Codec: ${finalResult.codec}`);

		if (
			videoResult.width === OUTPUT_WIDTH &&
			videoResult.height === OUTPUT_HEIGHT
		) {
			console.log(
				`\n   ✅ ASPECT RATIO CHECK PASSED: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} (16:9 landscape)`,
			);
		} else {
			console.log(
				`\n   ⚠️  ASPECT RATIO CHECK: Got ${videoResult.width}x${videoResult.height}, expected ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`,
			);
		}

		console.log(`\n🎬 FINAL VIDEO:`);
		console.log(`   ${finalResult.url}`);
		console.log(`\n📁 Intermediate files:`);
		console.log(`   Video: ${videoResult.url}`);
		console.log(`   Audio: ${audioResult.url}`);
		console.log("");
	} catch (error) {
		console.error("\n❌ Test failed:", error.message);
		process.exit(1);
	}
}

// Run the test
run2ScenesAssemblyTest();

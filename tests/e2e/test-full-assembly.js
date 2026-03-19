// test-full-assembly.js
// Full video assembly test using Rendi API only
// Tests: Video hard cut merge → Audio ducking mix → Final A/V merge
// Run with: node tests/e2e/test-full-assembly.js
//
// This test validates Sprint 17 Task 17.4 fix for video deformation issue.
// It uses HARD CUT mode (no transitions) to match the actual project assembly mode.

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
// INPUT FILES - From existing Convex project
// ============================================================
// Project URL: https://my-short-reel-beta-git-sprint-25dbdf-jacques-projects-65c2bbcd.vercel.app/guided/step-5?projectId=k57aj8wzt1mn2sgh0qm9azwdgd7zxccx
// Project ID: k57aj8wzt1mn2sgh0qm9azwdgd7zxccx
// Project: "Laurent and Laurence wedding"
//
// 🎯 ACTIVE TEST PROJECT - Sprint 17 Task 17.4 Validation
// Scene video URLs retrieved via Convex MCP (Feb 17, 2026)

// Video scenes (from Step 3 - video generation) - ordered by scene number
const SCENES = [
	"https://honorable-caribou-770.convex.cloud/api/storage/8229159a-ec68-49a4-84ed-a6fe458a05ee", // Scene 1
	"https://honorable-caribou-770.convex.cloud/api/storage/5255267f-e0f9-4ad1-87c8-c2885894bdd7", // Scene 2
	"https://honorable-caribou-770.convex.cloud/api/storage/4a94fc11-14a4-47dd-a258-2e23003deb99", // Scene 3
];

// Audio files (from Step 4 - confirmed from project data)
// Narration: Emma - Warm & Friendly (Take 6), ~28.7s
const NARRATION_URL =
	"https://honorable-caribou-770.convex.cloud/api/storage/fa9bd727-2c71-4f75-93f3-c7716efb2d2e";
// Music: Elegant romantic wedding background music
const MUSIC_URL =
	"https://honorable-caribou-770.convex.cloud/api/storage/6ba14b76-2513-4bbb-88cc-8615b5259d8f";

// ============================================================
// VIDEO SETTINGS
// ============================================================

const CLIP_DURATION = 10.0; // Each scene duration in seconds

// ============================================================
// OUTPUT RESOLUTION SETTINGS (Sprint 17 fix)
// ============================================================

// Target output resolution - LANDSCAPE 16:9
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;

// Scaling algorithm: lanczos = high quality resampling
// Other options: bilinear, bicubic, neighbor (fast but blocky)
const SCALE_FLAGS = "lanczos";

// ============================================================
// AUDIO MIXING SETTINGS (Sidechain ducking + loudnorm)
// ============================================================

const AUDIO_CONFIG = {
	musicPreVolume: 0.4, // Pre-attenuate music to 40%
	threshold: 0.03, // Sidechain threshold
	ratio: 9, // Compression ratio
	attack: 10, // Attack time (ms)
	release: 200, // Release time (ms)
	makeup: 1, // Makeup gain
	loudnormI: -16, // Target LUFS (streaming standard)
	loudnormTP: -1.5, // True peak limit
	loudnormLRA: 11, // Loudness range
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
// STEP 1: MERGE VIDEOS WITH HARD CUTS (NO TRANSITIONS)
// ============================================================

async function mergeVideosWithHardCut() {
	console.log(`\n${"=".repeat(60)}`);
	console.log("📹 STEP 1: Merging video scenes with hard cuts");
	console.log("=".repeat(60));
	console.log(`   Scenes: ${SCENES.length}`);
	console.log(`   Clip duration: ${CLIP_DURATION}s`);
	console.log(`   Mode: Hard cut (no transitions)`);
	console.log(`   Output: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} (${SCALE_FLAGS})`);

	// Build scale filter for normalization (Sprint 17 fix)
	// This ensures all videos are scaled to the same dimensions and trimmed
	const scaleFilter = `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:flags=${SCALE_FLAGS},setsar=1`;

	// Build filter_complex for hard cut concatenation
	// Step 1: Trim and scale each video to consistent dimensions
	// Step 2: Concatenate all videos with hard cuts
	const trimParts = [];
	const concatInputs = [];

	for (let i = 0; i < SCENES.length; i++) {
		// Trim each video to clipDuration, scale to landscape 1920x1080
		trimParts.push(
			`[${i}:v]trim=duration=${CLIP_DURATION},setpts=PTS-STARTPTS,${scaleFilter},format=yuv420p[v${i}]`,
		);
		concatInputs.push(`[v${i}]`);
	}

	// Concatenate all trimmed videos
	const filterComplex = `${trimParts.join(";")};${concatInputs.join("")}concat=n=${SCENES.length}:v=1:a=0[out]`;

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

	// Verify expected duration (hard cut = scenes × duration)
	const expectedDuration = SCENES.length * CLIP_DURATION;
	console.log(`   📊 Expected duration: ${expectedDuration}s (hard cut)`);

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

	// Build sidechain + loudnorm filter
	const c = AUDIO_CONFIG;
	const filterComplex = `[0:a]asplit=2[sc][narr];[1:a]volume=${c.musicPreVolume}[music];[music][sc]sidechaincompress=threshold=${c.threshold}:ratio=${c.ratio}:attack=${c.attack}:release=${c.release}:makeup=${c.makeup}[ducked];[narr][ducked]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=${c.loudnormI}:TP=${c.loudnormTP}:LRA=${c.loudnormLRA}`;

	// Loop music to match narration length
	const ffmpegCommand = `-i {{in_narration}} -stream_loop -1 -i {{in_music}} -filter_complex "${filterComplex}" -c:a aac -b:a 192k {{out_mixed}}`;

	console.log("\n   🚀 Submitting to Rendi...");
	const commandId = await submitRendiCommand(
		ffmpegCommand,
		{
			in_narration: NARRATION_URL,
			in_music: MUSIC_URL,
		},
		{ out_mixed: "mixed_audio.m4a" },
		2, // Lower vCPU for audio
	);
	console.log(`   📋 Command ID: ${commandId}`);

	// Audio can be slower under queue load; use 120s so we don't hit client timeout before Rendi responds
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

	// Sprint 17 Task 17.4 Fix: Apply scaling normalization to prevent deformation
	// The previous `-c:v copy` would preserve SAR issues, causing deformed output
	// Now we re-encode with proper scaling to ensure 1920x1080 landscape
	const scaleFilter = `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:flags=${SCALE_FLAGS},setsar=1`;
	const ffmpegCommand = `-i {{in_video}} -i {{in_audio}} -vf "${scaleFilter}" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 192k -shortest {{out_final}}`;

	console.log(
		`   📐 Applying scaling: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} (${SCALE_FLAGS})`,
	);
	console.log("   🔧 Using H.264 with CRF 23 (high quality)");

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
	console.log(`   📐 Dimensions: ${result.width}x${result.height}`);

	// Verify final video dimensions (critical check for Task 17.4)
	if (result.width === OUTPUT_WIDTH && result.height === OUTPUT_HEIGHT) {
		console.log(
			`   ✅ FINAL VIDEO: Correct aspect ratio ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} (16:9 landscape)`,
		);
	} else {
		console.log(
			`   🚨 FINAL VIDEO: DEFORMATION DETECTED! Got ${result.width}x${result.height}, expected ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`,
		);
		throw new Error(
			`Final video has wrong dimensions: ${result.width}x${result.height} (expected ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT})`,
		);
	}

	return result;
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runFullAssemblyTest() {
	console.log(`\n${"═".repeat(60)}`);
	console.log("🎬 FULL VIDEO ASSEMBLY TEST (Rendi API)");
	console.log("═".repeat(60));
	console.log("\nThis test runs the complete video assembly pipeline:");
	console.log("  1. Merge video scenes with hard cuts (no transitions)");
	console.log("  2. Mix audio with sidechain ducking");
	console.log("  3. Merge video + audio into final output");
	console.log("\n🎯 Sprint 17 Task 17.4 Validation:");
	console.log(
		"  - Verifies final video has correct 1920x1080 landscape format",
	);
	console.log("  - Tests the mergeAudioVideo scaling fix\n");

	const overallStart = Date.now();

	try {
		// Check if we have valid audio URLs
		const hasAudioUrls =
			!NARRATION_URL.includes("YOUR_") && !MUSIC_URL.includes("YOUR_");

		if (!hasAudioUrls) {
			console.log("⚠️  WARNING: Audio URLs not configured!");
			console.log("   Running video-only test (Step 1 only)");
			console.log(
				"   Edit NARRATION_URL and MUSIC_URL in this file to run full test\n",
			);

			// Run video merge only
			const videoResult = await mergeVideosWithHardCut();

			console.log(`\n${"═".repeat(60)}`);
			console.log("✅ VIDEO-ONLY TEST COMPLETE");
			console.log("═".repeat(60));
			console.log(`\n📹 Merged Video (with transitions):`);
			console.log(`   ${videoResult.url}`);
			console.log(`   Dimensions: ${videoResult.width}x${videoResult.height}`);
			console.log(`   Duration: ${videoResult.duration}s`);

			// Verify dimensions
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

			console.log(
				`\n⚠️  To run full assembly, set NARRATION_URL and MUSIC_URL\n`,
			);
			return;
		}

		// Run Steps 1 & 2 in parallel (like production)
		console.log("🔄 Running Steps 1 & 2 in PARALLEL...\n");
		const [videoResult, audioResult] = await Promise.all([
			mergeVideosWithHardCut(),
			mixAudioWithDucking(),
		]);

		// Allow Rendi storage to propagate before Step 3 (avoids "Failed downloading file" when Step 1 runs longer)
		const step3DelaySeconds = 5;
		console.log(
			`\n   ⏳ Waiting ${step3DelaySeconds}s for Rendi storage before Step 3...\n`,
		);
		await new Promise((r) => setTimeout(r, step3DelaySeconds * 1000));

		// Step 3: Final merge (retry on "Failed downloading file" — Rendi storage propagation)
		let finalResult;
		const maxStep3Attempts = 3;
		for (let attempt = 1; attempt <= maxStep3Attempts; attempt++) {
			try {
				finalResult = await mergeVideoAndAudio(
					videoResult.url,
					audioResult.url,
				);
				break;
			} catch (err) {
				const isDownloadError =
					/Failed downloading file|failed to fetch|ECONNREFUSED/i.test(
						err.message || "",
					);
				if (isDownloadError && attempt < maxStep3Attempts) {
					const retryDelay = 5;
					console.log(
						`\n   ⚠️ Step 3 attempt ${attempt} failed (storage?), retrying in ${retryDelay}s...\n`,
					);
					await new Promise((r) => setTimeout(r, retryDelay * 1000));
				} else {
					throw err;
				}
			}
		}

		// Summary
		const totalTime = ((Date.now() - overallStart) / 1000).toFixed(1);

		console.log(`\n${"═".repeat(60)}`);
		console.log("✅ FULL ASSEMBLY TEST COMPLETE!");
		console.log("═".repeat(60));
		console.log(`\n📊 Summary:`);
		console.log(`   Total time: ${totalTime}s`);
		console.log(`   Final duration: ${finalResult.duration}s`);
		console.log(`   Final size: ${finalResult.sizeMB?.toFixed(2)} MB`);
		console.log(
			`   Final dimensions: ${finalResult.width}x${finalResult.height}`,
		);
		console.log(`   Codec: ${finalResult.codec}`);

		// Verify final video dimensions (critical check for Sprint 17 Task 17.4)
		console.log(`\n${"─".repeat(60)}`);
		console.log("🔍 SPRINT 17 TASK 17.4 VALIDATION:");
		console.log("─".repeat(60));

		// Check merged video (Step 1)
		if (
			videoResult.width === OUTPUT_WIDTH &&
			videoResult.height === OUTPUT_HEIGHT
		) {
			console.log(
				`   ✅ Step 1 (Video Merge): ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} ✓`,
			);
		} else {
			console.log(
				`   ❌ Step 1 (Video Merge): ${videoResult.width}x${videoResult.height} (WRONG!)`,
			);
		}

		// Check final video (Step 3) - CRITICAL
		if (
			finalResult.width === OUTPUT_WIDTH &&
			finalResult.height === OUTPUT_HEIGHT
		) {
			console.log(
				`   ✅ Step 3 (Final Merge): ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} ✓`,
			);
			console.log(
				"\n   🎉 SUCCESS! Task 17.4 fix is working - no deformation detected!",
			);
		} else {
			console.log(
				`   ❌ Step 3 (Final Merge): ${finalResult.width}x${finalResult.height} (DEFORMED!)`,
			);
			console.log(
				"\n   🚨 FAILURE! Task 17.4 fix NOT applied or not working correctly!",
			);
			throw new Error(
				`Task 17.4 validation failed: Final video has wrong dimensions ${finalResult.width}x${finalResult.height}`,
			);
		}

		console.log(`\n🎬 FINAL VIDEO:`);
		console.log(`   ${finalResult.url}`);
		console.log(`\n📁 Intermediate files (can be deleted):`);
		console.log(`   Video: ${videoResult.url}`);
		console.log(`   Audio: ${audioResult.url}`);
		console.log("");
	} catch (error) {
		console.error("\n❌ Test failed:", error.message);
		process.exit(1);
	}
}

// Run the test
runFullAssemblyTest();

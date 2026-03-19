// 37-fadegrays.js
// Quick PoC to test Rendi video assembly with xfade transitions
// Run with: node tests/x-fade-effects-scripts/37-fadegrays.js

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// 1. CONFIGURATION
const API_KEY = process.env.RENDI_API_KEY;

if (!API_KEY) {
	console.error("❌ RENDI_API_KEY not found in environment variables!");
	console.error("   Add it to your .env.local file");
	process.exit(1);
}

console.log(
	"🔑 API Key loaded (first 20 chars):",
	API_KEY.substring(0, 20) + "...",
);

// Replace these with your actual Convex/Fal URLs
// You can get these from the project's scenes in Convex
const SCENES = [
	"https://trustworthy-sparrow-452.convex.cloud/api/storage/2d1db549-d72f-41b4-aa2d-bf3401b42eb1", // Scene 2
	"https://trustworthy-sparrow-452.convex.cloud/api/storage/872cf797-6101-4041-b70c-2c59b1ddbb66", // Scene 3
];

// Video settings
// ⚠️ IF YOUR CLIPS ARE DIFFERENT DURATIONS, CHANGE THIS!
const CLIP_DURATION = 10.0; // Default scene duration from step-3 is 10 seconds
const TRANSITION_DURATION = 1.0;
const TRANSITION_TYPE = "fadegrays"; // Current transition type

// -----------------------------------------

async function runTest() {
	console.log("🧪 Starting XFADE PoC with Rendi API...");
	console.log(`   Transition type: '${TRANSITION_TYPE}'`);
	console.log(`   Clip duration: ${CLIP_DURATION}s`);
	console.log(`   Transition duration: ${TRANSITION_DURATION}s`);
	console.log(`   Scenes: ${SCENES.length}\n`);

	// 2. CONSTRUCT THE FFmpeg COMMAND
	// Logic:
	// Offset 1 = Duration - Transition
	const offset1 = CLIP_DURATION - TRANSITION_DURATION;

	console.log(`   Offset 1: ${offset1}s\n`);

	// We use [0:v], [1:v] inputs
	const filterComplex = `[0:v][1:v]xfade=transition=${TRANSITION_TYPE}:duration=${TRANSITION_DURATION}:offset=${offset1},format=yuv420p[out]`;

	// Rendi uses {{placeholder}} syntax, not direct URLs
	const command = `-i {{in_scene1}} -i {{in_scene2}} -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 -y {{out_video}}`;

	console.log("📝 Generated FFmpeg Command:");
	console.log("   " + command.substring(0, 100) + "...\n");

	// 3. SUBMIT TO RENDI
	// Docs: https://docs.rendi.dev/api-reference/endpoint/run-ffmpeg-command.md
	console.log("🚀 Submitting to Rendi API...");

	const submitRes = await fetch("https://api.rendi.dev/v1/run-ffmpeg-command", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": API_KEY,
		},
		body: JSON.stringify({
			ffmpeg_command: command,
			input_files: {
				in_scene1: SCENES[0],
				in_scene2: SCENES[1],
			},
			output_files: { out_video: "merged.mp4" },
			vcpu_count: 8,
		}),
	});

	if (!submitRes.ok) {
		const err = await submitRes.text();
		console.error("Response status:", submitRes.status);
		console.error("Response headers:", Object.fromEntries(submitRes.headers));
		throw new Error(`Submit Failed: ${err}`);
	}

	const { command_id } = await submitRes.json();
	console.log(`✅ Job Submitted! ID: ${command_id}`);
	console.log("⏳ Polling for result...\n");

	// 4. POLL FOR COMPLETION
	const startTime = Date.now();
	let dots = 0;

	while (true) {
		await new Promise((r) => setTimeout(r, 2000)); // Wait 2s

		const checkRes = await fetch(
			`https://api.rendi.dev/v1/commands/${command_id}`,
			{
				headers: { "X-API-KEY": API_KEY },
			},
		);
		const status = await checkRes.json();

		// Rendi uses uppercase status: SUCCESS, FAILED, PROCESSING, QUEUED
		if (status.status === "SUCCESS") {
			const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
			console.log(`\n\n✅ SUCCESS! (took ${elapsed}s)`);
			console.log("📹 Here is your video:");
			console.log(status.output_files.out_video.storage_url);
			console.log(`\n📊 Details:`);
			console.log(`   Duration: ${status.output_files.out_video.duration}s`);
			console.log(
				`   Size: ${status.output_files.out_video.size_mbytes?.toFixed(2)} MB`,
			);
			console.log(
				`   Resolution: ${status.output_files.out_video.width}x${status.output_files.out_video.height}`,
			);
			break;
		} else if (status.status === "FAILED") {
			console.error("\n\n❌ FAILED:", status.error_message);
			console.error("Error status:", status.error_status);
			break;
		}

		// Simple loading indicator
		dots++;
		process.stdout.write(`\r   Processing${".".repeat(dots % 4).padEnd(3)}`);
	}
}

runTest().catch((err) => {
	console.error("\n❌ Error:", err.message);
	process.exit(1);
});

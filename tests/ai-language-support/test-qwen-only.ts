/**
 * Qwen 3 TTS Only - Comprehensive Parameter Test
 * Tests ALL Qwen 3 TTS parameters (basic + advanced)
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-qwen-only.ts --lang=fr
 */

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
};

type VoiceResult = {
	audio?: { url: string };
	audio_url?: { url: string };
};

async function submitFalJob(
	falKey: string,
	payload: Record<string, unknown>,
): Promise<QueueStatus> {
	const response = await fetch(
		"https://queue.fal.run/fal-ai/qwen-3-tts/text-to-speech/1.7b",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Key ${falKey}`,
			},
			body: JSON.stringify(payload),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
	}

	return (await response.json()) as QueueStatus;
}

async function pollFalResult(
	falKey: string,
	statusUrl: string,
	responseUrl: string,
): Promise<VoiceResult> {
	let attempts = 0;
	const maxAttempts = 60;

	while (attempts < maxAttempts) {
		attempts++;
		await wait(2000);

		const statusRes = await fetch(statusUrl, {
			headers: { Authorization: `Key ${falKey}` },
		});
		if (!statusRes.ok) continue;

		const statusData = (await statusRes.json()) as QueueStatus;

		if (statusData.status === "COMPLETED") {
			const resultRes = await fetch(responseUrl, {
				headers: { Authorization: `Key ${falKey}` },
			});
			if (!resultRes.ok) {
				throw new Error(`Failed to fetch result: ${resultRes.status}`);
			}
			return (await resultRes.json()) as VoiceResult;
		}

		if (statusData.status === "FAILED") {
			throw new Error("fal.ai voice generation failed");
		}
	}

	throw new Error("fal.ai voice generation timed out");
}

async function runTest(
	falKey: string,
	testName: string,
	payload: Record<string, unknown>,
): Promise<any> {
	const startTime = Date.now();

	console.log(`   🧪 ${testName}`);

	try {
		const status = await submitFalJob(falKey, payload);

		if (!status.status_url || !status.response_url) {
			throw new Error("Missing status or response URL from fal.ai");
		}

		const result = await pollFalResult(
			falKey,
			status.status_url,
			status.response_url,
		);
		const latency = Date.now() - startTime;

		const hasAudio = !!(result.audio?.url ?? result.audio_url?.url);
		const audioUrl = hasAudio
			? (result.audio?.url ?? result.audio_url?.url)
			: undefined;

		if (hasAudio) {
			console.log(`      ✅ Success (${(latency / 1000).toFixed(1)}s)`);
			console.log(`      🔊 ${audioUrl}`);
		} else {
			console.log(`      ❌ No audio returned`);
		}

		return {
			testName,
			success: hasAudio,
			latency,
			audioUrl,
			payload,
		};
	} catch (error) {
		const latency = Date.now() - startTime;
		console.log(
			`      ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
		);

		return {
			testName,
			success: false,
			latency,
			error: error instanceof Error ? error.message : String(error),
			payload,
		};
	}
}

async function main() {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║        🎙️  QWEN 3 TTS - COMPREHENSIVE PARAMETER TEST                 ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	const FAL_KEY = process.env.FAL_KEY;
	if (!FAL_KEY) {
		console.error("❌ FAL_KEY not found in .env.local");
		process.exit(1);
	}
	console.log("✅ FAL_KEY found\n");

	// French wedding narration
	const text =
		"Il y a cinq ans, sous le ciel parisien, notre histoire a commencé. Une rencontre fortuite est devenue notre destin. Aujourd'hui, Laurent et Laurence vous invitent à être témoins du début de leur éternité. Rejoignez-nous pour célébrer l'amour, en ce jour si spécial.";

	console.log("🌍 Language: 🇫🇷 French");
	console.log(`📝 Text: "${text.substring(0, 60)}..."\n`);

	const results: any[] = [];

	console.log(
		"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
	);
	console.log("  BASIC PARAMETERS (5 tests)");
	console.log(
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
	);

	// Test 1: Default baseline - WITH ENOUGH TOKENS!
	results.push(
		await runTest(FAL_KEY, "1. Default baseline (with max_new_tokens=1000)", {
			text,
			voice: "Vivian",
			language: "Auto",
			max_new_tokens: 1000, // CRITICAL: default 200 is too low, causes truncation!
		}),
	);
	await wait(3000);

	// Test 2: Male voice
	results.push(
		await runTest(FAL_KEY, "2. Male voice (Dylan)", {
			text,
			voice: "Dylan",
			language: "Auto",
			max_new_tokens: 1000,
		}),
	);
	await wait(3000);

	// Test 3: Soft beginning, enthusiastic ending
	results.push(
		await runTest(FAL_KEY, "3. Style: Start softly, build to enthusiastic", {
			text,
			voice: "Vivian",
			language: "Auto",
			prompt:
				"Begin speaking very softly and gently, as if sharing an intimate secret. Gradually increase energy and warmth, building to an enthusiastic, joyful celebration at the end.",
			max_new_tokens: 1000,
		}),
	);
	await wait(3000);

	// Test 4: Warm romantic tone
	results.push(
		await runTest(FAL_KEY, "4. Style: Warm, romantic, emotional", {
			text,
			voice: "Vivian",
			language: "Auto",
			prompt:
				"Speak in a warm, romantic, and deeply emotional tone, as if announcing the most beautiful love story",
			max_new_tokens: 1000,
		}),
	);
	await wait(3000);

	// Test 5: Elegant, formal announcement
	results.push(
		await runTest(FAL_KEY, "5. Style: Elegant, formal, dignified", {
			text,
			voice: "Vivian",
			language: "Auto",
			prompt:
				"Deliver with elegant formality and dignified poise, like a sophisticated wedding announcer at a grand ceremony",
			max_new_tokens: 1000,
		}),
	);
	await wait(3000);

	console.log(
		"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
	);
	console.log("  ADVANCED ML PARAMETERS (5 tests)");
	console.log(
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
	);

	// Test 6: Low temperature
	results.push(
		await runTest(FAL_KEY, "6. Low temperature (0.5) - more deterministic", {
			text,
			voice: "Vivian",
			language: "Auto",
			temperature: 0.5,
			max_new_tokens: 1000,
		}),
	);
	await wait(3000);

	// Test 7: High temperature
	results.push(
		await runTest(FAL_KEY, "7. High temperature (1.0) - more creative", {
			text,
			voice: "Vivian",
			language: "Auto",
			temperature: 1.0,
			max_new_tokens: 1000,
		}),
	);
	await wait(3000);

	// Test 8: Low top_k
	results.push(
		await runTest(FAL_KEY, "8. Low top_k (20) - limited vocab sampling", {
			text,
			voice: "Vivian",
			language: "Auto",
			temperature: 0.9,
			top_k: 20,
			max_new_tokens: 1000,
		}),
	);
	await wait(3000);

	// Test 9: High top_p
	results.push(
		await runTest(FAL_KEY, "9. High top_p (0.95) - nucleus sampling", {
			text,
			voice: "Vivian",
			language: "Auto",
			temperature: 0.9,
			top_p: 0.95,
			max_new_tokens: 1000,
		}),
	);
	await wait(3000);

	// Test 10: High repetition penalty
	results.push(
		await runTest(
			FAL_KEY,
			"10. High repetition penalty (1.3) - avoid repetition",
			{
				text,
				voice: "Vivian",
				language: "Auto",
				temperature: 0.9,
				repetition_penalty: 1.3,
				max_new_tokens: 1000,
			},
		),
	);

	// Summary
	const successful = results.filter((r) => r.success);
	const basicTests = results.slice(0, 5);
	const advancedTests = results.slice(5);

	console.log(`\n${"=".repeat(78)}`);
	console.log("📊 QWEN 3 TTS - TEST SUMMARY");
	console.log(`${"=".repeat(78)}\n`);
	console.log(`   Total Tests:       ${results.length}`);
	console.log(`   ✅ Success:        ${successful.length}`);
	console.log(`   ❌ Failed:         ${results.length - successful.length}\n`);
	console.log(
		`   Basic Tests:       ${basicTests.filter((r) => r.success).length}/5 passed (voice + style variations)`,
	);
	console.log(
		`   Advanced Tests:    ${advancedTests.filter((r) => r.success).length}/5 passed (ML parameters)`,
	);

	if (successful.length > 0) {
		const avgLatency =
			successful.reduce((sum, r) => sum + r.latency, 0) / successful.length;
		console.log(`\n   ⏱️  Avg Latency:    ${(avgLatency / 1000).toFixed(1)}s`);
	}

	if (successful.length > 0) {
		console.log(`\n${"=".repeat(78)}`);
		console.log("🔊 AUDIO URLS (for manual quality review)");
		console.log(`${"=".repeat(78)}\n`);
		for (const result of successful) {
			console.log(`${result.testName}:`);
			console.log(`   ${result.audioUrl}\n`);
		}
	}

	console.log("✅ Qwen 3 TTS comprehensive test complete!\n");
}

main().catch(console.error);

/**
 * Music Generation Language Support Test
 * Tests fal-ai/stable-audio-25/text-to-audio
 *
 * Note: Music prompts are descriptive and go through GPT enhancement,
 * so language support is less critical than other models.
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-music-generation.ts --lang=fr
 *
 * @see convex/actions/musicGeneration.ts
 * @see docs/Understanding/ai-models-overview.md
 */

import {
	calculateSummary,
	generateRecommendation,
	getApiKeys,
	getLanguagesToTest,
	getTestScenarios,
	type LanguageCode,
	type ModelTestResults,
	printSummary,
	type ScenarioConfig,
	saveResults,
	type TestResult,
	validateApiKey,
	WEDDING_TEST_CASE,
	wait,
} from "./common";

const MODEL_ID = "fal-ai/stable-audio-25/text-to-audio";
const MODEL_CATEGORY = "Music Generation";

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
};

type AudioResult = {
	audio_file: { url: string };
};

async function submitFalJob(
	falKey: string,
	payload: Record<string, unknown>,
): Promise<QueueStatus> {
	const response = await fetch(`https://queue.fal.run/${MODEL_ID}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Key ${falKey}`,
		},
		body: JSON.stringify(payload),
	});

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
): Promise<AudioResult> {
	let attempts = 0;
	const maxAttempts = 90; // Music generation can take longer

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
			return (await resultRes.json()) as AudioResult;
		}

		if (statusData.status === "FAILED") {
			throw new Error("fal.ai music generation failed");
		}

		// Log progress every 15 attempts
		if (attempts % 15 === 0) {
			console.log(`      ... still generating (${attempts * 2}s)`);
		}
	}

	throw new Error("fal.ai music generation timed out");
}

async function testScenario(
	falKey: string,
	scenario: ScenarioConfig,
	targetLang: LanguageCode,
): Promise<TestResult> {
	const startTime = Date.now();
	const testCase = WEDDING_TEST_CASE[scenario.userContentLanguage];

	// Use the music prompt from the test case
	const prompt = testCase.musicPrompt;

	console.log(`   Testing: ${scenario.description}`);
	console.log(`   Prompt preview: "${prompt.substring(0, 60)}..."`);

	try {
		const status = await submitFalJob(falKey, {
			prompt,
			seconds_total: 30, // 30-second track for wedding video
			steps: 100,
		});

		if (!status.status_url || !status.response_url) {
			throw new Error("Missing status or response URL from fal.ai");
		}

		const result = await pollFalResult(
			falKey,
			status.status_url,
			status.response_url,
		);
		const latency = Date.now() - startTime;

		const hasAudio = !!result.audio_file?.url;

		// Quality score: 8 for success (musical quality needs manual review)
		const qualityScore = hasAudio ? 8 : 0;

		return {
			language: targetLang,
			languageName: testCase.occasion,
			scenario: scenario.scenario,
			scenarioDescription: scenario.description,
			success: hasAudio,
			latency,
			inputPrompt: prompt,
			outputSample: hasAudio
				? `🎵 ${result.audio_file.url.substring(0, 60)}...`
				: undefined,
			qualityScore,
			notes: hasAudio
				? `Music generated in ${(latency / 1000).toFixed(1)}s`
				: "No audio returned",
		};
	} catch (error) {
		return {
			language: targetLang,
			languageName: scenario.userContentLanguage.toUpperCase(),
			scenario: scenario.scenario,
			scenarioDescription: scenario.description,
			success: false,
			latency: Date.now() - startTime,
			inputPrompt: prompt,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function main() {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║        🎵 MUSIC GENERATION LANGUAGE SUPPORT TEST                      ║",
	);
	console.log(
		"║                                                                       ║",
	);
	console.log(
		"║        Testing Stable Audio 2.5 (text-to-audio)                       ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	console.log(
		"📝 Note: Music prompts are descriptive (instrument types, mood, tempo)",
	);
	console.log("   Language support is less critical as music is universal\n");

	const keys = getApiKeys();
	validateApiKey(keys.FAL_KEY, "FAL_KEY");

	const languagesToTest = getLanguagesToTest();

	console.log(`\n📋 Model: ${MODEL_ID}`);
	console.log("📋 Languages to test:");
	for (const lang of languagesToTest) {
		console.log(`   - ${lang.flag} ${lang.name} (${lang.code})`);
	}

	console.log("\n💡 Music generation takes 30-60 seconds per track");
	console.log("   Estimated cost: ~$0.02 per 30-second track\n");

	// Test each language
	for (const lang of languagesToTest) {
		if (lang.code === "en") continue;

		console.log(`\n${"=".repeat(78)}`);
		console.log(`🎵 Testing: ${lang.flag} ${lang.name}`);
		console.log(`${"=".repeat(78)}\n`);

		const scenarios = getTestScenarios(lang.code);
		const results: TestResult[] = [];

		for (const scenario of scenarios) {
			const result = await testScenario(keys.FAL_KEY!, scenario, lang.code);
			results.push(result);

			const status = result.success ? "✅" : "❌";
			console.log(
				`   ${status} ${scenario.description}: ${(result.latency / 1000).toFixed(1)}s`,
			);

			// Wait between tests
			await wait(3000);
		}

		const summary = calculateSummary(results, lang.code);
		const recommendation = generateRecommendation(summary, lang.code);

		const modelResults: ModelTestResults = {
			modelId: MODEL_ID,
			modelCategory: MODEL_CATEGORY,
			testDate: new Date().toISOString(),
			targetLanguage: lang.code,
			results,
			summary,
			recommendation,
		};

		printSummary(modelResults);
		saveResults(MODEL_ID, lang.code, modelResults);
	}

	console.log("\n✅ Music generation language test complete!\n");
	console.log("📝 Listen to generated tracks to verify they match the mood.\n");
}

main().catch(console.error);

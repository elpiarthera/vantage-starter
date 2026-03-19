/**
 * Narration (TTS) Language Support Test
 * Tests fal-ai/minimax/speech-2.6-hd with focus on pronunciation quality
 *
 * CRITICAL: French text must use French pronunciation, not English!
 *
 * Test case: Wedding announcement narration for Laurent & Laurence
 * Tests both audio generation AND pronunciation correctness.
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-narration.ts --lang=fr
 *
 * @see lib/ai/prompts/audio/narration-script.prompt.ts
 * @see docs/Understanding/ai-models-overview.md
 */

import {
	calculateSummary,
	generateRecommendation,
	getApiKeys,
	getLanguagesToTest,
	getTestScenarios,
	type LanguageCode,
	MINIMAX_LANGUAGE_CONFIG,
	type ModelTestResults,
	printSummary,
	type ScenarioConfig,
	saveResults,
	type TestResult,
	validateApiKey,
	WEDDING_TEST_CASE,
	wait,
} from "./common";

const MODEL_ID = "fal-ai/minimax/speech-2.6-hd";
const MODEL_CATEGORY = "Narration (TTS)";

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
};

type Speech26Result = {
	audio: { url: string };
	duration_ms?: number;
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
): Promise<Speech26Result> {
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
			return (await resultRes.json()) as Speech26Result;
		}

		if (statusData.status === "FAILED") {
			throw new Error("fal.ai TTS failed");
		}
	}

	throw new Error("fal.ai TTS timed out");
}

async function testScenario(
	falKey: string,
	scenario: ScenarioConfig,
	targetLang: LanguageCode,
): Promise<TestResult> {
	const startTime = Date.now();

	// Get narration script from wedding test case
	const testCase = WEDDING_TEST_CASE[scenario.userContentLanguage];
	const narrationScript = testCase.narrationScript;

	// Get language-specific TTS configuration
	const ttsConfig = MINIMAX_LANGUAGE_CONFIG[scenario.userContentLanguage];

	console.log(`   Testing: ${scenario.description}`);
	console.log(`   language_boost: "${ttsConfig.languageBoost}"`);
	console.log(`   Script preview: "${narrationScript.substring(0, 50)}..."`);

	try {
		const payload = {
			prompt: narrationScript,
			output_format: "url",
			language_boost: ttsConfig.languageBoost,
			voice_setting: {
				voice_id: ttsConfig.voiceId,
				speed: 1,
				vol: 1,
				pitch: 0,
				emotion: "happy", // Wedding = happy emotion
			},
			audio_setting: {
				sample_rate: 44100,
				bitrate: 256000,
				format: "mp3",
				channel: 2,
			},
		};

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

		const hasAudio = !!result.audio?.url;
		const durationMs = result.duration_ms || 0;

		// Quality score: 8 for success (pronunciation needs manual review)
		const qualityScore = hasAudio ? 8 : 0;

		return {
			language: targetLang,
			languageName: testCase.occasion,
			scenario: scenario.scenario,
			scenarioDescription: scenario.description,
			success: hasAudio,
			latency,
			inputPrompt: `${narrationScript.substring(0, 100)}...`,
			outputSample: hasAudio
				? `🔊 ${result.audio.url}\n   Duration: ${(durationMs / 1000).toFixed(1)}s`
				: undefined,
			qualityScore,
			notes: hasAudio
				? `Duration: ${(durationMs / 1000).toFixed(1)}s | language_boost: ${ttsConfig.languageBoost} | ⚠️ LISTEN TO VERIFY PRONUNCIATION`
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
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function main() {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║        🎙️  NARRATION (TTS) LANGUAGE SUPPORT TEST                       ║",
	);
	console.log(
		"║        ⚠️  PRONUNCIATION QUALITY - Manual verification required!       ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	console.log("📝 Test Case: Wedding narration for Laurent & Laurence");
	console.log(
		"🎯 Focus: Verify French names are pronounced with French phonetics\n",
	);

	const keys = getApiKeys();
	validateApiKey(keys.FAL_KEY, "FAL_KEY");

	const languagesToTest = getLanguagesToTest();

	console.log(`\n📋 Model: ${MODEL_ID}`);
	console.log("📋 Languages to test:");
	for (const lang of languagesToTest) {
		const config = MINIMAX_LANGUAGE_CONFIG[lang.code];
		console.log(
			`   - ${lang.flag} ${lang.name} (language_boost: "${config.languageBoost}")`,
		);
	}

	console.log(
		"\n⚠️  IMPORTANT: After test completion, LISTEN to the generated audio files",
	);
	console.log("   to verify pronunciation quality. Check that:");
	console.log("   - French: 'Laurent' sounds like 'Loh-rahn' not 'Law-rent'");
	console.log("   - Names and places use correct language phonetics\n");

	// Test each language
	for (const lang of languagesToTest) {
		if (lang.code === "en") continue; // Skip English baseline

		console.log(`\n${"=".repeat(78)}`);
		console.log(`🎙️ Testing: ${lang.flag} ${lang.name}`);
		console.log(`${"=".repeat(78)}\n`);

		const scenarios = getTestScenarios(lang.code);
		const results: TestResult[] = [];

		for (const scenario of scenarios) {
			// For TTS, we only test with target language content (no "mixed" scenario)
			if (scenario.scenario === "mixed") continue;

			const result = await testScenario(keys.FAL_KEY!, scenario, lang.code);
			results.push(result);

			const status = result.success ? "✅" : "❌";
			console.log(
				`   ${status} ${scenario.description}: ${(result.latency / 1000).toFixed(1)}s`,
			);

			if (result.outputSample) {
				console.log(`   ${result.outputSample}`);
			}

			// Rate limiting
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
			recommendation: `${recommendation} | ⚠️ Manual pronunciation verification required`,
		};

		printSummary(modelResults);
		saveResults(MODEL_ID, lang.code, modelResults);
	}

	console.log(`\n${"=".repeat(78)}`);
	console.log("✅ Narration language test complete!");
	console.log("=".repeat(78));
	console.log("\n📝 NEXT STEPS:");
	console.log("   1. Open the audio URLs in the results JSON files");
	console.log("   2. Listen to each audio file");
	console.log("   3. Verify pronunciation quality:");
	console.log("      - Names pronounced with correct language phonetics?");
	console.log("      - Natural-sounding speech cadence?");
	console.log("      - Emotion matches 'happy' wedding tone?");
	console.log("   4. Update qualityScore in results based on manual review\n");
}

main().catch(console.error);

/**
 * Comprehensive Voice Generation Test
 * Tests ALL voice models with ALL parameter variations (basic + advanced)
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-voice-generation-comprehensive.ts --lang=fr
 *   npx tsx tests/ai-language-support/test-voice-generation-comprehensive.ts --lang=all
 *
 * Tests:
 * - 3 Models: MiniMax HD, MiniMax Turbo, Qwen 3 TTS
 * - Basic parameter variations (speed, pitch, emotion, voice, etc.)
 * - Advanced parameter variations (temperature, top_k, language_boost, etc.)
 * - Multi-language support (EN, FR, DE, IT, ES, PT, RU)
 *
 * @see convex/seed/seedCompleteVoiceModels.ts
 * @see docs/Analysis/voice-generator/TTS-MODELS-ANALYSIS.md
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
	getApiKeys,
	getLanguagesToTest,
	type LanguageCode,
	validateApiKey,
	WEDDING_TEST_CASE,
	wait,
} from "./common";

// Results directory
const RESULTS_DIR = path.join(__dirname, "results", "comprehensive");
if (!fs.existsSync(RESULTS_DIR)) {
	fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

interface TestConfig {
	modelId: string;
	modelName: string;
	testName: string;
	payload: Record<string, unknown>;
	category: "basic" | "advanced";
}

interface TestResult {
	modelId: string;
	modelName: string;
	testName: string;
	category: "basic" | "advanced";
	language: LanguageCode;
	success: boolean;
	latency: number;
	audioUrl?: string;
	error?: string;
	payload: Record<string, unknown>;
}

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
	modelId: string,
	payload: Record<string, unknown>,
): Promise<QueueStatus> {
	const response = await fetch(`https://queue.fal.run/${modelId}`, {
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
	config: TestConfig,
	language: LanguageCode,
	_text: string,
): Promise<TestResult> {
	const startTime = Date.now();

	console.log(`   🧪 ${config.testName} [${config.category}]`);

	try {
		const status = await submitFalJob(falKey, config.modelId, config.payload);

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
		} else {
			console.log(`      ❌ No audio returned`);
		}

		return {
			modelId: config.modelId,
			modelName: config.modelName,
			testName: config.testName,
			category: config.category,
			language,
			success: hasAudio,
			latency,
			audioUrl,
			payload: config.payload,
		};
	} catch (error) {
		const latency = Date.now() - startTime;
		console.log(
			`      ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
		);

		return {
			modelId: config.modelId,
			modelName: config.modelName,
			testName: config.testName,
			category: config.category,
			language,
			success: false,
			latency,
			error: error instanceof Error ? error.message : String(error),
			payload: config.payload,
		};
	}
}

function generateMiniMaxTests(
	text: string,
	lang: LanguageCode,
	modelId: string,
	modelName: string,
): TestConfig[] {
	const languageBoostMap: Record<LanguageCode, string> = {
		en: "English",
		fr: "French",
		de: "German",
		it: "Italian",
		es: "Spanish",
		pt: "Portuguese",
		ru: "Russian",
	};

	const languageBoost = languageBoostMap[lang];

	return [
		// BASIC TESTS
		{
			modelId,
			modelName,
			testName: "Default (baseline)",
			category: "basic" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Wise_Woman",
					speed: 1.0,
					pitch: 0,
					vol: 1.0,
					emotion: "neutral",
				},
				language_boost: languageBoost,
			},
		},
		{
			modelId,
			modelName,
			testName: "Fast speech (speed 1.5x)",
			category: "basic" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Wise_Woman",
					speed: 1.5,
					pitch: 0,
					vol: 1.0,
					emotion: "neutral",
				},
				language_boost: languageBoost,
			},
		},
		{
			modelId,
			modelName,
			testName: "Slow speech (speed 0.7x)",
			category: "basic" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Wise_Woman",
					speed: 0.7,
					pitch: 0,
					vol: 1.0,
					emotion: "neutral",
				},
				language_boost: languageBoost,
			},
		},
		{
			modelId,
			modelName,
			testName: "Higher pitch (+5)",
			category: "basic" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Wise_Woman",
					speed: 1.0,
					pitch: 5,
					vol: 1.0,
					emotion: "neutral",
				},
				language_boost: languageBoost,
			},
		},
		{
			modelId,
			modelName,
			testName: "Lower pitch (-5)",
			category: "basic" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Wise_Woman",
					speed: 1.0,
					pitch: -5,
					vol: 1.0,
					emotion: "neutral",
				},
				language_boost: languageBoost,
			},
		},
		{
			modelId,
			modelName,
			testName: "Happy emotion",
			category: "basic" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Wise_Woman",
					speed: 1.0,
					pitch: 0,
					vol: 1.0,
					emotion: "happy",
				},
				language_boost: languageBoost,
			},
		},
		{
			modelId,
			modelName,
			testName: "Male voice (Deep_Voice_Man)",
			category: "basic" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Deep_Voice_Man",
					speed: 1.0,
					pitch: 0,
					vol: 1.0,
					emotion: "neutral",
				},
				language_boost: languageBoost,
			},
		},
		// ADVANCED TESTS
		{
			modelId,
			modelName,
			testName: "English normalization ON",
			category: "advanced" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Wise_Woman",
					speed: 1.0,
					pitch: 0,
					vol: 1.0,
					emotion: "neutral",
					english_normalization: true,
				},
				language_boost: languageBoost,
			},
		},
		{
			modelId,
			modelName,
			testName: "Auto language detection",
			category: "advanced" as const,
			payload: {
				prompt: text,
				voice_setting: {
					voice_id: "Wise_Woman",
					speed: 1.0,
					pitch: 0,
					vol: 1.0,
					emotion: "neutral",
				},
				language_boost: "auto",
			},
		},
	];
}

function generateQwenTests(text: string, lang: LanguageCode): TestConfig[] {
	const languageMap: Record<LanguageCode, string> = {
		en: "English",
		fr: "Auto",
		de: "Auto",
		it: "Auto",
		es: "Auto",
		pt: "Auto",
		ru: "Auto",
	};

	const language = languageMap[lang];
	const modelId = "fal-ai/qwen-3-tts/text-to-speech/1.7b";

	return [
		// BASIC TESTS
		{
			modelId,
			modelName: "Qwen 3 TTS",
			testName: "Default (baseline)",
			category: "basic" as const,
			payload: {
				text,
				voice: "Vivian",
				language,
			},
		},
		{
			modelId,
			modelName: "Qwen 3 TTS",
			testName: "Male voice (Dylan)",
			category: "basic" as const,
			payload: {
				text,
				voice: "Dylan",
				language,
			},
		},
		{
			modelId,
			modelName: "Qwen 3 TTS",
			testName: "With style prompt",
			category: "basic" as const,
			payload: {
				text,
				voice: "Vivian",
				language,
				prompt: "Speak in a warm, romantic, and emotional tone",
			},
		},
		// ADVANCED TESTS
		{
			modelId,
			modelName: "Qwen 3 TTS",
			testName: "Low temperature (0.5)",
			category: "advanced" as const,
			payload: {
				text,
				voice: "Vivian",
				language,
				temperature: 0.5,
			},
		},
		{
			modelId,
			modelName: "Qwen 3 TTS",
			testName: "High temperature (1.0)",
			category: "advanced" as const,
			payload: {
				text,
				voice: "Vivian",
				language,
				temperature: 1.0,
			},
		},
		{
			modelId,
			modelName: "Qwen 3 TTS",
			testName: "Low top_k (20)",
			category: "advanced" as const,
			payload: {
				text,
				voice: "Vivian",
				language,
				temperature: 0.9,
				top_k: 20,
			},
		},
		{
			modelId,
			modelName: "Qwen 3 TTS",
			testName: "High top_p (0.95)",
			category: "advanced" as const,
			payload: {
				text,
				voice: "Vivian",
				language,
				temperature: 0.9,
				top_p: 0.95,
			},
		},
		{
			modelId,
			modelName: "Qwen 3 TTS",
			testName: "High repetition penalty (1.3)",
			category: "advanced" as const,
			payload: {
				text,
				voice: "Vivian",
				language,
				temperature: 0.9,
				repetition_penalty: 1.3,
			},
		},
	];
}

async function main() {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║     🎙️  COMPREHENSIVE VOICE GENERATION TEST (ALL PARAMETERS)         ║",
	);
	console.log(
		"║                                                                       ║",
	);
	console.log(
		"║     Tests: MiniMax HD, MiniMax Turbo, Qwen 3 TTS                      ║",
	);
	console.log(
		"║     Parameters: Basic (speed, pitch, voice) + Advanced (ML)           ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	const keys = getApiKeys();
	validateApiKey(keys.FAL_KEY, "FAL_KEY");

	const languagesToTest = getLanguagesToTest();

	console.log("📋 Languages to test:");
	for (const lang of languagesToTest) {
		console.log(`   - ${lang.flag} ${lang.name} (${lang.code})`);
	}

	console.log(
		"\n💡 This will test ~27 parameter variations per language (~54 total tests)\n",
	);
	console.log("💡 Estimated cost: ~$0.27 per language\n");
	console.log("💡 Estimated time: ~30-45 minutes per language\n");

	// Test each language
	for (const lang of languagesToTest) {
		if (lang.code === "en") continue;

		console.log(`\n${"=".repeat(78)}`);
		console.log(`🌍 Testing: ${lang.flag} ${lang.name}`);
		console.log(`${"=".repeat(78)}\n`);

		const testCase = WEDDING_TEST_CASE[lang.code];
		const text = testCase.narrationScript;

		// Generate all test configurations
		const minimaxHdTests = generateMiniMaxTests(
			text,
			lang.code,
			"fal-ai/minimax/speech-2.8-hd",
			"MiniMax Speech 2.8 HD",
		);
		const minimaxTurboTests = generateMiniMaxTests(
			text,
			lang.code,
			"fal-ai/minimax/speech-2.8-turbo",
			"MiniMax Speech 2.8 Turbo",
		);
		const qwenTests = generateQwenTests(text, lang.code);

		const allTests = [...minimaxHdTests, ...minimaxTurboTests, ...qwenTests];
		const allResults: TestResult[] = [];

		// Run tests
		let testNum = 0;
		for (const testConfig of allTests) {
			testNum++;
			console.log(`\n[${testNum}/${allTests.length}] ${testConfig.modelName}`);

			if (!keys.FAL_KEY) {
				throw new Error("FAL_KEY is required");
			}

			const result = await runTest(keys.FAL_KEY, testConfig, lang.code, text);
			allResults.push(result);

			// Rate limiting
			await wait(3000);
		}

		// Generate summary
		const basicTests = allResults.filter((r) => r.category === "basic");
		const advancedTests = allResults.filter((r) => r.category === "advanced");
		const successfulTests = allResults.filter((r) => r.success);

		console.log(`\n${"=".repeat(78)}`);
		console.log(`📊 Summary for ${lang.flag} ${lang.name}`);
		console.log(`${"=".repeat(78)}`);
		console.log(`\n   Total Tests:     ${allResults.length}`);
		console.log(`   ✅ Success:      ${successfulTests.length}`);
		console.log(
			`   ❌ Failed:       ${allResults.length - successfulTests.length}`,
		);
		console.log(
			`\n   Basic Tests:     ${basicTests.filter((r) => r.success).length}/${basicTests.length} passed`,
		);
		console.log(
			`   Advanced Tests:  ${advancedTests.filter((r) => r.success).length}/${advancedTests.length} passed`,
		);

		const avgLatency =
			successfulTests.length > 0
				? successfulTests.reduce((sum, r) => sum + r.latency, 0) /
					successfulTests.length
				: 0;
		console.log(`\n   ⏱️  Avg Latency:  ${(avgLatency / 1000).toFixed(1)}s`);

		// Save detailed results
		const timestamp = new Date().toISOString().split("T")[0];
		const filename = `comprehensive-voice-test-${lang.code}-${timestamp}.json`;
		const filepath = path.join(RESULTS_DIR, filename);

		const report = {
			language: lang.code,
			languageName: lang.name,
			testDate: new Date().toISOString(),
			text,
			summary: {
				total: allResults.length,
				successful: successfulTests.length,
				failed: allResults.length - successfulTests.length,
				basicPassed: basicTests.filter((r) => r.success).length,
				basicTotal: basicTests.length,
				advancedPassed: advancedTests.filter((r) => r.success).length,
				advancedTotal: advancedTests.length,
				avgLatency: Math.round(avgLatency),
			},
			results: allResults,
		};

		fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
		console.log(`\n💾 Results saved to: ${filepath}`);

		// Extract audio URLs
		const audioUrls = successfulTests
			.filter((r) => r.audioUrl)
			.map((r) => ({
				modelName: r.modelName,
				testName: r.testName,
				category: r.category,
				url: r.audioUrl,
			}));

		if (audioUrls.length > 0) {
			const audioFilename = `audio-urls-${lang.code}-${timestamp}.json`;
			const audioFilepath = path.join(RESULTS_DIR, audioFilename);
			fs.writeFileSync(audioFilepath, JSON.stringify(audioUrls, null, 2));
			console.log(`💾 Audio URLs saved to: ${audioFilepath}\n`);
		}
	}

	console.log("\n✅ Comprehensive voice generation test complete!\n");
	console.log(
		"📝 Review audio URLs and results files for detailed analysis.\n",
	);
}

main().catch(console.error);

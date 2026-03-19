/**
 * Voice Generation Language Support Test
 * Tests fal-ai/minimax/speech-2.8-hd and fal-ai/qwen-3-tts
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-voice-generation.ts --lang=fr
 *   npx tsx tests/ai-language-support/test-voice-generation.ts --lang=all
 *   npx tsx tests/ai-language-support/test-voice-generation.ts --lang=fr --model=minimax
 *   npx tsx tests/ai-language-support/test-voice-generation.ts --lang=fr --model=qwen
 *
 * @see convex/actions/voiceToolGeneric.ts
 * @see docs/Analysis/voice-generator/TTS-MODELS-ANALYSIS.md
 */

import * as fs from "node:fs";
import * as path from "node:path";
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

// File to store generated audio URLs
const GENERATED_AUDIO_FILE = path.join(
	__dirname,
	"results",
	"generated-audio.json",
);

interface GeneratedAudio {
	[langCode: string]: {
		[scenario: string]: {
			[modelId: string]: {
				url: string;
				text: string;
				generatedAt: string;
			};
		};
	};
}

function saveGeneratedAudioUrl(
	lang: LanguageCode,
	scenario: string,
	modelId: string,
	url: string,
	text: string,
): void {
	let audio: GeneratedAudio = {};
	if (fs.existsSync(GENERATED_AUDIO_FILE)) {
		audio = JSON.parse(fs.readFileSync(GENERATED_AUDIO_FILE, "utf-8"));
	}
	if (!audio[lang]) {
		audio[lang] = {};
	}
	if (!audio[lang][scenario]) {
		audio[lang][scenario] = {};
	}
	audio[lang][scenario][modelId] = {
		url,
		text,
		generatedAt: new Date().toISOString(),
	};
	fs.writeFileSync(GENERATED_AUDIO_FILE, JSON.stringify(audio, null, 2));
	console.log(`   📁 Audio URL saved for manual review`);
}

// Voice model configurations
const VOICE_MODELS = {
	minimax_hd: {
		id: "fal-ai/minimax/speech-2.8-hd",
		name: "MiniMax Speech 2.8 HD",
		category: "Voice Generation (TTS)",
		languageMapping: {
			en: { voice_id: "Wise_Woman", language_boost: "English" },
			fr: { voice_id: "Wise_Woman", language_boost: "French" },
			de: { voice_id: "Wise_Woman", language_boost: "German" },
			it: { voice_id: "Wise_Woman", language_boost: "Italian" },
			es: { voice_id: "Wise_Woman", language_boost: "Spanish" },
			pt: { voice_id: "Wise_Woman", language_boost: "Portuguese" },
			ru: { voice_id: "Wise_Woman", language_boost: "Russian" },
		} as Record<LanguageCode, { voice_id: string; language_boost: string }>,
	},
	minimax_turbo: {
		id: "fal-ai/minimax/speech-2.8-turbo",
		name: "MiniMax Speech 2.8 Turbo",
		category: "Voice Generation (TTS)",
		languageMapping: {
			en: { voice_id: "Wise_Woman", language_boost: "English" },
			fr: { voice_id: "Wise_Woman", language_boost: "French" },
			de: { voice_id: "Wise_Woman", language_boost: "German" },
			it: { voice_id: "Wise_Woman", language_boost: "Italian" },
			es: { voice_id: "Wise_Woman", language_boost: "Spanish" },
			pt: { voice_id: "Wise_Woman", language_boost: "Portuguese" },
			ru: { voice_id: "Wise_Woman", language_boost: "Russian" },
		} as Record<LanguageCode, { voice_id: string; language_boost: string }>,
	},
	qwen: {
		id: "fal-ai/qwen-3-tts/text-to-speech/1.7b",
		name: "Qwen 3 TTS",
		category: "Voice Generation (TTS)",
		languageMapping: {
			en: { voice: "Vivian", language: "English" },
			fr: { voice: "Vivian", language: "Auto" },
			de: { voice: "Vivian", language: "Auto" },
			it: { voice: "Vivian", language: "Auto" },
			es: { voice: "Vivian", language: "Auto" },
			pt: { voice: "Vivian", language: "Auto" },
			ru: { voice: "Vivian", language: "Auto" },
		} as Record<LanguageCode, { voice: string; language: string }>,
	},
} as const;

type VoiceModelKey = keyof typeof VOICE_MODELS;

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
};

type VoiceResult = {
	audio?: { url: string };
	audio_url?: { url: string }; // Qwen might use this
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

async function testScenario(
	falKey: string,
	modelKey: VoiceModelKey,
	scenario: ScenarioConfig,
	targetLang: LanguageCode,
): Promise<TestResult> {
	const startTime = Date.now();
	const model = VOICE_MODELS[modelKey];
	const testCase = WEDDING_TEST_CASE[scenario.userContentLanguage];

	// Use narration script as voice prompt
	const text = testCase.narrationScript;

	console.log(`   Testing: ${scenario.description}`);
	console.log(`   Text preview: "${text.substring(0, 60)}..."`);

	try {
		let payload: Record<string, unknown>;

		// Build model-specific payload
		if (modelKey === "minimax_hd" || modelKey === "minimax_turbo") {
			const config = model.languageMapping[targetLang];
			if ("voice_id" in config && "language_boost" in config) {
				payload = {
					prompt: text,
					voice_setting: {
						voice_id: config.voice_id,
						speed: 1.0,
						pitch: 0,
						vol: 1.0,
						emotion: "neutral",
					},
					language_boost: config.language_boost,
				};
			} else {
				throw new Error("Invalid config for MiniMax model");
			}
		} else {
			// Qwen model
			const config = model.languageMapping[targetLang];
			if ("voice" in config && "language" in config) {
				payload = {
					text,
					voice: config.voice,
					language: config.language,
					temperature: 0.9,
				};
			} else {
				throw new Error("Invalid config for Qwen model");
			}
		}

		const status = await submitFalJob(falKey, model.id, payload);

		if (!status.status_url || !status.response_url) {
			throw new Error("Missing status or response URL from fal.ai");
		}

		const result = await pollFalResult(
			falKey,
			status.status_url,
			status.response_url,
		);
		const latency = Date.now() - startTime;

		// Handle both response formats (MiniMax uses audio.url, Qwen might use audio_url.url)
		const hasAudio = !!(result.audio?.url ?? result.audio_url?.url);
		const audioUrl = hasAudio
			? (result.audio?.url ?? result.audio_url?.url)
			: undefined;

		// Save the audio URL for manual review
		if (hasAudio && audioUrl) {
			saveGeneratedAudioUrl(
				targetLang,
				scenario.scenario,
				modelKey,
				audioUrl,
				text,
			);
		}

		// Quality score: 7 for success (audio quality needs manual review)
		const qualityScore = hasAudio ? 7 : 0;

		return {
			language: targetLang,
			languageName: testCase.occasion,
			scenario: scenario.scenario,
			scenarioDescription: scenario.description,
			success: hasAudio,
			latency,
			inputPrompt: text,
			outputSample: audioUrl ? `🔊 ${audioUrl.substring(0, 60)}...` : undefined,
			qualityScore,
			notes: hasAudio
				? `Audio generated in ${(latency / 1000).toFixed(1)}s`
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
			inputPrompt: text,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

// Parse --model argument
function getTargetModel(): VoiceModelKey | "all" {
	const args = process.argv.slice(2);
	const modelArg = args.find((arg) => arg.startsWith("--model="));
	if (modelArg) {
		const model = modelArg.split("=")[1].toLowerCase();
		if (model === "minimax") return "minimax_hd";
		if (model === "qwen") return "qwen";
		if (model === "all") return "all";
		console.error(
			`❌ Unknown model: ${model}. Use: minimax, qwen, or all (default: all)`,
		);
		process.exit(1);
	}
	return "all";
}

async function main() {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║        🎙️  VOICE GENERATION LANGUAGE SUPPORT TEST                     ║",
	);
	console.log(
		"║                                                                       ║",
	);
	console.log(
		"║        Testing MiniMax Speech 2.8 HD + Qwen 3 TTS                     ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	const keys = getApiKeys();
	validateApiKey(keys.FAL_KEY, "FAL_KEY");

	const languagesToTest = getLanguagesToTest();
	const targetModel = getTargetModel();

	const modelsToTest: VoiceModelKey[] =
		targetModel === "all"
			? ["minimax_hd", "qwen"]
			: [targetModel as VoiceModelKey];

	console.log(`\n📋 Models to test:`);
	for (const modelKey of modelsToTest) {
		console.log(`   - ${VOICE_MODELS[modelKey].name} (${modelKey})`);
	}

	console.log("\n📋 Languages to test:");
	for (const lang of languagesToTest) {
		console.log(`   - ${lang.flag} ${lang.name} (${lang.code})`);
	}

	console.log("\n💡 Estimated cost: ~$0.01 per voice generation\n");

	// Test each model
	for (const modelKey of modelsToTest) {
		const model = VOICE_MODELS[modelKey];

		console.log(`\n${"=".repeat(78)}`);
		console.log(`🎙️  Testing Model: ${model.name}`);
		console.log(`${"=".repeat(78)}`);

		// Test each language
		for (const lang of languagesToTest) {
			if (lang.code === "en") continue;

			console.log(`\n${"-".repeat(78)}`);
			console.log(`🌍 Language: ${lang.flag} ${lang.name}`);
			console.log(`${"-".repeat(78)}\n`);

			const scenarios = getTestScenarios(lang.code);
			const results: TestResult[] = [];

			for (const scenario of scenarios) {
				if (!keys.FAL_KEY) {
					throw new Error("FAL_KEY is required");
				}
				const result = await testScenario(
					keys.FAL_KEY,
					modelKey,
					scenario,
					lang.code,
				);
				results.push(result);

				const status = result.success ? "✅" : "❌";
				console.log(
					`   ${status} ${scenario.description}: ${(result.latency / 1000).toFixed(1)}s`,
				);

				// Rate limiting
				await wait(3000);
			}

			const summary = calculateSummary(results, lang.code);
			const recommendation = generateRecommendation(summary, lang.code);

			const modelResults: ModelTestResults = {
				modelId: model.id,
				modelCategory: model.category,
				testDate: new Date().toISOString(),
				targetLanguage: lang.code,
				results,
				summary,
				recommendation,
			};

			printSummary(modelResults);
			saveResults(model.id, lang.code, modelResults);

			// Wait between languages
			console.log("\n⏸️  Waiting 5s before next language...\n");
			await wait(5000);
		}
	}

	console.log("\n✅ Voice generation language test complete!\n");
	console.log(
		"📝 Review audio URLs in results to verify pronunciation quality.\n",
	);
	console.log(`💾 Audio URLs saved to: ${GENERATED_AUDIO_FILE}\n`);
}

main().catch(console.error);

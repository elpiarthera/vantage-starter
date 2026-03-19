/**
 * Image Generation Language Support Test
 * Tests fal-ai/nano-banana-pro (Gemini 3 Pro Image)
 *
 * Note: Image generation prompts go through GPT enhancement first,
 * so this test is lower priority than video generation.
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-image-generation.ts --lang=fr
 *
 * @see convex/actions/imageGeneration.ts
 * @see docs/Understanding/ai-models-overview.md
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

// File to store generated image URLs for video test
const GENERATED_IMAGES_FILE = path.join(
	__dirname,
	"results",
	"generated-images.json",
);

interface GeneratedImages {
	[langCode: string]: {
		[scenario: string]: {
			url: string;
			prompt: string;
			generatedAt: string;
		};
	};
}

function saveGeneratedImageUrl(
	lang: LanguageCode,
	scenario: string,
	url: string,
	prompt: string,
): void {
	let images: GeneratedImages = {};
	if (fs.existsSync(GENERATED_IMAGES_FILE)) {
		images = JSON.parse(fs.readFileSync(GENERATED_IMAGES_FILE, "utf-8"));
	}
	if (!images[lang]) {
		images[lang] = {};
	}
	images[lang][scenario] = {
		url,
		prompt,
		generatedAt: new Date().toISOString(),
	};
	fs.writeFileSync(GENERATED_IMAGES_FILE, JSON.stringify(images, null, 2));
	console.log(`   📁 Image URL saved for video test`);
}

const MODEL_ID = "fal-ai/nano-banana-pro";
const MODEL_CATEGORY = "Image Generation";

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
};

type ImageResult = {
	images: Array<{ url: string }>;
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
): Promise<ImageResult> {
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
			return (await resultRes.json()) as ImageResult;
		}

		if (statusData.status === "FAILED") {
			throw new Error("fal.ai image generation failed");
		}
	}

	throw new Error("fal.ai image generation timed out");
}

async function testScenario(
	falKey: string,
	scenario: ScenarioConfig,
	targetLang: LanguageCode,
): Promise<TestResult> {
	const startTime = Date.now();
	const testCase = WEDDING_TEST_CASE[scenario.userContentLanguage];

	// Use the first scene description as the image prompt
	const prompt = testCase.sceneDescriptions[0];

	console.log(`   Testing: ${scenario.description}`);
	console.log(`   Prompt preview: "${prompt.substring(0, 60)}..."`);

	try {
		const status = await submitFalJob(falKey, {
			prompt,
			aspect_ratio: "16:9",
			num_images: 1,
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

		const hasImage = !!(result.images && result.images.length > 0);
		const imageUrl = hasImage ? result.images[0].url : undefined;

		// Save the image URL for video test to use
		if (hasImage && imageUrl) {
			saveGeneratedImageUrl(targetLang, scenario.scenario, imageUrl, prompt);
		}

		// Quality score: 8 for success (visual quality needs manual review)
		const qualityScore = hasImage ? 8 : 0;

		return {
			language: targetLang,
			languageName: testCase.occasion,
			scenario: scenario.scenario,
			scenarioDescription: scenario.description,
			success: hasImage,
			latency,
			inputPrompt: prompt,
			outputSample: imageUrl ? `🖼️ ${imageUrl.substring(0, 60)}...` : undefined,
			qualityScore,
			notes: hasImage
				? `Image generated in ${(latency / 1000).toFixed(1)}s`
				: "No image returned",
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
		"║        🖼️  IMAGE GENERATION LANGUAGE SUPPORT TEST                      ║",
	);
	console.log(
		"║                                                                       ║",
	);
	console.log(
		"║        Testing Nano Banana Pro (Gemini 3 Pro Image)                   ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	console.log(
		"📝 Note: In production, image prompts go through GPT enhancement",
	);
	console.log(
		"   This test verifies if the model understands raw language prompts\n",
	);

	const keys = getApiKeys();
	validateApiKey(keys.FAL_KEY, "FAL_KEY");

	const languagesToTest = getLanguagesToTest();

	console.log(`\n📋 Model: ${MODEL_ID}`);
	console.log("📋 Languages to test:");
	for (const lang of languagesToTest) {
		console.log(`   - ${lang.flag} ${lang.name} (${lang.code})`);
	}

	console.log("\n💡 Estimated cost: ~$0.01 per image\n");

	// Test each language
	for (const lang of languagesToTest) {
		if (lang.code === "en") continue;

		console.log(`\n${"=".repeat(78)}`);
		console.log(`🖼️ Testing: ${lang.flag} ${lang.name}`);
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

			// Rate limiting
			await wait(2000);
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

	console.log("\n✅ Image generation language test complete!\n");
	console.log("📝 Review image URLs in results to verify visual quality.\n");
}

main().catch(console.error);

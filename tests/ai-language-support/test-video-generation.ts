/**
 * Video Generation Language Support Test
 * Tests fal-ai/kling-video/v2.5-turbo/pro/image-to-video
 *
 * ⚠️ CRITICAL TEST: Video prompts bypass GPT enhancement!
 * ⚠️ EXPENSIVE: ~$0.35 per 5s video
 *
 * This test verifies if Kling Video understands non-English prompts
 * since VIDEO_GENERATION_PROMPT.buildPrompt() sends user content directly.
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-video-generation.ts --lang=fr
 *
 * @see lib/ai/prompts/video/generation.prompt.ts
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

const MODEL_ID = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";
const MODEL_CATEGORY = "Video Generation";

// File where image test saves generated URLs
const GENERATED_IMAGES_FILE = path.join(
	__dirname,
	"results",
	"generated-images.json",
);

// Fallback test image if no generated images available
const FALLBACK_IMAGE_URL =
	"https://images.unsplash.com/photo-1519741497674-611481863552?w=1280&h=720&fit=crop";

interface GeneratedImages {
	[langCode: string]: {
		[scenario: string]: {
			url: string;
			prompt: string;
			generatedAt: string;
		};
	};
}

/**
 * Get image URL for video test - uses generated images from image test if available
 */
function getImageUrl(
	lang: LanguageCode,
	scenario: string,
): { url: string; source: "generated" | "fallback" } {
	if (fs.existsSync(GENERATED_IMAGES_FILE)) {
		try {
			const images: GeneratedImages = JSON.parse(
				fs.readFileSync(GENERATED_IMAGES_FILE, "utf-8"),
			);
			if (images[lang]?.[scenario]?.url) {
				return { url: images[lang][scenario].url, source: "generated" };
			}
			// Try any scenario for this language
			if (images[lang]) {
				const firstScenario = Object.values(images[lang])[0];
				if (firstScenario?.url) {
					return { url: firstScenario.url, source: "generated" };
				}
			}
		} catch {
			console.log("   ⚠️ Could not read generated images file");
		}
	}
	return { url: FALLBACK_IMAGE_URL, source: "fallback" };
}

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
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
	maxAttempts = 120, // 4 minutes max for video
): Promise<{ video: { url: string } }> {
	let attempts = 0;

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
			return (await resultRes.json()) as { video: { url: string } };
		}

		if (statusData.status === "FAILED") {
			throw new Error("fal.ai video generation failed");
		}

		// Log progress every 10 attempts
		if (attempts % 10 === 0) {
			console.log(`      ... still generating (${attempts * 2}s)`);
		}
	}

	throw new Error("fal.ai video generation timed out");
}

/**
 * Build video prompt matching VIDEO_GENERATION_PROMPT.buildPrompt() logic
 * This simulates exactly what the production code sends to Kling Video
 */
function buildVideoPrompt(
	sceneDescription: string,
	emotionalStory: string,
	occasion: string,
	theme: string,
	visualStyle: string,
	duration: 5 | 10 = 5,
): string {
	let prompt = sceneDescription.trim();

	if (emotionalStory) {
		prompt += ` Emotional context: ${emotionalStory}.`;
	}

	if (occasion) {
		prompt += ` This is for a ${occasion} video.`;
	}

	if (theme) {
		prompt += ` The overall mood is ${theme}.`;
	}

	if (visualStyle) {
		prompt += ` Visual style: ${visualStyle}.`;
	}

	if (duration === 5) {
		prompt += " Quick, dynamic pacing suitable for a 5-second clip.";
	} else {
		prompt += " Smooth, deliberate pacing suitable for a 10-second clip.";
	}

	prompt += " High quality, professional production.";

	return prompt;
}

async function testScenario(
	falKey: string,
	scenario: ScenarioConfig,
	targetLang: LanguageCode,
): Promise<TestResult> {
	const startTime = Date.now();
	const testCase = WEDDING_TEST_CASE[scenario.userContentLanguage];

	// Get image URL - prefer generated images from image test
	const { url: imageUrl, source: imageSource } = getImageUrl(
		targetLang,
		scenario.scenario,
	);

	// Build prompt exactly like production code
	const prompt = buildVideoPrompt(
		testCase.sceneDescriptions[0], // Use first scene
		testCase.personalStory,
		testCase.occasion,
		testCase.theme,
		testCase.visualStyle,
		5, // 5-second video to save costs
	);

	console.log(`   Testing: ${scenario.description}`);
	console.log(
		`   Image source: ${imageSource === "generated" ? "✅ Generated from image test" : "⚠️ Fallback (run image test first)"}`,
	);
	console.log(`   Prompt preview: "${prompt.substring(0, 80)}..."`);

	try {
		const status = await submitFalJob(falKey, {
			prompt,
			image_url: imageUrl,
			duration: "5",
			aspect_ratio: "16:9",
			cfg_scale: 0.5,
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

		const hasVideo = !!result.video?.url;

		// Quality assessment: Check if video was generated
		// Note: We can't automatically assess video quality, only generation success
		const qualityScore = hasVideo ? 8 : 0; // Manual review needed for actual quality

		return {
			language: targetLang,
			languageName: testCase.occasion.split(" ")[0],
			scenario: scenario.scenario,
			scenarioDescription: scenario.description,
			success: hasVideo,
			latency,
			inputPrompt: prompt,
			outputSample: hasVideo
				? `${result.video.url.substring(0, 60)}...`
				: undefined,
			qualityScore,
			notes: hasVideo
				? `Video generated successfully (${(latency / 1000).toFixed(1)}s)`
				: "No video returned",
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
		"║        🎬 VIDEO GENERATION LANGUAGE SUPPORT TEST                      ║",
	);
	console.log(
		"║        ⚠️  CRITICAL: Prompts bypass GPT enhancement!                  ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	console.log("⚠️  WARNING: Video generation is expensive!");
	console.log("   Cost per 5s video: ~$0.35");
	console.log("   Testing with 5-second videos to minimize costs\n");

	// Check if generated images exist
	if (fs.existsSync(GENERATED_IMAGES_FILE)) {
		console.log("✅ Found generated images from image test");
	} else {
		console.log("⚠️  No generated images found!");
		console.log("   Run image test first: pnpm test:lang:image -- --lang=fr");
		console.log("   Using fallback placeholder image instead.\n");
	}

	const keys = getApiKeys();
	validateApiKey(keys.FAL_KEY, "FAL_KEY");

	const languagesToTest = getLanguagesToTest();
	console.log(`\n📋 Model: ${MODEL_ID}`);
	console.log("📋 Languages to test:");
	for (const lang of languagesToTest) {
		console.log(`   - ${lang.flag} ${lang.name} (${lang.code})`);
	}

	console.log("\n⚠️  CRITICAL: Video prompts go directly to Kling Video!");
	console.log("   Unlike images, there is NO GPT enhancement step.");
	console.log(
		"   If Kling doesn't understand French, video quality suffers.\n",
	);

	// Test each non-English language
	for (const lang of languagesToTest) {
		if (lang.code === "en") continue; // Skip English baseline for video (too expensive)

		console.log(`\n${"=".repeat(78)}`);
		console.log(`🎬 Testing: ${lang.flag} ${lang.name}`);
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

			// Wait between tests to avoid rate limiting
			await wait(5000);
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

	console.log("\n✅ Video generation language test complete!\n");
	console.log(
		"📝 IMPORTANT: Review generated videos manually for quality assessment.",
	);
	console.log("   Video URLs are saved in the results JSON files.\n");
}

main().catch(console.error);

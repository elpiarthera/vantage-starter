/**
 * Full Pipeline Test - End-to-End Language Support Testing
 *
 * Runs all AI model tests in the REAL APP FLOW ORDER:
 *   Step 1: Text Generation → Story (GPT-4o-mini vs GPT-5-mini)
 *   Step 2: Image Generation → Scene Images (using story)
 *   Step 3: Video Generation → Video (using generated images)
 *   Step 4a: Narration → Audio TTS (using generated story)
 *   Step 4b: Music → Audio (using context)
 *
 * Each step uses REAL DATA from the previous step, making this
 * a true end-to-end integration test.
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/run-full-pipeline.ts --lang=fr
 *   npx tsx tests/ai-language-support/run-full-pipeline.ts --lang=fr --skip-video
 *
 * @see docs/Implementation/ToDo/ai-model-language-testing-plan.md
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
	getApiKeys,
	getTargetLanguage,
	type LanguageCode,
	TARGET_LANGUAGES,
	validateApiKey,
	WEDDING_TEST_CASE,
	wait,
} from "./common";
import {
	initPipeline,
	loadPipelineData,
	type PipelineData,
	printPipelineStatus,
	saveImageGenerationResult,
	saveMusicResult,
	saveNarrationResult,
	savePipelineData,
	saveReport,
	saveTextGenerationResult,
	saveVideoGenerationResult,
} from "./pipeline-data";

// ==================== CLI FLAGS ====================

function getCliFlags(): {
	skipVideo: boolean;
	skipMusic: boolean;
	onlyStep?: string;
	textModel: "gpt-4o-mini" | "gpt-5-mini";
} {
	const args = process.argv.slice(2);
	const modelArg = args.find((a) => a.startsWith("--model="))?.split("=")[1];

	return {
		skipVideo: args.includes("--skip-video"),
		skipMusic: args.includes("--skip-music"),
		onlyStep: args.find((a) => a.startsWith("--only="))?.split("=")[1],
		textModel: modelArg === "gpt-5-mini" ? "gpt-5-mini" : "gpt-4o-mini",
	};
}

// ==================== TEXT GENERATION (Step 1) ====================

async function runTextGeneration(
	apiKey: string,
	language: LanguageCode,
	pipeline: PipelineData,
	modelId: "gpt-4o-mini" | "gpt-5-mini" = "gpt-4o-mini",
): Promise<PipelineData> {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════╗",
	);
	console.log("║  📝 STEP 1: TEXT GENERATION                               ║");
	console.log(
		"╚═══════════════════════════════════════════════════════════╝\n",
	);

	const testCase = WEDDING_TEST_CASE[language];

	// Cost per 1M tokens (Standard pricing)
	const modelCosts = {
		"gpt-4o-mini": { input: 0.15, output: 0.6 },
		"gpt-5-mini": { input: 0.25, output: 2.0 },
	};

	// System prompt in English (production behavior)
	const systemPrompt = `You are an expert AI Director for emotionally resonant short-form videos.

Your task is to create a compelling video story concept based on the provided event details.

The story should:
1. Be structured for a 30-second video (approximately 75-90 words for narration)
2. Have a clear emotional arc: opening hook → emotional core → meaningful conclusion
3. Match the occasion and emotional theme perfectly
4. Be personal and authentic, not generic
5. Include specific visual scene suggestions (3-4 scenes)

IMPORTANT: Generate all content in the SAME LANGUAGE as the user's input.

Return a JSON object with:
- narrationScript: The 75-90 word narration script
- scenes: Array of 3 scene descriptions for visuals
- musicPrompt: A prompt for generating background music`;

	const userPrompt = `Occasion: ${testCase.occasion}
Event Title: ${testCase.eventTitle}
Emotional Theme: ${testCase.theme}
Visual Style: ${testCase.visualStyle}

Personal Story from the creator:
"${testCase.personalStory}"

Create a compelling narration script for this wedding video. The story should feel ${testCase.theme} and deeply personal.`;

	console.log(`   Model: ${modelId}`);
	console.log(`   Language: ${language.toUpperCase()}`);
	console.log(
		`   Prompt: Mixed (EN system + ${language.toUpperCase()} content)`,
	);

	try {
		const startTime = Date.now();
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: modelId,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userPrompt },
				],
				temperature: 0.7,
				max_tokens: 800,
				response_format: { type: "json_object" },
			}),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();
		const content = data.choices[0]?.message?.content || "{}";
		const latency = Date.now() - startTime;

		let parsed: {
			narrationScript?: string;
			scenes?: unknown[];
			musicPrompt?: string;
		};
		try {
			parsed = JSON.parse(content);
		} catch {
			// If JSON parsing fails, use the raw content
			parsed = {
				narrationScript: content,
				scenes: testCase.sceneDescriptions,
				musicPrompt: testCase.musicPrompt,
			};
		}

		// Normalize scenes to strings (GPT might return objects or mixed types)
		const normalizedScenes: string[] = (parsed.scenes || []).map((scene) => {
			if (typeof scene === "string") return scene;
			if (typeof scene === "object" && scene !== null) {
				// Handle objects like { description: "..." } or { scene: "..." }
				const s = scene as Record<string, unknown>;
				return String(
					s.description ||
						s.scene ||
						s.text ||
						s.content ||
						JSON.stringify(scene),
				);
			}
			return String(scene);
		});

		// Fallback to test case scenes if none generated
		const finalScenes =
			normalizedScenes.length > 0
				? normalizedScenes
				: testCase.sceneDescriptions;

		console.log(`   ✅ Generated in ${latency}ms`);
		console.log(
			`   📜 Narration: "${(parsed.narrationScript || "").substring(0, 80)}..."`,
		);
		console.log(`   🎬 Scenes: ${finalScenes.length} scenes generated`);

		// Estimate cost: ~500 input tokens, ~400 output tokens
		const costs = modelCosts[modelId];
		const estimatedCost = (500 * costs.input + 400 * costs.output) / 1_000_000;

		return saveTextGenerationResult(pipeline, {
			completedAt: new Date().toISOString(),
			modelUsed: modelId,
			latencyMs: latency,
			systemPrompt,
			userPrompt,
			generatedStory: parsed.narrationScript || testCase.narrationScript,
			generatedScenes: finalScenes,
			narrationScript: parsed.narrationScript || testCase.narrationScript,
			musicPrompt: parsed.musicPrompt || testCase.musicPrompt,
			rawResponse: content,
			qualityScore: 8,
			estimatedCost,
		});
	} catch (error) {
		console.error(
			`   ❌ Error: ${error instanceof Error ? error.message : error}`,
		);
		// Use fallback test case data
		return saveTextGenerationResult(pipeline, {
			completedAt: new Date().toISOString(),
			modelUsed: "fallback",
			latencyMs: 0,
			systemPrompt,
			userPrompt,
			generatedStory: testCase.narrationScript,
			generatedScenes: testCase.sceneDescriptions,
			narrationScript: testCase.narrationScript,
			musicPrompt: testCase.musicPrompt,
			qualityScore: 0,
			estimatedCost: 0,
		});
	}
}

// ==================== IMAGE GENERATION (Step 2) ====================

async function runImageGeneration(
	falKey: string,
	language: LanguageCode,
	pipeline: PipelineData,
): Promise<PipelineData> {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════╗",
	);
	console.log("║  🖼️  STEP 2: IMAGE GENERATION                              ║");
	console.log(
		"╚═══════════════════════════════════════════════════════════╝\n",
	);

	const MODEL_ID = "fal-ai/nano-banana-pro";

	// Use scenes from text generation or fallback
	const scenes =
		pipeline.textGeneration?.generatedScenes ||
		WEDDING_TEST_CASE[language].sceneDescriptions;

	console.log(`   Model: ${MODEL_ID}`);
	console.log(`   Scenes to generate: ${scenes.length}`);

	const images: Array<{
		sceneIndex: number;
		url: string;
		prompt: string;
		latencyMs: number;
	}> = [];
	const totalStartTime = Date.now();

	for (let i = 0; i < scenes.length; i++) {
		const scene = scenes[i];
		console.log(`\n   Scene ${i + 1}/${scenes.length}:`);
		console.log(`   "${scene.substring(0, 60)}..."`);

		try {
			const startTime = Date.now();

			// Submit job
			const submitRes = await fetch(`https://queue.fal.run/${MODEL_ID}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Key ${falKey}`,
				},
				body: JSON.stringify({
					prompt: scene,
					aspect_ratio: "16:9",
					num_images: 1,
				}),
			});

			if (!submitRes.ok) {
				throw new Error(`fal.ai error: ${submitRes.status}`);
			}

			const status = await submitRes.json();

			// Poll for result
			let attempts = 0;
			while (attempts < 60) {
				attempts++;
				await wait(2000);

				const statusRes = await fetch(status.status_url, {
					headers: { Authorization: `Key ${falKey}` },
				});

				if (!statusRes.ok) continue;

				const statusData = await statusRes.json();

				if (statusData.status === "COMPLETED") {
					const resultRes = await fetch(status.response_url, {
						headers: { Authorization: `Key ${falKey}` },
					});
					const result = await resultRes.json();
					const latencyMs = Date.now() - startTime;

					if (result.images?.[0]?.url) {
						images.push({
							sceneIndex: i,
							url: result.images[0].url,
							prompt: scene,
							latencyMs,
						});
						console.log(`   ✅ Generated in ${latencyMs}ms`);
					}
					break;
				}

				if (statusData.status === "FAILED") {
					throw new Error("Generation failed");
				}
			}
		} catch (error) {
			console.error(
				`   ❌ Error: ${error instanceof Error ? error.message : error}`,
			);
		}

		// Rate limiting
		await wait(1000);
	}

	const totalLatencyMs = Date.now() - totalStartTime;
	// Nano Banana Pro: ~$0.01 per image
	const estimatedCost = images.length * 0.01;

	console.log(`\n   📊 Generated ${images.length}/${scenes.length} images`);

	return saveImageGenerationResult(pipeline, {
		completedAt: new Date().toISOString(),
		modelUsed: MODEL_ID,
		latencyMs: totalLatencyMs,
		images,
		qualityScore: images.length === scenes.length ? 8 : 5,
		estimatedCost,
	});
}

// ==================== VIDEO GENERATION (Step 3) ====================

async function runVideoGeneration(
	falKey: string,
	language: LanguageCode,
	pipeline: PipelineData,
): Promise<PipelineData> {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════╗",
	);
	console.log("║  🎬 STEP 3: VIDEO GENERATION                              ║");
	console.log("║  ⚠️  CRITICAL: Prompts bypass GPT - direct to Kling       ║");
	console.log(
		"╚═══════════════════════════════════════════════════════════╝\n",
	);

	const MODEL_ID = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

	// Check for images from previous step
	if (!pipeline.imageGeneration?.images?.length) {
		console.log("   ❌ No images available from Step 2!");
		console.log("   Run image generation first.");
		return pipeline;
	}

	const testCase = WEDDING_TEST_CASE[language];
	const firstImage = pipeline.imageGeneration.images[0];
	const lastImage =
		pipeline.imageGeneration.images[pipeline.imageGeneration.images.length - 1];

	// Build prompt exactly like production code
	const buildVideoPrompt = (scene: string) => {
		let prompt = scene.trim();
		prompt += ` Emotional context: ${testCase.personalStory}.`;
		prompt += ` This is for a ${testCase.occasion} video.`;
		prompt += ` The overall mood is ${testCase.theme}.`;
		prompt += ` Visual style: ${testCase.visualStyle}.`;
		prompt += " Quick, dynamic pacing suitable for a 5-second clip.";
		prompt += " High quality, professional production.";
		return prompt;
	};

	console.log(`   Model: ${MODEL_ID}`);
	console.log(
		`   Using image from Step 2: ${firstImage.url.substring(0, 50)}...`,
	);
	console.log(`   ⚠️ Cost: ~$0.35 per 5s video`);

	const prompt = buildVideoPrompt(firstImage.prompt);
	console.log(`\n   Prompt (${language.toUpperCase()}):`);
	console.log(`   "${prompt.substring(0, 100)}..."`);

	const videos: Array<{
		sceneIndex: number;
		url: string;
		prompt: string;
		firstFrameUrl: string;
		lastFrameUrl: string;
	}> = [];

	const startTime = Date.now();
	let latencyMs = 0;

	try {
		// Submit job
		const submitRes = await fetch(`https://queue.fal.run/${MODEL_ID}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Key ${falKey}`,
			},
			body: JSON.stringify({
				prompt,
				image_url: firstImage.url,
				tail_image_url: lastImage.url,
				duration: "5",
				aspect_ratio: "16:9",
				cfg_scale: 0.5,
			}),
		});

		if (!submitRes.ok) {
			const errorText = await submitRes.text();
			throw new Error(`fal.ai error: ${submitRes.status} - ${errorText}`);
		}

		const status = await submitRes.json();
		console.log(`   ⏳ Generating video (this takes 2-4 minutes)...`);

		// Poll for result (longer timeout for video)
		let attempts = 0;
		while (attempts < 120) {
			attempts++;
			await wait(2000);

			if (attempts % 15 === 0) {
				console.log(`      ... ${attempts * 2}s elapsed`);
			}

			const statusRes = await fetch(status.status_url, {
				headers: { Authorization: `Key ${falKey}` },
			});

			if (!statusRes.ok) continue;

			const statusData = await statusRes.json();

			if (statusData.status === "COMPLETED") {
				const resultRes = await fetch(status.response_url, {
					headers: { Authorization: `Key ${falKey}` },
				});
				const result = await resultRes.json();
				latencyMs = Date.now() - startTime;

				if (result.video?.url) {
					videos.push({
						sceneIndex: 0,
						url: result.video.url,
						prompt,
						firstFrameUrl: firstImage.url,
						lastFrameUrl: lastImage.url,
					});
					console.log(
						`   ✅ Video generated in ${(latencyMs / 1000).toFixed(1)}s`,
					);
					console.log(`   🎬 URL: ${result.video.url.substring(0, 60)}...`);
				}
				break;
			}

			if (statusData.status === "FAILED") {
				throw new Error("Video generation failed");
			}
		}
	} catch (error) {
		console.error(
			`   ❌ Error: ${error instanceof Error ? error.message : error}`,
		);
		latencyMs = Date.now() - startTime;
	}

	// Kling Video 5s: ~$0.35
	const estimatedCost = videos.length > 0 ? 0.35 : 0;

	return saveVideoGenerationResult(pipeline, {
		completedAt: new Date().toISOString(),
		modelUsed: MODEL_ID,
		latencyMs,
		videos,
		qualityScore: videos.length > 0 ? 8 : 0,
		estimatedCost,
	});
}

// ==================== NARRATION (Step 4a) ====================

async function runNarration(
	falKey: string,
	language: LanguageCode,
	pipeline: PipelineData,
): Promise<PipelineData> {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════╗",
	);
	console.log("║  🎙️  STEP 4a: NARRATION (TTS)                              ║");
	console.log("║  Testing French pronunciation with MiniMax Speech 2.6     ║");
	console.log(
		"╚═══════════════════════════════════════════════════════════╝\n",
	);

	const MODEL_ID = "fal-ai/minimax/speech-2.6-hd";

	// Use narration from text generation or fallback
	const narrationScript =
		pipeline.textGeneration?.narrationScript ||
		WEDDING_TEST_CASE[language].narrationScript;

	// Clean script for TTS (remove stage directions, etc.)
	const cleanScript = narrationScript
		.replace(/\[.*?\]/g, "")
		.replace(/\(.*?\)/g, "")
		.trim();

	// Language boost for correct pronunciation
	const languageBoostMap: Record<string, string> = {
		en: "English",
		fr: "French",
		de: "German",
		it: "Italian",
		es: "Spanish",
		pt: "Portuguese",
		ru: "Russian",
	};

	const languageBoost = languageBoostMap[language] || "English";

	console.log(`   Model: ${MODEL_ID}`);
	console.log(`   Language Boost: ${languageBoost}`);
	console.log(`   Script: "${cleanScript.substring(0, 80)}..."`);

	const startTime = Date.now();

	try {
		// Submit job
		const submitRes = await fetch(`https://queue.fal.run/${MODEL_ID}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Key ${falKey}`,
			},
			body: JSON.stringify({
				text: cleanScript,
				voice_id: "Wise_Woman",
				audio_sample_rate: 32000,
				bitrate: 128000,
				language_boost: languageBoost,
			}),
		});

		if (!submitRes.ok) {
			throw new Error(`fal.ai error: ${submitRes.status}`);
		}

		const status = await submitRes.json();

		// Poll for result
		let attempts = 0;
		while (attempts < 60) {
			attempts++;
			await wait(2000);

			const statusRes = await fetch(status.status_url, {
				headers: { Authorization: `Key ${falKey}` },
			});

			if (!statusRes.ok) continue;

			const statusData = await statusRes.json();

			if (statusData.status === "COMPLETED") {
				const resultRes = await fetch(status.response_url, {
					headers: { Authorization: `Key ${falKey}` },
				});
				const result = await resultRes.json();
				const latencyMs = Date.now() - startTime;

				if (result.audio?.url) {
					console.log(`   ✅ Generated in ${latencyMs}ms`);
					console.log(
						`   🎙️ Audio URL: ${result.audio.url.substring(0, 60)}...`,
					);
					console.log(`\n   📝 MANUAL REVIEW NEEDED:`);
					console.log(
						`      - Is French text pronounced with French phonetics?`,
					);
					console.log(`      - Are accents (é, è, ê, etc.) handled correctly?`);
					console.log(`      - Is the pacing natural for French?`);

					// MiniMax TTS: ~$0.02 per generation
					const estimatedCost = 0.02;

					return saveNarrationResult(pipeline, {
						completedAt: new Date().toISOString(),
						modelUsed: MODEL_ID,
						latencyMs,
						script: cleanScript,
						languageBoost,
						audioUrl: result.audio.url,
						duration: result.audio.duration || 0,
						qualityScore: 8, // Needs manual verification
						estimatedCost,
					});
				}
				break;
			}

			if (statusData.status === "FAILED") {
				throw new Error("TTS generation failed");
			}
		}
	} catch (error) {
		console.error(
			`   ❌ Error: ${error instanceof Error ? error.message : error}`,
		);
	}

	return pipeline;
}

// ==================== MUSIC (Step 4b) ====================

async function runMusic(
	falKey: string,
	language: LanguageCode,
	pipeline: PipelineData,
): Promise<PipelineData> {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════╗",
	);
	console.log("║  🎵 STEP 4b: MUSIC GENERATION                             ║");
	console.log(
		"╚═══════════════════════════════════════════════════════════╝\n",
	);

	const MODEL_ID = "fal-ai/stable-audio-25/text-to-audio";

	// Use music prompt from text generation or fallback
	const musicPrompt =
		pipeline.textGeneration?.musicPrompt ||
		WEDDING_TEST_CASE[language].musicPrompt;

	console.log(`   Model: ${MODEL_ID}`);
	console.log(`   Duration: 30 seconds`);
	console.log(`   Prompt: "${musicPrompt.substring(0, 80)}..."`);

	const startTime = Date.now();

	try {
		// Submit job
		const submitRes = await fetch(`https://queue.fal.run/${MODEL_ID}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Key ${falKey}`,
			},
			body: JSON.stringify({
				prompt: musicPrompt,
				seconds_total: 30,
			}),
		});

		if (!submitRes.ok) {
			throw new Error(`fal.ai error: ${submitRes.status}`);
		}

		const status = await submitRes.json();

		// Poll for result
		let attempts = 0;
		while (attempts < 90) {
			attempts++;
			await wait(2000);

			if (attempts % 10 === 0) {
				console.log(`      ... ${attempts * 2}s elapsed`);
			}

			const statusRes = await fetch(status.status_url, {
				headers: { Authorization: `Key ${falKey}` },
			});

			if (!statusRes.ok) continue;

			const statusData = await statusRes.json();

			if (statusData.status === "COMPLETED") {
				const resultRes = await fetch(status.response_url, {
					headers: { Authorization: `Key ${falKey}` },
				});
				const result = await resultRes.json();
				const latencyMs = Date.now() - startTime;

				if (result.audio?.url || result.audio_file?.url) {
					const audioUrl = result.audio?.url || result.audio_file?.url;
					console.log(`   ✅ Generated in ${latencyMs}ms`);
					console.log(`   🎵 Audio URL: ${audioUrl.substring(0, 60)}...`);

					// Stable Audio: ~$0.05 per 30s
					const estimatedCost = 0.05;

					return saveMusicResult(pipeline, {
						completedAt: new Date().toISOString(),
						modelUsed: MODEL_ID,
						latencyMs,
						prompt: musicPrompt,
						audioUrl,
						duration: 30,
						qualityScore: 8,
						estimatedCost,
					});
				}
				break;
			}

			if (statusData.status === "FAILED") {
				throw new Error("Music generation failed");
			}
		}
	} catch (error) {
		console.error(
			`   ❌ Error: ${error instanceof Error ? error.message : error}`,
		);
	}

	return pipeline;
}

// ==================== MAIN ====================

async function main() {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║        🚀 FULL PIPELINE TEST - END-TO-END LANGUAGE SUPPORT           ║",
	);
	console.log(
		"║                                                                       ║",
	);
	console.log(
		"║        Real wedding test case: Laurent & Laurence                     ║",
	);
	console.log(
		"║        Theme: Romantic Warmth | Style: Cinematic                      ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	const targetLang = getTargetLanguage() as LanguageCode;
	const flags = getCliFlags();

	const langInfo = TARGET_LANGUAGES.find((l) => l.code === targetLang);
	if (!langInfo) {
		console.error(`❌ Unknown language: ${targetLang}`);
		process.exit(1);
	}

	console.log(
		`🌍 Target Language: ${langInfo.flag} ${langInfo.name} (${targetLang})`,
	);
	console.log(`🤖 Text Model: ${flags.textModel}`);
	console.log(`📋 Test Case: Wedding Announcement`);
	if (flags.skipVideo)
		console.log(`⏭️  Skipping video generation (--skip-video)`);
	if (flags.skipMusic)
		console.log(`⏭️  Skipping music generation (--skip-music)`);

	// Validate API keys
	const keys = getApiKeys();
	console.log("\n🔑 Checking API keys...");
	validateApiKey(keys.OPENAI_API_KEY, "OPENAI_API_KEY");
	validateApiKey(keys.FAL_KEY, "FAL_KEY");

	// Ensure results directory exists
	const resultsDir = path.join(__dirname, "results");
	if (!fs.existsSync(resultsDir)) {
		fs.mkdirSync(resultsDir, { recursive: true });
	}

	// Check for existing pipeline data (per model)
	let pipeline = loadPipelineData(targetLang, flags.textModel);
	if (pipeline) {
		console.log("\n📂 Found existing pipeline data:");
		printPipelineStatus(pipeline);
		console.log("\n   Continuing from last step...");
	} else {
		console.log("\n📂 Starting new pipeline...");
		pipeline = initPipeline(targetLang, "mixed", flags.textModel);
	}

	// Run steps in order
	const startTime = Date.now();

	// Step 1: Text Generation
	if (!pipeline.textGeneration || flags.onlyStep === "text") {
		pipeline = await runTextGeneration(
			keys.OPENAI_API_KEY!,
			targetLang,
			pipeline,
			flags.textModel,
		);
	} else {
		console.log("\n✅ Step 1: Text Generation (already complete)");
	}

	// Step 2: Image Generation
	if (!pipeline.imageGeneration || flags.onlyStep === "image") {
		pipeline = await runImageGeneration(keys.FAL_KEY!, targetLang, pipeline);
	} else {
		console.log("\n✅ Step 2: Image Generation (already complete)");
	}

	// Step 3: Video Generation (optional)
	if (!flags.skipVideo) {
		if (!pipeline.videoGeneration || flags.onlyStep === "video") {
			pipeline = await runVideoGeneration(keys.FAL_KEY!, targetLang, pipeline);
		} else {
			console.log("\n✅ Step 3: Video Generation (already complete)");
		}
	}

	// Step 4a: Narration
	if (!pipeline.narration || flags.onlyStep === "narration") {
		pipeline = await runNarration(keys.FAL_KEY!, targetLang, pipeline);
	} else {
		console.log("\n✅ Step 4a: Narration (already complete)");
	}

	// Step 4b: Music (optional)
	if (!flags.skipMusic) {
		if (!pipeline.music || flags.onlyStep === "music") {
			pipeline = await runMusic(keys.FAL_KEY!, targetLang, pipeline);
		} else {
			console.log("\n✅ Step 4b: Music (already complete)");
		}
	}

	const totalTimeMs = Date.now() - startTime;

	// Save total duration
	pipeline.totalDurationMs = totalTimeMs;
	savePipelineData(pipeline);

	// Generate comprehensive report
	const reportPath = saveReport(pipeline);

	// Final summary
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║                    📊 PIPELINE COMPLETE                               ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝",
	);

	printPipelineStatus(pipeline);

	// Calculate total cost
	const totalCost =
		(pipeline.textGeneration?.estimatedCost || 0) +
		(pipeline.imageGeneration?.estimatedCost || 0) +
		(pipeline.videoGeneration?.estimatedCost || 0) +
		(pipeline.narration?.estimatedCost || 0) +
		(pipeline.music?.estimatedCost || 0);

	console.log(`\n⏱️  Total Time: ${(totalTimeMs / 1000).toFixed(1)}s`);
	console.log(`💰 Estimated Cost: $${totalCost.toFixed(3)}`);
	console.log(
		`\n📁 Pipeline data: tests/ai-language-support/results/pipeline-${targetLang}.json`,
	);
	console.log(`📄 Review report: ${reportPath}`);

	console.log(
		"\n📝 OPEN THE REPORT to review all prompts, outputs, and links!\n",
	);
}

main().catch(console.error);

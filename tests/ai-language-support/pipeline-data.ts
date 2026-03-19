/**
 * Pipeline Data Management
 * Handles passing real data between test steps in the flow order
 *
 * Real App Flow:
 *   Step 1: Text Generation → Story
 *   Step 2: Image Generation → Scene Images (using story context)
 *   Step 3: Video Generation → Video (using generated images)
 *   Step 4a: Narration → Audio (using generated story)
 *   Step 4b: Music → Audio (using context)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { LanguageCode, TestScenario } from "./common";

const PIPELINE_DATA_FILE = path.join(
	__dirname,
	"results",
	"pipeline-data.json",
);

/**
 * Pipeline data structure - stores outputs from each step
 */
export interface PipelineData {
	testSessionId: string;
	startedAt: string;
	updatedAt: string;
	language: LanguageCode;
	textModel?: string;
	totalDurationMs?: number;

	// Step 1: Text Generation Results
	textGeneration?: {
		completedAt: string;
		modelUsed: string;
		latencyMs: number;
		systemPrompt: string;
		userPrompt: string;
		generatedStory: string;
		generatedScenes: string[];
		narrationScript: string;
		musicPrompt: string;
		rawResponse?: string;
		qualityScore: number;
		estimatedCost: number;
	};

	// Step 2: Image Generation Results
	imageGeneration?: {
		completedAt: string;
		modelUsed: string;
		latencyMs: number;
		images: Array<{
			sceneIndex: number;
			url: string;
			prompt: string;
			latencyMs: number;
		}>;
		qualityScore: number;
		estimatedCost: number;
	};

	// Step 3: Video Generation Results
	videoGeneration?: {
		completedAt: string;
		modelUsed: string;
		latencyMs: number;
		videos: Array<{
			sceneIndex: number;
			url: string;
			prompt: string;
			firstFrameUrl: string;
			lastFrameUrl: string;
		}>;
		qualityScore: number;
		estimatedCost: number;
	};

	// Step 4a: Narration Results
	narration?: {
		completedAt: string;
		modelUsed: string;
		latencyMs: number;
		script: string;
		languageBoost: string;
		audioUrl: string;
		duration: number;
		qualityScore: number;
		estimatedCost: number;
	};

	// Step 4b: Music Results
	music?: {
		completedAt: string;
		modelUsed: string;
		latencyMs: number;
		prompt: string;
		audioUrl: string;
		duration: number;
		qualityScore: number;
		estimatedCost: number;
	};
}

/**
 * Initialize a new pipeline session
 */
export function initPipeline(
	language: LanguageCode,
	_scenario: TestScenario,
	textModel = "gpt-4o-mini",
): PipelineData {
	const modelShort = textModel.replace("gpt-", "").replace("-mini", "m");
	const data: PipelineData = {
		testSessionId: `${language}-${modelShort}-${Date.now()}`,
		startedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		language,
		textModel,
	};

	// Ensure results directory exists
	const resultsDir = path.dirname(PIPELINE_DATA_FILE);
	if (!fs.existsSync(resultsDir)) {
		fs.mkdirSync(resultsDir, { recursive: true });
	}

	savePipelineData(data, textModel);
	return data;
}

/**
 * Load existing pipeline data
 */
export function loadPipelineData(
	language: LanguageCode,
	textModel = "gpt-4o-mini",
): PipelineData | null {
	const filePath = path.join(
		__dirname,
		"results",
		`pipeline-${language}-${textModel}.json`,
	);
	if (fs.existsSync(filePath)) {
		try {
			return JSON.parse(fs.readFileSync(filePath, "utf-8"));
		} catch {
			return null;
		}
	}
	return null;
}

/**
 * Save pipeline data
 */
export function savePipelineData(data: PipelineData, textModel?: string): void {
	const model = textModel || data.textModel || "gpt-4o-mini";
	const filePath = path.join(
		__dirname,
		"results",
		`pipeline-${data.language}-${model}.json`,
	);
	data.updatedAt = new Date().toISOString();
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Update text generation results
 */
export function saveTextGenerationResult(
	data: PipelineData,
	result: PipelineData["textGeneration"],
): PipelineData {
	data.textGeneration = result;
	savePipelineData(data);
	return data;
}

/**
 * Update image generation results
 */
export function saveImageGenerationResult(
	data: PipelineData,
	result: PipelineData["imageGeneration"],
): PipelineData {
	data.imageGeneration = result;
	savePipelineData(data);
	return data;
}

/**
 * Update video generation results
 */
export function saveVideoGenerationResult(
	data: PipelineData,
	result: PipelineData["videoGeneration"],
): PipelineData {
	data.videoGeneration = result;
	savePipelineData(data);
	return data;
}

/**
 * Update narration results
 */
export function saveNarrationResult(
	data: PipelineData,
	result: PipelineData["narration"],
): PipelineData {
	data.narration = result;
	savePipelineData(data);
	return data;
}

/**
 * Update music results
 */
export function saveMusicResult(
	data: PipelineData,
	result: PipelineData["music"],
): PipelineData {
	data.music = result;
	savePipelineData(data);
	return data;
}

/**
 * Check if a step can run based on dependencies
 */
export function canRunStep(
	data: PipelineData | null,
	step: "text" | "image" | "video" | "narration" | "music",
): { canRun: boolean; reason?: string } {
	switch (step) {
		case "text":
			return { canRun: true };

		case "image":
			// Image can use predefined test case data, no hard dependency
			return { canRun: true };

		case "video":
			if (!data?.imageGeneration?.images?.length) {
				return {
					canRun: false,
					reason: "Video generation requires images from image generation step",
				};
			}
			return { canRun: true };

		case "narration":
			// Can use predefined narration script, no hard dependency
			return { canRun: true };

		case "music":
			// Can use predefined music prompt, no hard dependency
			return { canRun: true };

		default:
			return { canRun: false, reason: "Unknown step" };
	}
}

/**
 * Print pipeline status
 */
export function printPipelineStatus(data: PipelineData | null): void {
	console.log("\n📊 Pipeline Status:");
	console.log("─".repeat(50));

	if (!data) {
		console.log("   No pipeline data found. Run text generation first.");
		return;
	}

	console.log(`   Session: ${data.testSessionId}`);
	console.log(`   Language: ${data.language.toUpperCase()}`);
	console.log(`   Started: ${data.startedAt}`);
	console.log("");

	const steps = [
		{
			name: "Step 1: Text Generation",
			done: !!data.textGeneration,
			emoji: "📝",
		},
		{
			name: "Step 2: Image Generation",
			done: !!data.imageGeneration,
			emoji: "🖼️",
		},
		{
			name: "Step 3: Video Generation",
			done: !!data.videoGeneration,
			emoji: "🎬",
		},
		{ name: "Step 4a: Narration", done: !!data.narration, emoji: "🎙️" },
		{ name: "Step 4b: Music", done: !!data.music, emoji: "🎵" },
	];

	for (const step of steps) {
		const status = step.done ? "✅" : "⬜";
		console.log(`   ${status} ${step.emoji} ${step.name}`);
	}

	console.log("─".repeat(50));
}

/**
 * Generate comprehensive markdown report for manual review
 */
export function generateReport(data: PipelineData): string {
	const lang = data.language.toUpperCase();
	const totalCost =
		(data.textGeneration?.estimatedCost || 0) +
		(data.imageGeneration?.estimatedCost || 0) +
		(data.videoGeneration?.estimatedCost || 0) +
		(data.narration?.estimatedCost || 0) +
		(data.music?.estimatedCost || 0);

	let report = `# 🌍 AI Language Support Test Report - ${lang}

**Session ID**: \`${data.testSessionId}\`
**Language**: ${lang}
**Started**: ${data.startedAt}
**Completed**: ${data.updatedAt}
**Total Duration**: ${data.totalDurationMs ? `${(data.totalDurationMs / 1000).toFixed(1)}s` : "N/A"}
**Estimated Total Cost**: $${totalCost.toFixed(3)}

---

## 📊 Summary

| Step | Model | Status | Latency | Cost |
|------|-------|--------|---------|------|
| 1. Text Generation | ${data.textGeneration?.modelUsed || "N/A"} | ${data.textGeneration ? "✅" : "⬜"} | ${data.textGeneration?.latencyMs ? `${(data.textGeneration.latencyMs / 1000).toFixed(1)}s` : "-"} | $${(data.textGeneration?.estimatedCost || 0).toFixed(3)} |
| 2. Image Generation | ${data.imageGeneration?.modelUsed || "N/A"} | ${data.imageGeneration ? "✅" : "⬜"} | ${data.imageGeneration?.latencyMs ? `${(data.imageGeneration.latencyMs / 1000).toFixed(1)}s` : "-"} | $${(data.imageGeneration?.estimatedCost || 0).toFixed(3)} |
| 3. Video Generation | ${data.videoGeneration?.modelUsed || "N/A"} | ${data.videoGeneration ? "✅" : "⬜"} | ${data.videoGeneration?.latencyMs ? `${(data.videoGeneration.latencyMs / 1000).toFixed(1)}s` : "-"} | $${(data.videoGeneration?.estimatedCost || 0).toFixed(3)} |
| 4a. Narration | ${data.narration?.modelUsed || "N/A"} | ${data.narration ? "✅" : "⬜"} | ${data.narration?.latencyMs ? `${(data.narration.latencyMs / 1000).toFixed(1)}s` : "-"} | $${(data.narration?.estimatedCost || 0).toFixed(3)} |
| 4b. Music | ${data.music?.modelUsed || "N/A"} | ${data.music ? "✅" : "⬜"} | ${data.music?.latencyMs ? `${(data.music.latencyMs / 1000).toFixed(1)}s` : "-"} | $${(data.music?.estimatedCost || 0).toFixed(3)} |

---

`;

	// Step 1: Text Generation
	if (data.textGeneration) {
		const tg = data.textGeneration;
		report += `## 📝 Step 1: Text Generation

**Model**: \`${tg.modelUsed}\`
**Latency**: ${tg.latencyMs ? `${(tg.latencyMs / 1000).toFixed(1)}s` : "N/A"}
**Cost**: $${(tg.estimatedCost || 0).toFixed(3)}

${
	tg.systemPrompt
		? `### System Prompt (English)
\`\`\`
${tg.systemPrompt}
\`\`\``
		: ""
}

${
	tg.userPrompt
		? `### User Prompt (${lang})
\`\`\`
${tg.userPrompt}
\`\`\``
		: ""
}

### Generated Story
> ${tg.generatedStory}

### Generated Scenes
${tg.generatedScenes.map((s, i) => `${i + 1}. ${s}`).join("\n")}

### Generated Narration Script
> ${tg.narrationScript}

### Generated Music Prompt
> ${tg.musicPrompt}

---

`;
	}

	// Step 2: Image Generation
	if (data.imageGeneration) {
		const ig = data.imageGeneration;
		report += `## 🖼️ Step 2: Image Generation

**Model**: \`${ig.modelUsed}\`
**Total Latency**: ${ig.latencyMs ? `${(ig.latencyMs / 1000).toFixed(1)}s` : "N/A"}
**Cost**: $${(ig.estimatedCost || 0).toFixed(3)}
**Images Generated**: ${ig.images.length}

`;
		for (const img of ig.images) {
			report += `### Image ${img.sceneIndex + 1}

**Prompt (${lang})**:
> ${img.prompt}

**Generated Image**: [View Image](${img.url})

![Scene ${img.sceneIndex + 1}](${img.url})

${img.latencyMs ? `**Latency**: ${(img.latencyMs / 1000).toFixed(1)}s` : ""}

---

`;
		}
	}

	// Step 3: Video Generation
	if (data.videoGeneration) {
		const vg = data.videoGeneration;
		report += `## 🎬 Step 3: Video Generation ⚠️ CRITICAL

**⚠️ This prompt bypasses GPT - sent directly to Kling Video!**

**Model**: \`${vg.modelUsed}\`
**Latency**: ${vg.latencyMs ? `${(vg.latencyMs / 1000).toFixed(1)}s` : "N/A"}
**Cost**: $${(vg.estimatedCost || 0).toFixed(3)}

`;
		for (const vid of vg.videos) {
			report += `### Video ${vid.sceneIndex + 1}

**First Frame Image**: [View](${vid.firstFrameUrl})
**Last Frame Image**: [View](${vid.lastFrameUrl})

**Full Prompt Sent to Kling (${lang})**:
\`\`\`
${vid.prompt}
\`\`\`

**Generated Video**: [▶️ Watch Video](${vid.url})

### ✅ Review Checklist
- [ ] Does the video motion match the ${lang} scene description?
- [ ] Is the visual style "Cinematic"?
- [ ] Does it feel like a wedding announcement?
- [ ] Any visual artifacts or issues?

---

`;
		}
	}

	// Step 4a: Narration
	if (data.narration) {
		const nr = data.narration;
		report += `## 🎙️ Step 4a: Narration (TTS) ⚠️ PRONUNCIATION CHECK

**Model**: \`${nr.modelUsed}\`
**Language Boost**: \`${nr.languageBoost || "N/A"}\`
**Latency**: ${nr.latencyMs ? `${(nr.latencyMs / 1000).toFixed(1)}s` : "N/A"}
**Duration**: ${nr.duration}s
**Cost**: $${(nr.estimatedCost || 0).toFixed(3)}

### Script Sent to TTS (${lang})
\`\`\`
${nr.script}
\`\`\`

**Generated Audio**: [🔊 Listen to Narration](${nr.audioUrl})

### ✅ Pronunciation Review Checklist
- [ ] Is "Laurent et Laurence" pronounced with ${lang} phonetics?
- [ ] Are accents (é, è, ê, etc.) handled correctly?
- [ ] Is the speech pacing natural for ${lang}?
- [ ] Is the emotion appropriate (wedding/romantic)?
- [ ] Any mispronunciations?

---

`;
	}

	// Step 4b: Music
	if (data.music) {
		const mu = data.music;
		report += `## 🎵 Step 4b: Music Generation

**Model**: \`${mu.modelUsed}\`
**Latency**: ${mu.latencyMs ? `${(mu.latencyMs / 1000).toFixed(1)}s` : "N/A"}
**Duration**: ${mu.duration}s
**Cost**: $${(mu.estimatedCost || 0).toFixed(3)}

### Music Prompt (${lang})
\`\`\`
${mu.prompt}
\`\`\`

**Generated Music**: [🎵 Listen to Music](${mu.audioUrl})

### ✅ Music Review Checklist
- [ ] Does the music match the "Romantic Warmth" theme?
- [ ] Is it suitable for a wedding announcement?
- [ ] Good audio quality?
- [ ] Appropriate length (~30s)?

---

`;
	}

	// Final section
	report += `## 📋 Final Review

### Overall Language Support Assessment

| Criterion | Pass/Fail | Notes |
|-----------|-----------|-------|
| Text generates in ${lang} | ⬜ | |
| Images match ${lang} descriptions | ⬜ | |
| Video understands ${lang} prompts | ⬜ | |
| TTS pronunciation is correct | ⬜ | |
| Music matches ${lang} prompt | ⬜ | |

### Recommendation
_Fill in after review_

---

**Report Generated**: ${new Date().toISOString()}
`;

	return report;
}

/**
 * Save report to markdown file
 */
export function saveReport(data: PipelineData): string {
	const report = generateReport(data);
	const model = data.textModel || "gpt-4o-mini";
	const modelShort = model.replace("gpt-", "").replace("-mini", "m");
	const reportPath = path.join(
		__dirname,
		"results",
		`REPORT-${data.language.toUpperCase()}-${modelShort}-${new Date().toISOString().split("T")[0]}.md`,
	);
	fs.writeFileSync(reportPath, report);
	return reportPath;
}

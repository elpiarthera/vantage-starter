/**
 * AI Cost Calculation Helper
 * Centralizes pricing logic for all AI services
 *
 * Pricing as of Feb 2026:
 * - OpenAI GPT-4o: $0.0025/1K input, $0.01/1K output (all AI chat/generation)
 * - OpenAI GPT-4o-mini: $0.00015/1K input, $0.0006/1K output (image enhancement only)
 * - Together.ai Llama 3.1 8B: $0.0002/1K tokens
 * - fal.ai Nano Banana Pro (Gemini 3 Pro): $0.15/image
 * - fal.ai Seedream v4: $0.03/image
 * - fal.ai Kling Video v2.5 Turbo Pro: ~$0.70/10s video ($0.07/sec)
 * - fal.ai Stable Audio 2.5: $0.20/request (flat rate)
 * - Rendi xfade video merge: ~$0.05/operation
 * - Rendi audio+video merge: ~$0.02/operation
 * - Rendi audio mix: ~$0.03/operation
 */

export interface CostCalculationInput {
	inputTokens?: number;
	outputTokens?: number;
	imageCount?: number;
	videoSeconds?: number;
	audioSeconds?: number;
}

export interface CostCalculationResult {
	cost: number;
	breakdown: {
		input?: number;
		output?: number;
		images?: number;
		video?: number;
		audio?: number;
	};
}

/**
 * Calculate cost for AI service usage
 */
export function calculateAICost(
	service: "openai" | "together" | "fal" | "rendi",
	model: string,
	usage: CostCalculationInput,
): CostCalculationResult {
	const breakdown: CostCalculationResult["breakdown"] = {};
	let cost = 0;

	// Rendi pricing
	if (service === "rendi") {
		if (model.includes("xfade")) {
			// Video merge with xfade
			cost = 0.05;
		} else if (model.includes("mix")) {
			// Audio mix with sidechain
			cost = 0.03;
		} else if (model.includes("merge") || model.includes("mux")) {
			// Final A/V merge
			cost = 0.02;
		} else {
			// Blended average
			cost = 0.03;
		}
		breakdown.video = cost;
	}

	// OpenAI pricing
	if (service === "openai") {
		if (model === "gpt-4o") {
			// GPT-4o pricing (used for all AI chat and story generation)
			if (usage.inputTokens) {
				breakdown.input = (usage.inputTokens / 1000) * 0.0025;
				cost += breakdown.input;
			}
			if (usage.outputTokens) {
				breakdown.output = (usage.outputTokens / 1000) * 0.01;
				cost += breakdown.output;
			}
		} else if (model === "gpt-4o-mini") {
			// GPT-4o-mini pricing (used for image enhancement only)
			if (usage.inputTokens) {
				breakdown.input = (usage.inputTokens / 1000) * 0.00015;
				cost += breakdown.input;
			}
			if (usage.outputTokens) {
				breakdown.output = (usage.outputTokens / 1000) * 0.0006;
				cost += breakdown.output;
			}
		}
	}

	// Together.ai pricing
	if (service === "together") {
		const totalTokens = (usage.inputTokens || 0) + (usage.outputTokens || 0);
		if (totalTokens > 0) {
			breakdown.input = (totalTokens / 1000) * 0.0002;
			cost += breakdown.input;
		}
	}

	// fal.ai pricing
	if (service === "fal") {
		if (usage.imageCount && usage.imageCount > 0) {
			// Model-specific pricing for images
			if (model === "nano-banana-pro" || model === "nano-banana-pro-edit") {
				// Nano Banana Pro (Gemini 3 Pro): $0.15/image
				breakdown.images = usage.imageCount * 0.15;
			} else if (
				model === "nano-banana-2" ||
				model === "fal-ai/nano-banana-2"
			) {
				// Nano Banana 2: $0.08/image base
				breakdown.images = usage.imageCount * 0.08;
			} else if (model === "seedream-v4" || model === "seedream-v4-edit") {
				// Seedream v4: $0.03/image
				breakdown.images = usage.imageCount * 0.03;
			} else if (model === "flux-schnell") {
				// Flux Schnell (legacy): $0.04/image
				breakdown.images = usage.imageCount * 0.04;
			} else {
				// Default fallback pricing
				breakdown.images = usage.imageCount * 0.05;
			}
			cost += breakdown.images;
		}
		// Video pricing (Kling Video v2.5 Turbo Pro)
		if (usage.videoSeconds && usage.videoSeconds > 0) {
			// $0.07/second for Kling Video v2.5
			breakdown.video = usage.videoSeconds * 0.07;
			cost += breakdown.video;
		}
		// Audio pricing (music, narration)
		if (usage.audioSeconds && usage.audioSeconds > 0) {
			if (
				model === "stable-audio-25" ||
				model === "fal-ai/stable-audio-25/text-to-audio"
			) {
				// Stable Audio 2.5: $0.20 flat rate per request
				breakdown.audio = 0.2;
			} else {
				// Default audio pricing (MiniMax, etc.): ~$0.005/second
				breakdown.audio = usage.audioSeconds * 0.005;
			}
			cost += breakdown.audio;
		}
	}

	return { cost, breakdown };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
	if (cost < 0.01) {
		return `$${cost.toFixed(4)}`;
	}
	return `$${cost.toFixed(2)}`;
}

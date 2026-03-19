"use node";

import { v } from "convex/values";
import { calculateAICost } from "../../lib/ai/costCalculation";
import { IMAGE_ENHANCEMENT_PROMPT } from "../../lib/ai/prompts";
import { api } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Enhance image prompts using AI for better quality
 * Uses OpenAI with Together.ai fallback
 * Includes concrete cost tracking to usageTracking table
 */
export const enhanceImagePrompt = action({
	args: {
		description: v.string(),
		frameType: v.union(v.literal("start"), v.literal("end")),
		projectId: v.optional(v.string()), // For cost tracking
		sceneId: v.optional(v.string()), // For cost tracking
		cinematicStyles: v.optional(
			v.object({
				ambiance: v.string(),
				cameraMovement: v.string(),
				colorTone: v.string(),
				visualStyle: v.string(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const openaiKey = process.env.OPENAI_API_KEY;
		const togetherKey = process.env.TOGETHER_API_KEY;
		const startTime = Date.now();

		// Build base prompt
		let basePrompt = `${args.description}, ${args.frameType} frame`;

		if (args.cinematicStyles) {
			const { ambiance, cameraMovement, colorTone, visualStyle } =
				args.cinematicStyles;
			if (ambiance) basePrompt += `, ${ambiance} ambiance`;
			if (cameraMovement) basePrompt += `, ${cameraMovement} camera movement`;
			if (colorTone) basePrompt += `, ${colorTone} color tone`;
			if (visualStyle) basePrompt += `, ${visualStyle} visual style`;
		}

		try {
			let enhanced: string;
			let provider: string;
			let inputTokens = 0;
			let outputTokens = 0;

			// Try OpenAI first (primary)
			if (openaiKey) {
				console.log("[PromptEnhance] Using OpenAI (primary)");
				const result = await enhanceWithOpenAI(openaiKey, basePrompt);
				enhanced = result.enhanced;
				inputTokens = result.inputTokens;
				outputTokens = result.outputTokens;
				provider = "openai";
			}
			// Fallback to Together.ai
			else if (togetherKey) {
				console.log("[PromptEnhance] Using Together.ai (fallback)");
				const result = await enhanceWithTogether(togetherKey, basePrompt);
				enhanced = result.enhanced;
				inputTokens = result.inputTokens;
				outputTokens = result.outputTokens;
				provider = "together";
			}
			// No AI available, return enhanced base prompt
			else {
				console.log("[PromptEnhance] No AI available, using base prompt");
				enhanced = IMAGE_ENHANCEMENT_PROMPT.buildFallbackPrompt(basePrompt);
				provider = "fallback";
			}

			const latency = Date.now() - startTime;

			// Calculate cost and log to usageTracking
			if (provider !== "fallback") {
				const { cost } = calculateAICost(
					provider as "openai" | "together",
					provider === "openai"
						? "gpt-4o-mini"
						: "Meta-Llama-3.1-8B-Instruct-Turbo",
					{ inputTokens, outputTokens },
				);

			// Log usage to Convex
			try {
				await ctx.runMutation(api.usageTracking.logAIUsage, {
					userId: identity.subject,
					projectId: args.projectId,
						resourceType: "image",
						resourceId: args.sceneId,
						eventType: "enhancement",
						service: provider,
						model:
							provider === "openai"
								? "gpt-4o-mini"
								: "Meta-Llama-3.1-8B-Instruct-Turbo",
						creditsUsed: Math.ceil((inputTokens + outputTokens) / 1000),
						cost,
						metadata: {
							inputTokens,
							outputTokens,
							latency,
							success: true,
						},
					});
					console.log(`[PromptEnhance] Cost tracked: $${cost.toFixed(4)}`);
				} catch (trackingError) {
					console.error("[PromptEnhance] Failed to log usage:", trackingError);
					// Don't fail the request if tracking fails
				}
			}

			return { enhanced, provider };
		} catch (error) {
			console.error("[PromptEnhance] Error:", error);

		// Log error to usage tracking
		try {
			await ctx.runMutation(api.usageTracking.logAIUsage, {
				userId: identity.subject,
				projectId: args.projectId,
					resourceType: "image",
					resourceId: args.sceneId,
					eventType: "enhancement",
					service: "error",
					model: "unknown",
					creditsUsed: 0,
					cost: 0,
					metadata: {
						success: false,
						error: error instanceof Error ? error.message : "Unknown error",
						latency: Date.now() - startTime,
					},
				});
			} catch (trackingError) {
				console.error("[PromptEnhance] Failed to log error:", trackingError);
			}

			// Return enhanced base prompt as fallback
			return {
				enhanced: IMAGE_ENHANCEMENT_PROMPT.buildFallbackPrompt(basePrompt),
				provider: "error-fallback",
			};
		}
	},
});

/**
 * Enhance prompt using OpenAI GPT-4o-mini
 */
async function enhanceWithOpenAI(
	apiKey: string,
	basePrompt: string,
): Promise<{
	enhanced: string;
	inputTokens: number;
	outputTokens: number;
}> {
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: "gpt-4o-mini", // Cheaper model for prompt enhancement
			messages: [
				{
					role: "system",
					content: IMAGE_ENHANCEMENT_PROMPT.system,
				},
				{
					role: "user",
					content: IMAGE_ENHANCEMENT_PROMPT.buildUserPrompt(basePrompt),
				},
			],
			temperature: IMAGE_ENHANCEMENT_PROMPT.metadata.temperature,
			max_tokens: IMAGE_ENHANCEMENT_PROMPT.metadata.maxTokens,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OpenAI error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	return {
		enhanced: data.choices[0].message.content.trim(),
		inputTokens: data.usage?.prompt_tokens || 0,
		outputTokens: data.usage?.completion_tokens || 0,
	};
}

/**
 * Enhance prompt using Together.ai Llama 3.1 8B
 */
async function enhanceWithTogether(
	apiKey: string,
	basePrompt: string,
): Promise<{
	enhanced: string;
	inputTokens: number;
	outputTokens: number;
}> {
	const response = await fetch("https://api.together.xyz/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
			messages: [
				{
					role: "system",
					content: IMAGE_ENHANCEMENT_PROMPT.system,
				},
				{
					role: "user",
					content: IMAGE_ENHANCEMENT_PROMPT.buildUserPrompt(basePrompt),
				},
			],
			temperature: IMAGE_ENHANCEMENT_PROMPT.metadata.temperature,
			max_tokens: IMAGE_ENHANCEMENT_PROMPT.metadata.maxTokens,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Together.ai error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	return {
		enhanced: data.choices[0].message.content.trim(),
		inputTokens: data.usage?.prompt_tokens || 0,
		outputTokens: data.usage?.completion_tokens || 0,
	};
}

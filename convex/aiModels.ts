/**
 * AI Models Management
 *
 * CRUD operations for the global AI model catalog.
 * Models are platform-level — no workspace scoping.
 * Admins manage; all authenticated users read enabled models.
 *
 * Model Schema:
 * - modelId: Internal ID used in code (e.g., "gpt-4o")
 * - gatewayModel: Vercel AI Gateway path (e.g., "openai/gpt-4o")
 * - displayName: Public name for users (e.g., "GPT-4o")
 * - description: Short description
 * - logoUrl: Provider logo URL from Vercel AI Gateway
 * - provider: anthropic | openai | google | xai | deepseek | meta | mistral
 * - contextWindow: Max input tokens
 * - maxOutput: Max output tokens
 * - bestAt: What the model excels at
 * - category: flagship | balanced | fast | reasoning | coding | vision
 * - inputCostPerMillion/outputCostPerMillion: Pricing per million tokens
 * - supportsCache/cacheReadCostPerMillion/cacheWriteCostPerMillion: Caching
 * - supportsWebSearch/webSearchCostPer1K: Web search capability
 * - supportsVision/Tools/Streaming/Reasoning: Feature flags
 *
 * Data source: Vercel AI Gateway (https://vercel.com/ai-gateway/models)
 * Last updated: January 17, 2026
 */

import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

// Shared validators — defined once, reused across all functions
const providerValidator = v.union(
	v.literal("anthropic"),
	v.literal("openai"),
	v.literal("google"),
	v.literal("xai"),
	v.literal("deepseek"),
	v.literal("meta"),
	v.literal("mistral"),
);

const categoryValidator = v.union(
	v.literal("flagship"),
	v.literal("balanced"),
	v.literal("fast"),
	v.literal("reasoning"),
	v.literal("coding"),
	v.literal("vision"),
);

// Full document shape for returns validators
const aiModelDocValidator = v.object({
	_id: v.id("aiModels"),
	_creationTime: v.number(),
	modelId: v.string(),
	gatewayModel: v.string(),
	displayName: v.string(),
	description: v.string(),
	logoUrl: v.optional(v.string()),
	provider: providerValidator,
	contextWindow: v.number(),
	maxOutput: v.number(),
	bestAt: v.string(),
	inputCostPerMillion: v.optional(v.number()),
	outputCostPerMillion: v.optional(v.number()),
	supportsCache: v.optional(v.boolean()),
	cacheReadCostPerMillion: v.optional(v.number()),
	cacheWriteCostPerMillion: v.optional(v.number()),
	supportsWebSearch: v.optional(v.boolean()),
	webSearchCostPer1K: v.optional(v.number()),
	category: categoryValidator,
	supportsVision: v.optional(v.boolean()),
	supportsTools: v.optional(v.boolean()),
	supportsStreaming: v.optional(v.boolean()),
	supportsReasoning: v.optional(v.boolean()),
	isEnabled: v.boolean(),
	isDefault: v.optional(v.boolean()),
	orderPosition: v.optional(v.number()),
	createdAt: v.number(),
	updatedAt: v.number(),
});

type ModelCategory =
	| "flagship"
	| "balanced"
	| "fast"
	| "reasoning"
	| "coding"
	| "vision";

const CATEGORY_ORDER: ModelCategory[] = [
	"flagship",
	"balanced",
	"fast",
	"reasoning",
	"coding",
	"vision",
];

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all enabled AI models (for model selector UI).
 * Sorted by category order, then orderPosition.
 * No auth required — unauthenticated pages can display the model list.
 */
export const list = query({
	args: {},
	returns: v.array(aiModelDocValidator),
	handler: async (ctx) => {
		const models = await ctx.db
			.query("aiModels")
			.withIndex("by_enabled", (q) => q.eq("isEnabled", true))
			.collect();

		return models.sort((a, b) => {
			const catDiff =
				CATEGORY_ORDER.indexOf(a.category as ModelCategory) -
				CATEGORY_ORDER.indexOf(b.category as ModelCategory);
			if (catDiff !== 0) return catDiff;
			return (a.orderPosition ?? 0) - (b.orderPosition ?? 0);
		});
	},
});

/**
 * Get all AI models including disabled (for admin panel).
 * Sorted by category order, then orderPosition.
 */
export const listAll = query({
	args: {},
	returns: v.array(aiModelDocValidator),
	handler: async (ctx) => {
		const models = await ctx.db.query("aiModels").collect();

		return models.sort((a, b) => {
			const catDiff =
				CATEGORY_ORDER.indexOf(a.category as ModelCategory) -
				CATEGORY_ORDER.indexOf(b.category as ModelCategory);
			if (catDiff !== 0) return catDiff;
			return (a.orderPosition ?? 0) - (b.orderPosition ?? 0);
		});
	},
});

/**
 * Get a single model by its modelId string.
 */
export const getByModelId = query({
	args: { modelId: v.string() },
	returns: v.union(aiModelDocValidator, v.null()),
	handler: async (ctx, { modelId }) => {
		return await ctx.db
			.query("aiModels")
			.withIndex("by_model_id", (q) => q.eq("modelId", modelId))
			.first();
	},
});

/**
 * Get the platform default model.
 * Priority: isDefault flag → first "balanced" → first enabled.
 */
export const getDefault = query({
	args: {},
	returns: v.union(aiModelDocValidator, v.null()),
	handler: async (ctx) => {
		const models = await ctx.db
			.query("aiModels")
			.withIndex("by_enabled", (q) => q.eq("isEnabled", true))
			.collect();

		const defaultModel = models.find((m) => m.isDefault);
		if (defaultModel) return defaultModel;

		const balanced = models.find((m) => m.category === "balanced");
		if (balanced) return balanced;

		return models[0] ?? null;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new AI model. Admin only.
 */
export const create = mutation({
	args: {
		modelId: v.string(),
		gatewayModel: v.string(),
		displayName: v.string(),
		description: v.string(),
		provider: providerValidator,
		contextWindow: v.number(),
		maxOutput: v.number(),
		bestAt: v.string(),
		category: categoryValidator,
		logoUrl: v.optional(v.string()),
		inputCostPerMillion: v.optional(v.number()),
		outputCostPerMillion: v.optional(v.number()),
		supportsCache: v.optional(v.boolean()),
		cacheReadCostPerMillion: v.optional(v.number()),
		cacheWriteCostPerMillion: v.optional(v.number()),
		supportsWebSearch: v.optional(v.boolean()),
		webSearchCostPer1K: v.optional(v.number()),
		supportsVision: v.optional(v.boolean()),
		supportsTools: v.optional(v.boolean()),
		supportsStreaming: v.optional(v.boolean()),
		supportsReasoning: v.optional(v.boolean()),
		isEnabled: v.optional(v.boolean()),
		isDefault: v.optional(v.boolean()),
		orderPosition: v.optional(v.number()),
	},
	returns: v.id("aiModels"),
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const existing = await ctx.db
			.query("aiModels")
			.withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
			.first();

		if (existing) {
			throw new Error(`Model with ID "${args.modelId}" already exists`);
		}

		const now = Date.now();
		return await ctx.db.insert("aiModels", {
			...args,
			isEnabled: args.isEnabled ?? true,
			orderPosition: args.orderPosition ?? 0,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Update an AI model. Admin only.
 * modelId is intentionally not updatable — it is a stable reference key.
 */
export const update = mutation({
	args: {
		id: v.id("aiModels"),
		gatewayModel: v.optional(v.string()),
		displayName: v.optional(v.string()),
		description: v.optional(v.string()),
		logoUrl: v.optional(v.string()),
		contextWindow: v.optional(v.number()),
		maxOutput: v.optional(v.number()),
		bestAt: v.optional(v.string()),
		category: v.optional(categoryValidator),
		inputCostPerMillion: v.optional(v.number()),
		outputCostPerMillion: v.optional(v.number()),
		supportsCache: v.optional(v.boolean()),
		cacheReadCostPerMillion: v.optional(v.number()),
		cacheWriteCostPerMillion: v.optional(v.number()),
		supportsWebSearch: v.optional(v.boolean()),
		webSearchCostPer1K: v.optional(v.number()),
		supportsVision: v.optional(v.boolean()),
		supportsTools: v.optional(v.boolean()),
		supportsStreaming: v.optional(v.boolean()),
		supportsReasoning: v.optional(v.boolean()),
		isEnabled: v.optional(v.boolean()),
		orderPosition: v.optional(v.number()),
	},
	returns: v.id("aiModels"),
	handler: async (ctx, { id, ...updates }) => {
		await requireAdmin(ctx);

		const model = await ctx.db.get(id);
		if (!model) throw new Error("Model not found");

		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});

		return id;
	},
});

/**
 * Toggle a model enabled/disabled. Admin only.
 * Returns the new enabled state.
 */
export const toggle = mutation({
	args: { id: v.id("aiModels") },
	returns: v.boolean(),
	handler: async (ctx, { id }) => {
		await requireAdmin(ctx);

		const model = await ctx.db.get(id);
		if (!model) throw new Error("Model not found");

		await ctx.db.patch(id, {
			isEnabled: !model.isEnabled,
			updatedAt: Date.now(),
		});

		return !model.isEnabled;
	},
});

/**
 * Set a model as the platform default. Admin only.
 * Clears the existing default first, then marks the new one.
 * Also force-enables the new default (a disabled model cannot be default).
 */
export const setDefault = mutation({
	args: { id: v.id("aiModels") },
	returns: v.id("aiModels"),
	handler: async (ctx, { id }) => {
		await requireAdmin(ctx);

		const model = await ctx.db.get(id);
		if (!model) throw new Error("Model not found");

		// Clear existing default
		const models = await ctx.db.query("aiModels").collect();
		for (const m of models) {
			if (m.isDefault) {
				await ctx.db.patch(m._id, { isDefault: false, updatedAt: Date.now() });
			}
		}

		// Set new default and force-enable
		await ctx.db.patch(id, {
			isDefault: true,
			isEnabled: true,
			updatedAt: Date.now(),
		});

		return id;
	},
});

/**
 * Delete an AI model. Admin only.
 */
export const remove = mutation({
	args: { id: v.id("aiModels") },
	returns: v.id("aiModels"),
	handler: async (ctx, { id }) => {
		await requireAdmin(ctx);

		const model = await ctx.db.get(id);
		if (!model) throw new Error("Model not found");

		await ctx.db.delete(id);
		return id;
	},
});

// ============================================================================
// INTERNAL MUTATIONS (seeding — no auth, invoked via CLI or crons only)
// ============================================================================

/**
 * Clear all models. Internal only — used before re-seeding.
 */
export const clearAll = internalMutation({
	args: {},
	returns: v.object({ deleted: v.number() }),
	handler: async (ctx) => {
		const models = await ctx.db.query("aiModels").collect();
		for (const model of models) {
			await ctx.db.delete(model._id);
		}
		console.log(`[aiModels.clearAll] Deleted ${models.length} models`);
		return { deleted: models.length };
	},
});

/**
 * Seed default AI models with accurate specifications.
 * Run once to populate the initial catalog. Skips if models already exist.
 *
 * Data sources (January 17, 2026):
 * - Anthropic: https://docs.anthropic.com/en/docs/about-claude/models
 * - OpenAI: https://platform.openai.com/docs/models
 * - Google: https://ai.google.dev/gemini-api/docs/models/gemini
 * - xAI: https://docs.x.ai/docs/models
 * - DeepSeek: https://platform.deepseek.com/api-docs
 * - Mistral: https://docs.mistral.ai/getting-started/models/
 */
export const seed = internalMutation({
	args: {},
	returns: v.object({ seeded: v.boolean(), count: v.number() }),
	handler: async (ctx) => {
		const existing = await ctx.db.query("aiModels").first();
		if (existing) {
			console.log("[aiModels.seed] Models already exist, skipping seed");
			return { seeded: false, count: 0 };
		}

		const now = Date.now();

		// Logo URLs from Vercel AI Gateway
		const logos = {
			anthropic:
				"https://vercel.com/vc-ap-vercel-marketing/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fai-gateway%2Flogos%2Fanthropic.png&w=64&q=75",
			openai:
				"https://vercel.com/vc-ap-vercel-marketing/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fai-gateway%2Flogos%2Fopenai.png&w=64&q=75",
			google:
				"https://vercel.com/vc-ap-vercel-marketing/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fai-gateway%2Flogos%2Fgoogle.png&w=64&q=75",
			xai: "https://vercel.com/vc-ap-vercel-marketing/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fai-gateway%2Flogos%2Fxai.png&w=64&q=75",
			deepseek:
				"https://vercel.com/vc-ap-vercel-marketing/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fai-gateway%2Flogos%2Fdeepseek.png&w=64&q=75",
			mistral:
				"https://vercel.com/vc-ap-vercel-marketing/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fai-gateway%2Flogos%2Fmistral.png&w=64&q=75",
		};

		const models = [
			// =================================================================
			// FLAGSHIP — Latest & greatest from each provider
			// =================================================================
			{
				modelId: "claude-sonnet-4.5",
				gatewayModel: "anthropic/claude-sonnet-4.5",
				displayName: "Claude Sonnet 4.5",
				description: "Best balance of quality & speed",
				logoUrl: logos.anthropic,
				provider: "anthropic" as const,
				contextWindow: 200000,
				maxOutput: 64000,
				bestAt: "Complex reasoning & analysis",
				category: "flagship" as const,
				inputCostPerMillion: 3.0,
				outputCostPerMillion: 15.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.3,
				cacheWriteCostPerMillion: 3.75,
				supportsWebSearch: true,
				webSearchCostPer1K: 10.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				isDefault: true,
				orderPosition: 1,
			},
			{
				modelId: "gpt-5.2",
				gatewayModel: "openai/gpt-5.2",
				displayName: "GPT-5.2",
				description: "Best general-purpose & agentic",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 400000,
				maxOutput: 128000,
				bestAt: "General & agentic tasks",
				category: "flagship" as const,
				inputCostPerMillion: 1.75,
				outputCostPerMillion: 14.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.17,
				supportsWebSearch: true,
				webSearchCostPer1K: 10.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 2,
			},
			{
				modelId: "gemini-3-pro-preview",
				gatewayModel: "google/gemini-3-pro-preview",
				displayName: "Gemini 3 Pro",
				description: "1M context, complex reasoning",
				logoUrl: logos.google,
				provider: "google" as const,
				contextWindow: 1000000,
				maxOutput: 64000,
				bestAt: "Coding, planning, reasoning",
				category: "flagship" as const,
				inputCostPerMillion: 2.0,
				outputCostPerMillion: 12.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.2,
				supportsWebSearch: true,
				webSearchCostPer1K: 14.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 3,
			},
			{
				modelId: "grok-4",
				gatewayModel: "xai/grok-4",
				displayName: "Grok 4",
				description: "Unparalleled math & reasoning",
				logoUrl: logos.xai,
				provider: "xai" as const,
				contextWindow: 256000,
				maxOutput: 256000,
				bestAt: "Math, reasoning, general",
				category: "flagship" as const,
				inputCostPerMillion: 3.0,
				outputCostPerMillion: 15.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 4,
			},

			// =================================================================
			// BALANCED — Good balance of speed/quality/cost
			// =================================================================
			{
				modelId: "gpt-5-chat",
				gatewayModel: "openai/gpt-5-chat",
				displayName: "GPT-5 Chat",
				description: "GPT-5 snapshot for ChatGPT",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 128000,
				maxOutput: 16000,
				bestAt: "Chat & general tasks",
				category: "balanced" as const,
				inputCostPerMillion: 1.25,
				outputCostPerMillion: 10.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.13,
				supportsWebSearch: true,
				webSearchCostPer1K: 10.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 1,
			},
			{
				modelId: "gemini-2.5-flash",
				gatewayModel: "google/gemini-2.5-flash",
				displayName: "Gemini 2.5 Flash",
				description: "Thinking model, 1M context",
				logoUrl: logos.google,
				provider: "google" as const,
				contextWindow: 1000000,
				maxOutput: 66000,
				bestAt: "Price/performance balance",
				category: "balanced" as const,
				inputCostPerMillion: 0.3,
				outputCostPerMillion: 2.5,
				supportsCache: true,
				cacheReadCostPerMillion: 0.03,
				supportsWebSearch: true,
				webSearchCostPer1K: 35.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 2,
			},
			{
				modelId: "claude-3.7-sonnet",
				gatewayModel: "anthropic/claude-3.7-sonnet",
				displayName: "Claude 3.7 Sonnet",
				description: "Hybrid reasoning & coding",
				logoUrl: logos.anthropic,
				provider: "anthropic" as const,
				contextWindow: 200000,
				maxOutput: 64000,
				bestAt: "Coding, content, analysis",
				category: "balanced" as const,
				inputCostPerMillion: 3.0,
				outputCostPerMillion: 15.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.3,
				cacheWriteCostPerMillion: 3.75,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				supportsReasoning: true,
				orderPosition: 3,
			},
			{
				modelId: "deepseek-v3.2",
				gatewayModel: "deepseek/deepseek-v3.2",
				displayName: "DeepSeek V3.2",
				description: "Best value for coding",
				logoUrl: logos.deepseek,
				provider: "deepseek" as const,
				contextWindow: 164000,
				maxOutput: 66000,
				bestAt: "Code & technical tasks",
				category: "balanced" as const,
				inputCostPerMillion: 0.27,
				outputCostPerMillion: 0.4,
				supportsCache: true,
				cacheReadCostPerMillion: 0.03,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 4,
			},

			// =================================================================
			// FAST — Optimized for speed & cost
			// =================================================================
			{
				modelId: "claude-haiku-4.5",
				gatewayModel: "anthropic/claude-haiku-4.5",
				displayName: "Claude Haiku 4.5",
				description: "Fast, matches Sonnet 4 quality",
				logoUrl: logos.anthropic,
				provider: "anthropic" as const,
				contextWindow: 200000,
				maxOutput: 64000,
				bestAt: "Coding, agents, computer use",
				category: "fast" as const,
				inputCostPerMillion: 1.0,
				outputCostPerMillion: 5.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.1,
				cacheWriteCostPerMillion: 1.25,
				supportsWebSearch: true,
				webSearchCostPer1K: 10.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 1,
			},
			{
				modelId: "gemini-3-flash",
				gatewayModel: "google/gemini-3-flash",
				displayName: "Gemini 3 Flash",
				description: "Speed + search grounding",
				logoUrl: logos.google,
				provider: "google" as const,
				contextWindow: 1000000,
				maxOutput: 65000,
				bestAt: "Speed-critical tasks",
				category: "fast" as const,
				inputCostPerMillion: 0.5,
				outputCostPerMillion: 3.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.05,
				supportsWebSearch: true,
				webSearchCostPer1K: 14.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 2,
			},
			{
				modelId: "gemini-2.5-flash-lite",
				gatewayModel: "google/gemini-2.5-flash-lite",
				displayName: "Gemini 2.5 Flash Lite",
				description: "Cheapest Google, 1M context",
				logoUrl: logos.google,
				provider: "google" as const,
				contextWindow: 1049000,
				maxOutput: 66000,
				bestAt: "Bulk processing",
				category: "fast" as const,
				inputCostPerMillion: 0.1,
				outputCostPerMillion: 0.4,
				supportsCache: true,
				cacheReadCostPerMillion: 0.01,
				supportsWebSearch: true,
				webSearchCostPer1K: 35.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 3,
			},
			{
				modelId: "gpt-5-mini",
				gatewayModel: "openai/gpt-5-mini",
				displayName: "GPT-5 Mini",
				description: "Cost optimized, 400K context",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 400000,
				maxOutput: 128000,
				bestAt: "Speed, cost, capability",
				category: "fast" as const,
				inputCostPerMillion: 0.25,
				outputCostPerMillion: 2.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.03,
				supportsWebSearch: true,
				webSearchCostPer1K: 10.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 4,
			},
			{
				modelId: "gpt-5-nano",
				gatewayModel: "openai/gpt-5-nano",
				displayName: "GPT-5 Nano",
				description: "Cheapest OpenAI, 400K context",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 400000,
				maxOutput: 128000,
				bestAt: "Classification, simple tasks",
				category: "fast" as const,
				inputCostPerMillion: 0.05,
				outputCostPerMillion: 0.4,
				supportsCache: true,
				cacheReadCostPerMillion: 0.01,
				supportsWebSearch: true,
				webSearchCostPer1K: 10.0,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 5,
			},
			{
				modelId: "grok-4-fast",
				gatewayModel: "xai/grok-4-fast-non-reasoning",
				displayName: "Grok 4 Fast",
				description: "2M context, ultra cheap",
				logoUrl: logos.xai,
				provider: "xai" as const,
				contextWindow: 2000000,
				maxOutput: 30000,
				bestAt: "Speed with huge context",
				category: "fast" as const,
				inputCostPerMillion: 0.2,
				outputCostPerMillion: 0.5,
				supportsCache: true,
				cacheReadCostPerMillion: 0.05,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 6,
			},

			// =================================================================
			// REASONING — Extended thinking / chain-of-thought
			// =================================================================
			{
				modelId: "claude-opus-4.5",
				gatewayModel: "anthropic/claude-opus-4.5",
				displayName: "Claude Opus 4.5",
				description: "Best reasoning (premium)",
				logoUrl: logos.anthropic,
				provider: "anthropic" as const,
				contextWindow: 200000,
				maxOutput: 64000,
				bestAt: "Complex reasoning, vision",
				category: "reasoning" as const,
				inputCostPerMillion: 5.0,
				outputCostPerMillion: 25.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.5,
				cacheWriteCostPerMillion: 6.25,
				supportsVision: true,
				supportsTools: true,
				supportsStreaming: true,
				supportsReasoning: true,
				orderPosition: 1,
			},
			{
				modelId: "o3",
				gatewayModel: "openai/o3",
				displayName: "OpenAI o3",
				description: "Most powerful reasoning",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 200000,
				maxOutput: 100000,
				bestAt: "Coding, math, science",
				category: "reasoning" as const,
				inputCostPerMillion: 2.0,
				outputCostPerMillion: 8.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.5,
				supportsVision: true,
				supportsReasoning: true,
				supportsStreaming: true,
				orderPosition: 2,
			},
			{
				modelId: "o3-mini",
				gatewayModel: "openai/o3-mini",
				displayName: "OpenAI o3 Mini",
				description: "Fast reasoning, low cost",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 200000,
				maxOutput: 100000,
				bestAt: "Quick reasoning tasks",
				category: "reasoning" as const,
				inputCostPerMillion: 1.1,
				outputCostPerMillion: 4.4,
				supportsCache: true,
				cacheReadCostPerMillion: 0.55,
				supportsReasoning: true,
				supportsStreaming: true,
				orderPosition: 3,
			},
			{
				modelId: "o4-mini",
				gatewayModel: "openai/o4-mini",
				displayName: "OpenAI o4 Mini",
				description: "Fast reasoning, math & code",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 200000,
				maxOutput: 100000,
				bestAt: "Math, coding, visual",
				category: "reasoning" as const,
				inputCostPerMillion: 1.1,
				outputCostPerMillion: 4.4,
				supportsCache: true,
				cacheReadCostPerMillion: 0.28,
				supportsVision: true,
				supportsReasoning: true,
				supportsStreaming: true,
				orderPosition: 4,
			},
			{
				modelId: "deepseek-v3.2-thinking",
				gatewayModel: "deepseek/deepseek-v3.2-thinking",
				displayName: "DeepSeek Thinking",
				description: "Chain-of-thought reasoning",
				logoUrl: logos.deepseek,
				provider: "deepseek" as const,
				contextWindow: 128000,
				maxOutput: 64000,
				bestAt: "Step-by-step reasoning",
				category: "reasoning" as const,
				inputCostPerMillion: 0.28,
				outputCostPerMillion: 0.42,
				supportsCache: true,
				cacheReadCostPerMillion: 0.03,
				supportsReasoning: true,
				supportsStreaming: true,
				orderPosition: 5,
			},
			{
				modelId: "deepseek-r1",
				gatewayModel: "deepseek/deepseek-r1",
				displayName: "DeepSeek R1",
				description: "Deep reasoning model",
				logoUrl: logos.deepseek,
				provider: "deepseek" as const,
				contextWindow: 164000,
				maxOutput: 16000,
				bestAt: "Deep reasoning",
				category: "reasoning" as const,
				inputCostPerMillion: 0.5,
				outputCostPerMillion: 2.15,
				supportsCache: true,
				cacheReadCostPerMillion: 0.4,
				supportsReasoning: true,
				supportsStreaming: true,
				orderPosition: 6,
			},

			// =================================================================
			// CODING — Optimized for code
			// =================================================================
			{
				modelId: "gpt-5-codex",
				gatewayModel: "openai/gpt-5-codex",
				displayName: "GPT-5 Codex",
				description: "Optimized for agentic coding",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 400000,
				maxOutput: 128000,
				bestAt: "Code generation & review",
				category: "coding" as const,
				inputCostPerMillion: 1.25,
				outputCostPerMillion: 10.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.13,
				supportsWebSearch: true,
				webSearchCostPer1K: 10.0,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 1,
			},
			{
				modelId: "gpt-5.2-codex",
				gatewayModel: "openai/gpt-5.2-codex",
				displayName: "GPT-5.2 Codex",
				description: "Refactors, migrations, security",
				logoUrl: logos.openai,
				provider: "openai" as const,
				contextWindow: 400000,
				maxOutput: 128000,
				bestAt: "Long-horizon coding",
				category: "coding" as const,
				inputCostPerMillion: 1.75,
				outputCostPerMillion: 14.0,
				supportsCache: true,
				cacheReadCostPerMillion: 0.17,
				supportsWebSearch: true,
				webSearchCostPer1K: 10.0,
				supportsTools: true,
				supportsStreaming: true,
				orderPosition: 2,
			},
			{
				modelId: "grok-code-fast-1",
				gatewayModel: "xai/grok-code-fast-1",
				displayName: "Grok Code Fast",
				description: "Fast coding, 256K context",
				logoUrl: logos.xai,
				provider: "xai" as const,
				contextWindow: 256000,
				maxOutput: 256000,
				bestAt: "Code completion & debug",
				category: "coding" as const,
				inputCostPerMillion: 0.2,
				outputCostPerMillion: 1.5,
				supportsCache: true,
				cacheReadCostPerMillion: 0.02,
				supportsStreaming: true,
				orderPosition: 3,
			},
			{
				modelId: "mistral-codestral",
				gatewayModel: "mistral/codestral",
				displayName: "Codestral",
				description: "Low-latency FIM & code",
				logoUrl: logos.mistral,
				provider: "mistral" as const,
				contextWindow: 128000,
				maxOutput: 4000,
				bestAt: "Fill-in-middle, tests",
				category: "coding" as const,
				inputCostPerMillion: 0.3,
				outputCostPerMillion: 0.9,
				supportsStreaming: true,
				orderPosition: 4,
			},
		];

		for (const model of models) {
			await ctx.db.insert("aiModels", {
				...model,
				isEnabled: true,
				createdAt: now,
				updatedAt: now,
			});
		}

		console.log(`[aiModels.seed] Seeded ${models.length} models`);
		return { seeded: true, count: models.length };
	},
});

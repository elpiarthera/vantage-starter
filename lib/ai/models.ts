/**
 * AI Model Catalog
 *
 * Static fallback catalog — used when Convex is not yet loaded.
 * Primary source of truth in production: Convex `systemConfig` table
 * (key: "ai_models") or a dedicated `aiModels` table.
 *
 * Ported from vantage-studio/lib/ai/models.ts and adapted for VantageStarter.
 */

// Default model
export const DEFAULT_CHAT_MODEL = "claude-sonnet-4-5";

export type ModelTier = "premium" | "balanced" | "fast" | "specialized";
export type ModelProvider =
	| "anthropic"
	| "openai"
	| "google"
	| "xai"
	| "deepseek";

export interface ChatModel {
	id: string;
	name: string;
	description: string;
	tier: ModelTier;
	provider: ModelProvider;
	/** Credits cost per 1K input tokens (optional — used for metering) */
	creditCostPer1kTokens?: number;
}

// ============================================================================
// FALLBACK CATALOG
// ============================================================================

export const chatModels: ChatModel[] = [
	// === PREMIUM ===
	{
		id: "claude-sonnet-4-5",
		name: "Claude Sonnet 4.5",
		description: "Best Anthropic model — balanced quality and speed",
		tier: "premium",
		provider: "anthropic",
		creditCostPer1kTokens: 3,
	},
	{
		id: "claude-opus-4-5",
		name: "Claude Opus 4.5",
		description: "Best reasoning — use for complex tasks",
		tier: "premium",
		provider: "anthropic",
		creditCostPer1kTokens: 15,
	},
	{
		id: "gpt-4o",
		name: "GPT-4o",
		description: "OpenAI flagship — multimodal",
		tier: "premium",
		provider: "openai",
		creditCostPer1kTokens: 5,
	},
	{
		id: "gemini-2.0-pro",
		name: "Gemini 2.0 Pro",
		description: "Google flagship — 2M context",
		tier: "premium",
		provider: "google",
		creditCostPer1kTokens: 4,
	},

	// === BALANCED ===
	{
		id: "claude-3-7-sonnet-20250219",
		name: "Claude 3.7 Sonnet",
		description: "Previous gen Anthropic — still excellent",
		tier: "balanced",
		provider: "anthropic",
		creditCostPer1kTokens: 3,
	},
	{
		id: "gpt-4o-mini",
		name: "GPT-4o Mini",
		description: "Fast affordable GPT-4o variant",
		tier: "balanced",
		provider: "openai",
		creditCostPer1kTokens: 1,
	},
	{
		id: "gemini-2.0-flash",
		name: "Gemini 2.0 Flash",
		description: "Fast Google — 1M context",
		tier: "balanced",
		provider: "google",
		creditCostPer1kTokens: 1,
	},
	{
		id: "deepseek-chat",
		name: "DeepSeek V3",
		description: "Best value for coding tasks",
		tier: "balanced",
		provider: "deepseek",
		creditCostPer1kTokens: 1,
	},

	// === FAST ===
	{
		id: "claude-haiku-3-5",
		name: "Claude Haiku 3.5",
		description: "Fastest Anthropic model",
		tier: "fast",
		provider: "anthropic",
		creditCostPer1kTokens: 1,
	},
	{
		id: "gemini-2.0-flash-lite",
		name: "Gemini 2.0 Flash Lite",
		description: "Cheapest Google model",
		tier: "fast",
		provider: "google",
		creditCostPer1kTokens: 0,
	},
];

// ============================================================================
// HELPERS
// ============================================================================

export function getModelsByTier(tier: ModelTier): ChatModel[] {
	return chatModels.filter((m) => m.tier === tier);
}

export function getModelById(id: string): ChatModel | undefined {
	return chatModels.find((m) => m.id === id);
}

export const tierLabels: Record<ModelTier, string> = {
	premium: "Premium",
	balanced: "Balanced",
	fast: "Fast & Cheap",
	specialized: "Specialized",
};

export const tierOrder: ModelTier[] = [
	"premium",
	"balanced",
	"fast",
	"specialized",
];

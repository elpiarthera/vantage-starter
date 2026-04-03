import { gateway } from "@ai-sdk/gateway";
import { customProvider, type LanguageModel } from "ai";

/**
 * AI Provider Configuration
 *
 * Uses Vercel AI Gateway for multi-provider access with a single API key.
 * The gateway provides access to Anthropic, OpenAI, Google, xAI, DeepSeek, and more.
 *
 * Environment variable: AI_GATEWAY_API_KEY
 *
 * DYNAMIC MODEL SYSTEM:
 * Models are stored in Convex `aiModels` table and can be managed by admins.
 * The API route queries Convex for the gatewayModel path when processing requests.
 *
 * FALLBACK MODELS:
 * If a model isn't found in Convex, we fall back to hardcoded defaults.
 * This ensures backwards compatibility with existing chats.
 */

// Default gateway models (fallback if Convex lookup fails)
// Source: gateway.getAvailableModels() API response (January 2026)
// Format: modelId -> gatewayModel (provider/model-name)
const DEFAULT_GATEWAY_MODELS: Record<string, string> = {
	// === SYSTEM MODELS ===
	"chat-model": "anthropic/claude-sonnet-4.5",
	"chat-model-reasoning": "anthropic/claude-opus-4.5",
	"title-model": "anthropic/claude-haiku-4.5",

	// === FLAGSHIP ===
	"claude-sonnet-4.5": "anthropic/claude-sonnet-4.5",
	"gpt-5.2": "openai/gpt-5.2",
	"gemini-3-pro-preview": "google/gemini-3-pro-preview",
	"grok-4": "xai/grok-4",

	// === BALANCED ===
	"gpt-5-chat": "openai/gpt-5-chat",
	"gemini-2.5-flash": "google/gemini-2.5-flash",
	"claude-3.7-sonnet": "anthropic/claude-3.7-sonnet",
	"deepseek-v3.2": "deepseek/deepseek-v3.2",

	// === FAST ===
	"claude-haiku-4.5": "anthropic/claude-haiku-4.5",
	"gemini-3-flash": "google/gemini-3-flash",
	"gemini-2.5-flash-lite": "google/gemini-2.5-flash-lite",
	"gpt-5-mini": "openai/gpt-5-mini",
	"gpt-5-nano": "openai/gpt-5-nano",
	"grok-4-fast": "xai/grok-4-fast-non-reasoning",

	// === REASONING ===
	"claude-opus-4.5": "anthropic/claude-opus-4.5",
	o3: "openai/o3",
	"o3-mini": "openai/o3-mini",
	"o4-mini": "openai/o4-mini",
	"deepseek-v3.2-thinking": "deepseek/deepseek-v3.2-thinking",
	"deepseek-r1": "deepseek/deepseek-r1",

	// === CODING ===
	"gpt-5-codex": "openai/gpt-5-codex",
	"gpt-5.2-codex": "openai/gpt-5.2-codex",
	"grok-code-fast-1": "xai/grok-code-fast-1",
	"mistral-codestral": "mistral/codestral",

	// === MODELS CATALOG ALIASES (models.ts IDs with hyphens) ===
	// Anthropic
	"claude-sonnet-4-5": "anthropic/claude-sonnet-4.5",
	"claude-opus-4-5": "anthropic/claude-opus-4.5",
	"claude-haiku-4-5": "anthropic/claude-haiku-4.5",
	"claude-haiku-3-5": "anthropic/claude-haiku-3.5",
	"claude-3-7-sonnet-20250219": "anthropic/claude-3-7-sonnet-20250219",
	// OpenAI
	"gpt-4o": "openai/gpt-4o",
	"gpt-4o-mini": "openai/gpt-4o-mini",
	// Google
	"gemini-2.0-flash": "google/gemini-2.0-flash",
	"gemini-2.0-flash-lite": "google/gemini-2.0-flash-lite",
	"gemini-2.0-pro": "google/gemini-2.0-pro",
	// DeepSeek
	"deepseek-chat": "deepseek/deepseek-chat",
};

/**
 * Get a language model from the gateway.
 *
 * Priority:
 * 1. gatewayModelOverride — direct path from Convex (most authoritative)
 * 2. DEFAULT_GATEWAY_MODELS fallback map
 * 3. modelId used as-is as a gateway path (allows "openai/gpt-4o-2024-11-20" style IDs)
 */
export function getModelFromGateway(
	modelId: string,
	gatewayModelOverride?: string,
): LanguageModel {
	if (gatewayModelOverride) {
		return gateway(gatewayModelOverride);
	}

	const gatewayModel = DEFAULT_GATEWAY_MODELS[modelId];
	if (gatewayModel) {
		return gateway(gatewayModel);
	}

	console.warn(
		`[providers] Model "${modelId}" not found in defaults, using as gateway path`,
	);
	return gateway(modelId);
}

// Production provider — backwards compat for code using myProvider.languageModel()
const productionProvider = customProvider({
	languageModels: Object.fromEntries(
		Object.entries(DEFAULT_GATEWAY_MODELS).map(([id, gatewayModel]) => [
			id,
			gateway(gatewayModel),
		]),
	),
});

export const myProvider = productionProvider;

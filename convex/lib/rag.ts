/**
 * RAG (Retrieval-Augmented Generation) Wrapper
 *
 * Thin wrapper around @convex-dev/rag.
 * Namespaced per workspace: "kb-{workspaceId}"
 *
 * Activated for AI SDK v6 — uses openai.embedding() (v6 API).
 * RAG constructor uses `textEmbeddingModel` field name.
 */

import { components } from "../_generated/api";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import type { Id } from "../_generated/dataModel";

// ============================================================================
// RAG CLIENT
// ============================================================================

export const ragClient = new RAG(components.rag, {
	textEmbeddingModel: openai.embedding("text-embedding-3-small"),
	embeddingDimension: 1536,
});

// ============================================================================
// NAMESPACE HELPERS
// ============================================================================

/**
 * Get the RAG namespace for a workspace.
 * All documents indexed for a workspace are stored under "kb-{workspaceId}".
 */
export function getWorkspaceNamespace(workspaceId: Id<"workspaces">): string {
	return `kb-${workspaceId}`;
}

/**
 * Get the RAG namespace for a user's personal knowledge base.
 */
export function getUserNamespace(clerkUserId: string): string {
	return `user-${clerkUserId}`;
}

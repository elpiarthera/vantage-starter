/**
 * RAG (Retrieval-Augmented Generation) Wrapper
 *
 * Thin wrapper around @convex-dev/rag.
 * Namespaced per workspace: "kb-{workspaceId}"
 *
 * DEPENDENCY NOTE:
 * @convex-dev/rag@0.7.x requires ai@^6.0.0.
 * This project currently uses ai@5.x for streaming.
 * Upgrade ai to ^6.0.0 before using ragClient in production.
 *
 * The RAG component IS wired in convex.config.ts (tables are created).
 * This file will be activated after the ai@6 upgrade.
 *
 * Usage (after ai@6 upgrade):
 *   const results = await ragClient.search(ctx, {
 *     namespace: getWorkspaceNamespace(workspaceId),
 *     text: query,
 *     limit: 5,
 *   });
 */

import type { Id } from "../_generated/dataModel";

// ============================================================================
// NAMESPACE HELPERS (version-independent)
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

// ============================================================================
// RAG CLIENT (activate after ai@6 upgrade)
// ============================================================================
// Uncomment after upgrading to ai@^6.0.0:
//
// import { components } from "../_generated/api";
// import { RAG } from "@convex-dev/rag";
// import { openai } from "@ai-sdk/openai";
//
// export const ragClient = new RAG(components.rag, {
//   textEmbeddingModel: openai.embedding("text-embedding-3-small"),
//   embeddingDimension: 1536,
// });

"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Generation } from "../types";

/**
 * Map Convex imageToolHistory doc to Generation shape for existing UI components.
 */
function mapEntryToGeneration(entry: Doc<"imageToolHistory">): Generation {
	const imageUrl = entry.imageUrl ?? entry.imageUrls?.[0] ?? null;
	return {
		id: entry._id.toString(),
		status: "complete",
		progress: 100,
		imageUrl,
		prompt: entry.prompt,
		timestamp: entry.createdAt,
		mode: entry.mode,
		aspectRatio: entry.aspectRatio,
	};
}

/**
 * Convex-backed paginated history for Image Tool.
 * Uses listByUserPaginated with cursor-based infinite scroll.
 * Replaces the legacy useQuery-based hook that hard-capped at 50 items.
 */
export function useConvexImageHistory(initialLimit = 50) {
	const { results, status, loadMore } = usePaginatedQuery(
		api.imageToolHistory.listByUserPaginated,
		{},
		{ initialNumItems: initialLimit },
	);

	const isLoading = status === "LoadingFirstPage";
	const isLoadingMore = status === "LoadingMore";
	const hasMore = status === "CanLoadMore";
	const generations: Generation[] = results.map(mapEntryToGeneration);

	return {
		generations,
		isLoading,
		hasMore,
		loadMore: () => loadMore(initialLimit),
		isLoadingMore,
	};
}

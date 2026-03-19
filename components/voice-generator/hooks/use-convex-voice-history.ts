import { useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export type VoiceHistoryItem = Doc<"audioTracks">;

interface UseConvexVoiceHistoryProps {
	schemaId?: string;
	projectId?: Id<"projects">;
	limit?: number;
}

export function useConvexVoiceHistory({
	schemaId,
	projectId,
	limit = 20,
}: UseConvexVoiceHistoryProps = {}) {
	// Project-scoped query — auth enforced server-side
	const rawProjectHistory = useQuery(
		api.voiceModels.listVoicesByProjectFromTracks,
		projectId ? { projectId: projectId as string } : "skip",
	);

	// Global query — auth enforced server-side
	const rawGlobalHistory = useQuery(
		api.voiceModels.listVoiceHistoryFromTracks,
		!projectId ? { limit } : "skip",
	);

	const history = projectId ? rawProjectHistory : rawGlobalHistory;
	const isLoading = history === undefined;
	const hasMore = false;

	const filteredHistory = useMemo(() => {
		if (!history) return [];
		if (!schemaId) return history;
		return history.filter((item) => item.generationConfig?.model === schemaId);
	}, [history, schemaId]);

	const loadMore = useCallback(() => {
		// Pagination reserved for future implementation
	}, []);

	return {
		history: filteredHistory,
		isLoading,
		hasMore,
		loadMore,
	};
}

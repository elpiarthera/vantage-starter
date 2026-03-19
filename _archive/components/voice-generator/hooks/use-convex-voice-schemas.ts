import { useQuery } from "convex/react";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

export type VoiceModelSchema = Doc<"voiceModelSchemas">;

export function useConvexVoiceSchemas() {
	const ttsSchemas = useQuery(api.voiceModels.listTTSSchemas);

	const isLoading = ttsSchemas === undefined;

	const getSchemaById = useCallback(
		(id: string) => {
			return ttsSchemas?.find((s) => s.schemaId === id);
		},
		[ttsSchemas],
	);

	const getDefaultSchema = useCallback(() => {
		return ttsSchemas?.[0];
	}, [ttsSchemas]);

	const getDefaultParamsFromSchema = useCallback((schema: VoiceModelSchema) => {
		const defaults: Record<string, unknown> = {};
		for (const p of schema.params) {
			if (p.default !== undefined) {
				defaults[p.key] = p.default;
			}
		}
		return defaults;
	}, []);

	return {
		ttsSchemas: ttsSchemas ?? [],
		isLoading,
		getSchemaById,
		getDefaultSchema,
		getDefaultParamsFromSchema,
	};
}

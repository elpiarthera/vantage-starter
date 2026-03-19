import { useQuery } from "convex/react";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import type { SceneData, VideoModelSchema } from "../types/schema";

export function useConvexVideoSchemas() {
	const schemas: VideoModelSchema[] | undefined = useQuery(
		api.videoModels.getActiveModels,
	);

	const isLoading = schemas === undefined;

	const getSchemaById = useCallback(
		(id: string) => schemas?.find((s) => s.schemaId === id),
		[schemas],
	);

	const getDefaultSchema = useCallback(() => schemas?.[0], [schemas]);

	const getDefaultParamsFromSchema = useCallback(
		(schema: VideoModelSchema): Record<string, string | number | boolean> =>
			Object.fromEntries(
				schema.params
					.filter((p) => p.default !== undefined)
					.map((p) => [p.key, p.default as string | number | boolean]),
			),
		[],
	);

	const createDefaultScene = useCallback(
		(schema: VideoModelSchema): SceneData => ({
			id: crypto.randomUUID(),
			mediaInputs: {},
			prompt: "",
			durationSeconds:
				(schema.params.find((p) => p.key === "duration")?.default as number) ??
				5,
			params: {},
			status: "idle",
		}),
		[],
	);

	return {
		schemas: schemas ?? [],
		isLoading,
		getSchemaById,
		getDefaultSchema,
		getDefaultParamsFromSchema,
		createDefaultScene,
	};
}

/** Determines if the per-scene generate button should be enabled — zero model-specific branching. */
export function useCanGenerateScene(
	scene: SceneData,
	schema: VideoModelSchema | undefined,
): boolean {
	if (!schema) return false;
	return schema.requiredParams.every((param) => {
		if (param === "prompt") return scene.prompt.trim().length > 0;
		// All media inputs live in mediaInputs keyed by FAL param name.
		// This handles "start_image_url", "image_url", "video_url", and any future param.
		return !!(scene.mediaInputs[param] ?? scene.params?.[param]);
	});
	// R2V: requiredParams=[] → every() on empty array = true → always enabled when credits ok
}

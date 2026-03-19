/**
 * Hook to fetch image model schemas from Convex (Sprint 30d.5).
 * Replaces hardcoded modelSchemas.ts with dynamic Convex data.
 * Enables zero-code model onboarding.
 */
"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type {
	ModelCapabilities,
	ModelSchema,
	ParamSchema,
} from "../types/schema";

// Type for raw Convex schema data
interface ConvexImageModelSchema {
	_id: string;
	schemaId: string;
	name: string;
	nameTranslationKey?: string;
	modelId: string;
	type: "t2i" | "i2i";
	creditActionType: string;
	capabilities: {
		negativePrompt?: boolean;
		maxResolution?: string;
		elements?: boolean;
		multiImage?: boolean;
		aspectAuto?: boolean;
		resultTypeSeries?: boolean;
	};
	badges?: string[];
	params: Array<{
		key: string;
		control: string;
		label: string;
		options?: Array<{ value: string; label: string }>;
		default?: unknown;
		min?: number;
		max?: number;
		minLength?: number;
		maxLength?: number;
		advanced?: boolean;
		refType?: string;
		showWhen?: { param: string; value: string | boolean };
		costHint?: string;
	}>;
	allowedParams: string[];
	conditionalParams?: Array<{
		param: string;
		showWhen: { param: string; value: string | boolean };
	}>;
	maxPromptLength: number;
	sortOrder: number;
	isActive: boolean;
}

/**
 * Convert Convex schema to frontend ModelSchema type.
 */
function toModelSchema(convex: ConvexImageModelSchema): ModelSchema {
	return {
		id: convex.schemaId,
		name: convex.name,
		nameTranslationKey: convex.nameTranslationKey,
		modelId: convex.modelId,
		type: convex.type,
		creditActionType: convex.creditActionType,
		badges: convex.badges as ModelSchema["badges"],
		capabilities: {
			negativePrompt: convex.capabilities.negativePrompt,
			maxResolution: convex.capabilities
				.maxResolution as ModelCapabilities["maxResolution"],
			elements: convex.capabilities.elements,
			multiImage: convex.capabilities.multiImage,
			aspectAuto: convex.capabilities.aspectAuto,
			resultTypeSeries: convex.capabilities.resultTypeSeries,
		},
		params: convex.params.map((p) => ({
			key: p.key,
			control: p.control as ParamSchema["control"],
			label: p.label,
			options: p.options,
			default: p.default,
			min: p.min,
			max: p.max,
			minLength: p.minLength,
			maxLength: p.maxLength,
			advanced: p.advanced,
			refType: p.refType as ParamSchema["refType"],
			showWhen: p.showWhen
				? { param: p.showWhen.param, value: p.showWhen.value }
				: undefined,
			costHint: p.costHint,
		})),
	};
}

export interface UseConvexSchemasResult {
	/** All T2I schemas (Generate mode). */
	t2iSchemas: ModelSchema[];
	/** All I2I schemas (Edit mode). */
	i2iSchemas: ModelSchema[];
	/** Whether there are any I2I models (for "Use as Input" button visibility). */
	hasI2IModels: boolean;
	/** Loading state. */
	isLoading: boolean;
	/** Get schema by schemaId (app ID like "kling-v3-t2i"). */
	getSchemaById: (id: string) => ModelSchema | undefined;
	/** Get default T2I schema (first in list). */
	getDefaultT2ISchema: () => ModelSchema | undefined;
	/** Get default I2I schema (first in list). */
	getDefaultI2ISchema: () => ModelSchema | undefined;
	/** Build default params from schema. */
	getDefaultParamsFromSchema: (schema: ModelSchema) => Record<string, unknown>;
}

/**
 * Fetch image model schemas from Convex.
 * Returns T2I and I2I schemas separately for mode-based UI.
 */
export function useConvexSchemas(): UseConvexSchemasResult {
	const rawT2I = useQuery(api.imageModels.listT2ISchemas);
	const rawI2I = useQuery(api.imageModels.listI2ISchemas);

	const t2iSchemas = useMemo(() => {
		if (!rawT2I) return [];
		return rawT2I.map(toModelSchema);
	}, [rawT2I]);

	const i2iSchemas = useMemo(() => {
		if (!rawI2I) return [];
		return rawI2I.map(toModelSchema);
	}, [rawI2I]);

	const allSchemas = useMemo(
		() => [...t2iSchemas, ...i2iSchemas],
		[t2iSchemas, i2iSchemas],
	);

	const getSchemaById = useMemo(
		() => (id: string) => allSchemas.find((s) => s.id === id),
		[allSchemas],
	);

	const getDefaultT2ISchema = useMemo(() => () => t2iSchemas[0], [t2iSchemas]);

	const getDefaultI2ISchema = useMemo(() => () => i2iSchemas[0], [i2iSchemas]);

	const getDefaultParamsFromSchema = useMemo(
		() =>
			(schema: ModelSchema): Record<string, unknown> => {
				const out: Record<string, unknown> = {};
				for (const p of schema.params) {
					if (p.refType) continue; // Skip ref params (handled by RefsPanel)
					if (p.default !== undefined) out[p.key] = p.default;
				}
				return out;
			},
		[],
	);

	const isLoading = rawT2I === undefined || rawI2I === undefined;
	const hasI2IModels = i2iSchemas.length > 0;

	return {
		t2iSchemas,
		i2iSchemas,
		hasI2IModels,
		isLoading,
		getSchemaById,
		getDefaultT2ISchema,
		getDefaultI2ISchema,
		getDefaultParamsFromSchema,
	};
}

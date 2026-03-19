/**
 * Model schema types for dynamic image-generator UI (Sprint 30 Phase 1).
 * Aligned with IMAGE-MODELS-ANALYSIS.md — capabilities and params drive OptionsPanel/DynamicField.
 */

/** Control types for dynamic UI; OptionsPanel picks widget from this. */
export type ParamControlType =
	| "text"
	| "textarea"
	| "number"
	| "select"
	| "toggle"
	| "icon-select"
	| "segmented"
	| "slider";

/** Option for select / segmented / icon-select (value sent to API, label for UI). */
export interface ParamOption {
	value: string;
	label: string;
	icon?: string;
	previewUrl?: string;
}

/** Visibility: show this param only when another param has a given value (e.g. result_type = "series" → series_amount). */
export interface ShowWhen {
	param: string;
	value: string | boolean;
}

/** Single parameter definition in a model schema. */
export interface ParamSchema {
	/** API param key (e.g. "resolution", "aspect_ratio", "negative_prompt"). */
	key: string;
	control: ParamControlType;
	label?: string;
	default?: unknown;
	/** For select, segmented, icon-select. */
	options?: ParamOption[];
	/** For number / stepper. */
	min?: number;
	max?: number;
	step?: number;
	/** For text (prompt, negative_prompt). */
	maxLength?: number;
	minLength?: number;
	/** For textarea: number of visible rows (default 3). */
	rows?: number;
	/** Placeholder i18n key or raw string for text/textarea controls. */
	placeholder?: string;
	/** Hint text i18n key or raw string shown below the field. */
	hint?: string;
	/** If true, render inside collapsible "Advanced options". */
	advanced?: boolean;
	/** Show this param only when condition is met (e.g. result_type === "series"). */
	showWhen?: ShowWhen;
	/** Ref params (image_url, image_urls, elements) are handled by RefsPanel; still listed for schema completeness. */
	refType?: "single" | "multi" | "elements";
	/** Optional cost hint displayed next to the label (e.g. "+$0.015" for enable_web_search). */
	costHint?: string;
}

/** Capabilities drive visibility of params and RefsPanel (single vs multi slot). Per IMAGE-MODELS-ANALYSIS. */
export interface ModelCapabilities {
	negativePrompt?: boolean;
	/** "2K" | "4K" — max resolution this model supports. */
	maxResolution?: "2K" | "4K";
	/** I2I with image_urls (multiple refs). */
	multiImage?: boolean;
	/** Kling-style elements (frontal + reference_image_urls). */
	elements?: boolean;
	/** result_type single | series; series_amount vs num_images. */
	resultTypeSeries?: boolean;
	/** I2I supports aspect_ratio "auto". */
	aspectAuto?: boolean;
}

/** Single model schema: id, name, modelId (FAL), creditActionType (Convex creditCosts), capabilities, params. */
export interface ModelSchema {
	/** App-facing id (e.g. "kling-o3-t2i"). */
	id: string;
	name: string;
	/** i18n key for name (e.g. "image_generator.models.nano_banana_2_t2i"). */
	nameTranslationKey?: string;
	/** FAL model id for startGenericGeneration (e.g. "fal-ai/kling-image/o3/text-to-image"). */
	modelId: string;
	/** Model type: "t2i" = text-to-image (Generate mode), "i2i" = image-to-image (Edit mode). */
	type: "t2i" | "i2i";
	/** Key in Convex creditCosts for getCreditCost / deduct. */
	creditActionType: string;
	badges?: ("PRO" | "FAST" | "NEW")[];
	capabilities: ModelCapabilities;
	params: ParamSchema[];
}

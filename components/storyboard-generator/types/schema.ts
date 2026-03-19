/**
 * Storyboard Generator — Video model schema types (Sprint 37).
 * VideoModelSchema mirrors the `videoModelSchemas` Convex table (Phase A1).
 * SceneData is fully capability-driven — no model-specific fields.
 */

export type VideoModelType = "i2v" | "r2v" | "v2v";
export type SceneStatus =
	| "idle"
	| "queued"
	| "generating"
	| "complete"
	| "error";

export interface SceneData {
	id: string;
	/**
	 * Media inputs keyed by FAL param name from schema
	 * (e.g. "start_image_url", "image_url", "video_url", "image_urls").
	 * Adding a new model with a new media param requires zero change here.
	 */
	mediaInputs: Record<string, string | string[]>;
	prompt: string;
	/**
	 * Top-level duration used for credit scaling by startGenericVideoGeneration.
	 * Populated from the "duration" schema param default when a scene is created.
	 */
	durationSeconds: number;
	/** Per-scene settings (negative_prompt, cfg_scale, scope: "scene" params). */
	params?: Record<string, string | number | boolean>;
	status: SceneStatus;
	error?: string;
	generatedVideoUrl?: string;
	jobRequestId?: string;
	/** Maps to Convex scenes._id — undefined until scene is saved. */
	convexSceneId?: string;
}

/** TypeScript interface for what Convex returns from `videoModelSchemas`. */
export interface VideoModelSchema {
	_id: string;
	schemaId: string;
	name: string;
	nameTranslationKey?: string;
	modelId: string;
	/** Metadata only — used for VideoModelCard badge display. Never used for UI branching. */
	type: VideoModelType;
	/** FAL param name for start image ("start_image_url" or "image_url"). Absent for V2V. */
	startImageParam?: string;
	/** FAL param name for video input ("video_url"). Absent for I2V/R2V. */
	videoInputParam?: string;
	/** Required params for generate button validation (e.g. ["start_image_url"] or []). */
	requiredParams: string[];
	creditBaseDuration: number;
	/** false for V2V Edit (flat rate). true for I2V/R2V (scales with duration). */
	supportsDurationScaling: boolean;
	creditTiers: Array<{
		tier: string;
		actionType: string;
		/** i18n key for UI display (CreditTierSelector). */
		labelKey: string;
	}>;
	/** All capability flags that SceneInputArea reads — never check schema.type in UI. */
	capabilities: {
		requiresStartImage?: boolean;
		requiresVideoInput?: boolean;
		requiresTextPrompt?: boolean;
		supportsEndImage?: boolean;
		supportsStyleImages?: boolean;
		supportsElements?: boolean;
		supportsDuration?: boolean;
		aspectRatios?: string[];
		audioGeneration?: boolean;
		keepAudio?: boolean;
		voiceIds?: boolean;
		negativePrompt?: boolean;
		cfgScale?: boolean;
		multiShot?: boolean;
	};
	badges?: string[];
	params: Array<{
		key: string;
		control: string;
		label: string;
		hint?: string;
		placeholder?: string;
		required?: boolean;
		options?: Array<{ value: string | number | boolean; label: string }>;
		default?: string | number | boolean;
		min?: number;
		max?: number;
		step?: number;
		maxLength?: number;
		rows?: number;
		advanced?: boolean;
		scope?: "global" | "scene";
		showWhen?: { param: string; value: string | boolean };
	}>;
	allowedParams: string[];
	maxPromptLength: number;
	sortOrder: number;
	isActive: boolean;
}

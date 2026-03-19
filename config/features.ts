export const FEATURES = {
	enableAIChat: true,
	enableLazyLoading: true,
	useNewArchitecture: false, // Toggle for gradual migration
	enableVideoGeneration: true,
	enableAssetUpload: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

// Shared Theme type for design system
export type Theme = {
	name: string;
	title: string;
	type: string;
	cssVars?: {
		light?: Record<string, string>;
		dark?: Record<string, string>;
		theme?: Record<string, string>;
	};
};

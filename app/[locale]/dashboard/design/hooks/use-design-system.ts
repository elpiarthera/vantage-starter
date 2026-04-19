/**
 * useDesignSystem hook — wrapper around search params for the design configurator.
 * Provides the current design system configuration and a setter.
 */

"use client";

import { useDesignSystemSearchParams } from "../lib/search-params";

export function useDesignSystem() {
	const [params, setParams] = useDesignSystemSearchParams();

	return {
		config: params,
		setConfig: setParams,
		style: params.style,
		theme: params.theme,
		baseColor: params.baseColor,
		chartColor: params.chartColor,
		font: params.font,
		fontHeading: params.fontHeading,
		menuAccent: params.menuAccent,
		menuColor: params.menuColor,
		radius: params.radius,
		rtl: params.rtl,
	};
}

"use client";

import { useMutation, useQuery } from "convex/react";
import * as React from "react";
import { api } from "@/convex/_generated/api";
import { useDesignSystem } from "@/hooks/use-design-system";
import {
	buildRegistryTheme,
	DEFAULT_CONFIG,
	DESIGN_SYSTEM_PARAM_KEYS,
	type DesignSystemConfig,
} from "@/lib/design-system/config";
import { FONTS } from "@/lib/design-system/fonts";
import {
	hasDesignSystemUrlOverride,
	loadPersistedDesignSystemConfig,
	savePersistedDesignSystemConfig,
} from "@/lib/design-system/persist";
import type { DesignSystemSearchParams } from "@/lib/design-system/search-params";

// Fields of DesignSystemConfig that are mirrored to
// users.preferences.designSystem (see convex/users.ts updatePreferences for
// the per-user vs per-workspace scope decision). "theme" (dark/light/system)
// intentionally excluded — that is a separate, already-existing preference.
const CONVEX_DESIGN_SYSTEM_KEYS = [
	"style",
	"baseColor",
	"chartColor",
	"fontHeading",
	"font",
	"iconLibrary",
	"radius",
	"menuColor",
	"menuAccent",
] as const satisfies readonly (keyof DesignSystemSearchParams)[];

type ConvexDesignSystemPref = Partial<
	Pick<DesignSystemSearchParams, (typeof CONVEX_DESIGN_SYSTEM_KEYS)[number]>
>;

function pickConvexDesignSystemFields(
	params: DesignSystemSearchParams,
): ConvexDesignSystemPref {
	const out: Record<string, string | boolean> = {};
	for (const key of CONVEX_DESIGN_SYSTEM_KEYS) {
		out[key] = params[key];
	}
	return out as ConvexDesignSystemPref;
}

const THEME_STYLE_ID = "design-system-theme-vars";
const MANAGED_BODY_PREFIXES = ["style-", "base-color-"] as const;

function removeManagedBodyClasses(body: Element) {
	for (const cls of Array.from(body.classList)) {
		if (MANAGED_BODY_PREFIXES.some((p) => cls.startsWith(p))) {
			body.classList.remove(cls);
		}
	}
}

function buildCssRule(selector: string, vars?: Record<string, string>) {
	const lines = Object.entries(vars ?? {})
		.filter(([, v]) => Boolean(v))
		.map(([k, v]) => `  --${k}: ${v};`)
		.join("\n");
	return lines ? `${selector} {\n${lines}\n}\n` : `${selector} {}\n`;
}

function buildThemeCss(cssVars: {
	light?: Record<string, string>;
	dark?: Record<string, string>;
}) {
	return [
		buildCssRule(":root", cssVars.light),
		buildCssRule(".dark", cssVars.dark),
	].join("\n");
}

export function DesignSystemProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [params, setParams] = useDesignSystem();
	const [isReady, setIsReady] = React.useState(false);
	const {
		style,
		theme,
		font,
		fontHeading,
		baseColor,
		chartColor,
		menuAccent,
		menuColor,
		radius,
	} = params;

	// Convex is the source of truth for a SIGNED-IN user's design selection —
	// it is what survives reconnecting on another device/browser, which
	// localStorage alone cannot (Day defect #2). `undefined` = still loading,
	// `null` = signed out. See convex/users.ts updatePreferences for the
	// per-user scope decision.
	const convexUser = useQuery(api.users.getCurrentUser);
	const updateConvexPreferences = useMutation(api.users.updatePreferences);

	// Rehydrate the last saved selection when this provider mounts without an
	// explicit URL override (e.g. navigating back to /dashboard/configurator
	// after leaving it — see lib/design-system/persist.ts for the persistence
	// decision and its declared boundary). Convex pref wins for a signed-in
	// user with a saved selection; localStorage remains the anonymous / fast
	// path fallback (and the default when a signed-in user never saved one —
	// see DEFECT-DEFAULTS: no saved pref -> DEFAULT_CONFIG, never a blank
	// screen, because setParams is simply never called in that case).
	const hasHydratedRef = React.useRef(false);
	React.useEffect(() => {
		if (hasHydratedRef.current) return;
		// Wait for the Convex query to resolve (undefined = loading) before
		// deciding — otherwise a signed-in user briefly sees the anonymous
		// localStorage/default value flash before their real pref loads.
		if (convexUser === undefined) return;
		hasHydratedRef.current = true;
		if (typeof window === "undefined") return;
		if (
			hasDesignSystemUrlOverride(
				window.location.search,
				DESIGN_SYSTEM_PARAM_KEYS,
			)
		) {
			return;
		}
		const convexDesign = convexUser?.preferences?.designSystem;
		if (convexDesign && Object.keys(convexDesign).length > 0) {
			setParams(convexDesign as Partial<DesignSystemSearchParams>);
			return;
		}
		const saved = loadPersistedDesignSystemConfig();
		if (saved) setParams(saved);
	}, [convexUser, setParams]);

	// Persist every change so it survives leaving and returning to this route
	// (localStorage — anonymous / fast path) and reconnecting from anywhere
	// else (Convex — signed-in source of truth).
	React.useEffect(() => {
		savePersistedDesignSystemConfig(params);
		// Only signed-in users get server-side persistence; convexUser is
		// `null` when signed out and `undefined` while the query is loading.
		if (!convexUser) return;
		updateConvexPreferences({
			designSystem: pickConvexDesignSystemFields(params),
		}).catch(() => {
			// Best-effort — localStorage already holds the selection above, so
			// a transient Convex write failure never loses the user's choice
			// for the current browser session.
		});
	}, [params, convexUser, updateConvexPreferences]);

	const effectiveRadius = style === "lyra" ? "none" : radius;

	const selectedFont = React.useMemo(
		() => FONTS.find((f) => f.value === font),
		[font],
	);
	const selectedHeadingFont = React.useMemo(() => {
		if (fontHeading === "inherit" || fontHeading === font) return selectedFont;
		return FONTS.find((f) => f.value === fontHeading);
	}, [font, fontHeading, selectedFont]);

	const initialFontSansRef = React.useRef<string | null>(null);
	const initialFontHeadingRef = React.useRef<string | null>(null);

	// Restore original font vars on unmount
	React.useEffect(() => {
		initialFontSansRef.current =
			document.documentElement.style.getPropertyValue("--font-sans");
		initialFontHeadingRef.current =
			document.documentElement.style.getPropertyValue("--font-heading");
		return () => {
			removeManagedBodyClasses(document.body);
			document.getElementById(THEME_STYLE_ID)?.remove();
			if (initialFontSansRef.current) {
				document.documentElement.style.setProperty(
					"--font-sans",
					initialFontSansRef.current,
				);
			} else {
				document.documentElement.style.removeProperty("--font-sans");
			}
			if (initialFontHeadingRef.current) {
				document.documentElement.style.setProperty(
					"--font-heading",
					initialFontHeadingRef.current,
				);
			} else {
				document.documentElement.style.removeProperty("--font-heading");
			}
		};
	}, []);

	// Force radius=none for lyra style
	React.useEffect(() => {
		if (style === "lyra" && radius !== "none") {
			setParams({ radius: "none" });
		}
	}, [style, radius, setParams]);

	// Body classes + font vars (layout effect = synchronous, no flash)
	React.useLayoutEffect(() => {
		if (!style || !font || !baseColor) return;
		removeManagedBodyClasses(document.body);
		document.body.classList.add(`style-${style}`, `base-color-${baseColor}`);
		if (selectedFont) {
			document.documentElement.style.setProperty(
				"--font-sans",
				selectedFont.font.style.fontFamily,
			);
		}
		if (selectedHeadingFont) {
			document.documentElement.style.setProperty(
				"--font-heading",
				selectedHeadingFont.font.style.fontFamily,
			);
		}
		setIsReady(true);
	}, [style, font, baseColor, selectedFont, selectedHeadingFont]);

	// Inject CSS vars for theme/baseColor/chartColor/radius/menuAccent
	const registryTheme = React.useMemo(() => {
		if (!baseColor || !theme || !menuAccent) return null;
		const config: DesignSystemConfig = {
			...DEFAULT_CONFIG,
			baseColor,
			theme,
			chartColor,
			menuAccent,
			radius: effectiveRadius,
		};
		try {
			return buildRegistryTheme(config);
		} catch {
			return null;
		}
	}, [baseColor, theme, chartColor, menuAccent, effectiveRadius]);

	React.useLayoutEffect(() => {
		if (!registryTheme?.cssVars) return;
		let el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement("style");
			el.id = THEME_STYLE_ID;
			document.head.appendChild(el);
		}
		el.textContent = buildThemeCss(registryTheme.cssVars);
	}, [registryTheme]);

	// Menu color inversion — add/remove .dark on cn-menu-target elements
	React.useLayoutEffect(() => {
		if (!menuColor) return;
		const isInverted =
			menuColor === "inverted" || menuColor === "inverted-translucent";
		const isTranslucent =
			menuColor === "default-translucent" ||
			menuColor === "inverted-translucent";
		let frameId = 0;

		const update = () => {
			const els = document.querySelectorAll<HTMLElement>(
				".cn-menu-target, [data-menu-translucent]",
			);
			if (!els.length) return;
			els.forEach((el) => {
				el.style.transition = "none";
			});
			els.forEach((el) => {
				if (el.classList.contains("cn-menu-target")) {
					isInverted ? el.classList.add("dark") : el.classList.remove("dark");
				}
				if (isTranslucent) {
					el.classList.add("cn-menu-translucent");
					el.removeAttribute("data-menu-translucent");
				} else if (el.classList.contains("cn-menu-translucent")) {
					el.classList.remove("cn-menu-translucent");
					el.setAttribute("data-menu-translucent", "");
				}
			});
			void document.body.offsetHeight;
			els.forEach((el) => {
				el.style.transition = "";
			});
		};

		const schedule = () => {
			if (frameId) return;
			frameId = window.requestAnimationFrame(() => {
				frameId = 0;
				update();
			});
		};

		update();
		const observer = new MutationObserver(schedule);
		observer.observe(document.body, { childList: true, subtree: true });
		return () => {
			observer.disconnect();
			if (frameId) window.cancelAnimationFrame(frameId);
		};
	}, [menuColor]);

	if (!isReady) return null;
	return <>{children}</>;
}

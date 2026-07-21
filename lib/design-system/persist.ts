// Design system persistence — localStorage-scoped (anonymous / fast path).
//
// PERSISTENCE DECISION (declared, not silent — see .claude/rules/derive-never-type.md):
// The configurator's selection is stored in the browser's localStorage under
// STORAGE_KEY and rehydrated by DesignSystemProvider whenever it mounts
// without an explicit URL override. This makes a configured theme survive
// navigating away from /dashboard/configurator (or /create) and back, and
// survive a full page reload — for the CURRENT browser.
//
// RESOLVED (Day defect #2 follow-up): reconnecting from another
// browser/device is now covered by users.preferences.designSystem in Convex
// (convex/users.ts updatePreferences), which DesignSystemProvider treats as
// the source of truth for a signed-in user and localStorage as the
// anonymous / fast-path fallback. RESOLVED (Day defect #3 follow-up):
// DesignSystemProvider now also mounts in app/[locale]/dashboard/layout.tsx
// (above every dashboard route), so a saved selection applies app-wide
// within the dashboard, not only inside the configurator preview box.
import type { DesignSystemSearchParams } from "./search-params";

const STORAGE_KEY = "vantage-design-system-config";

export function loadPersistedDesignSystemConfig(): Partial<DesignSystemSearchParams> | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return null;
		return parsed as Partial<DesignSystemSearchParams>;
	} catch {
		return null;
	}
}

export function savePersistedDesignSystemConfig(
	config: DesignSystemSearchParams,
): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	} catch {
		// Storage unavailable (private-mode quota, disabled) — persistence
		// degrades to session-only; not a functional blocker for the configurator.
	}
}

export function hasDesignSystemUrlOverride(
	search: string,
	keys: readonly string[],
): boolean {
	const params = new URLSearchParams(search);
	return keys.some((key) => params.has(key));
}

export { STORAGE_KEY as DESIGN_SYSTEM_STORAGE_KEY };

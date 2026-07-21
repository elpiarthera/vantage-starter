// Design system persistence — localStorage-scoped.
//
// PERSISTENCE DECISION (declared, not silent — see .claude/rules/derive-never-type.md):
// The configurator's selection is stored in the browser's localStorage under
// STORAGE_KEY and rehydrated by DesignSystemProvider whenever it mounts
// without an explicit URL override. This makes a configured theme survive
// navigating away from /dashboard/configurator (or /create) and back, and
// survive a full page reload.
//
// BOUNDARY: this does NOT make the theme apply site-wide across every
// dashboard route in the same visit — DesignSystemProvider only mounts on
// the two configurator routes (providers/DesignSystemProvider.tsx). Making
// the choice apply on every dashboard page in the same visit would require
// mounting the provider above the dashboard layout and moving its state off
// nuqs's URL binding onto this same localStorage store — an architecture
// change (who "owns" the applied theme fleet-wide, whether it should sync to
// a Convex user preference) beyond the scope of this fix. Flagged here so it
// is tracked debt, not a silent gap.
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

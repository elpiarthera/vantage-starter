/**
 * Component-level persistence proof (Day-2 gate finding): the pure-function
 * tests in design-system-persist.test.ts only exercise persist.ts in
 * isolation — nothing mounts the REAL DesignSystemProvider across the exact
 * unmount/remount that used to lose the theme (leaving
 * /dashboard/configurator removes the injected <style>; nuqs strips URL
 * params back to defaults; returning had nothing left to read).
 *
 * This test mounts the real provider, picks a non-default selection,
 * unmounts (no URL override survives — same as a real route change), then
 * remounts fresh and asserts a CONSUMED value: the `--radius` custom
 * property inside the injected `<style id="design-system-theme-vars">`,
 * which `buildRegistryTheme` derives from the selected radius and every page
 * reads via `rounded-[var(--radius)]`. Not a persist.ts internal.
 *
 * (`--font-sans` was tried first but next/font/google's Jest mock returns
 * the literal string "fontFamily" for every font — same value regardless of
 * selection — which would make the assertion pass whether or not the real
 * rehydrate path ran. `--radius` has no such mock indirection.)
 *
 * `@/hooks/use-design-system` is mocked to a plain useState seeded at
 * DEFAULT_CONFIG on every mount — this is exactly what the real nuqs-backed
 * hook does on a fresh mount with no URL query params (nuqs strips a param
 * from the URL once it equals its default, and `window.location.search` is
 * empty in this jsdom environment), without pulling nuqs's ESM-only runtime
 * into Jest's CJS transform.
 */
import { act, render } from "@testing-library/react";
import { DEFAULT_CONFIG } from "@/lib/design-system/config";
import {
	DESIGN_SYSTEM_STORAGE_KEY,
	loadPersistedDesignSystemConfig,
} from "@/lib/design-system/persist";
import type { DesignSystemSearchParams } from "@/lib/design-system/search-params";
import { DesignSystemProvider } from "@/providers/DesignSystemProvider";

jest.mock("@/hooks/use-design-system", () => ({
	useDesignSystem: () => {
		const ReactActual = jest.requireActual("react");
		const [state, setState] = ReactActual.useState(
			jest.requireActual("@/lib/design-system/config").DEFAULT_CONFIG,
		);
		const setParams = (patch: Partial<DesignSystemSearchParams>) => {
			setState((s: DesignSystemSearchParams) => ({ ...s, ...patch }));
		};
		return [state, setParams];
	},
}));

const NON_DEFAULT_RADIUS = "small"; // DEFAULT_CONFIG.radius is "default"; RADII["small"].value is "0.45rem"
const EXPECTED_RADIUS_CSS = "0.45rem";
const THEME_STYLE_ID = "design-system-theme-vars";

function readAppliedThemeRadius(): string | null {
	const style = document.getElementById(THEME_STYLE_ID);
	if (!style) return null;
	const match = style.textContent?.match(/--radius:\s*([^;]+);/);
	return match ? match[1] : null;
}

function renderProvider() {
	return render(
		<DesignSystemProvider>
			<div data-testid="child">child</div>
		</DesignSystemProvider>,
	);
}

describe("DesignSystemProvider — persistence survives an unmount/remount (route change)", () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.getElementById(THEME_STYLE_ID)?.remove();
	});

	it("re-applies the persisted selection after the provider unmounts and remounts with no URL override", async () => {
		// Seed localStorage exactly like a prior visit's selection would have.
		window.localStorage.setItem(
			DESIGN_SYSTEM_STORAGE_KEY,
			JSON.stringify({ ...DEFAULT_CONFIG, radius: NON_DEFAULT_RADIUS }),
		);
		expect(loadPersistedDesignSystemConfig()?.radius).toBe(NON_DEFAULT_RADIUS);

		// First mount — simulates the return visit to /dashboard/configurator.
		const first = await act(async () => renderProvider());
		expect(readAppliedThemeRadius()).toBe(EXPECTED_RADIUS_CSS);

		// Unmount — the exact operation that used to strip the injected
		// <style id="design-system-theme-vars"> and (pre-fix) leave nothing
		// behind for the next mount to read.
		first.unmount();
		expect(document.getElementById(THEME_STYLE_ID)).toBeNull();

		// Remount fresh (new component instance, no URL override) — simulates
		// navigating back to the route.
		await act(async () => renderProvider());
		expect(readAppliedThemeRadius()).toBe(EXPECTED_RADIUS_CSS);
	});
});

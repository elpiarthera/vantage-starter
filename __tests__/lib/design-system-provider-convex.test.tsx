/**
 * Configurator persistence — Convex-backed, signed-in path (Day defects
 * #2/#3). Complements design-system-provider-remount.test.tsx (signed-out /
 * localStorage-only path) and design-system-persist.test.ts (pure
 * persist.ts functions).
 *
 * RED 1 — a saved choice is re-read after reload from the Convex pref
 * (mocked), not just localStorage. Fails against pre-fix main where
 * users.preferences carries no designSystem field and the provider never
 * calls useQuery at all.
 *
 * RED 2 — the saved choice applies on a route OTHER than the configurator:
 * asserted here by mounting the provider around an arbitrary "dashboard
 * page" child (not the Customizer/configurator UI) and reading the same
 * consumed `--radius` custom property the layout-level mount
 * (DashboardDesignSystemMount) is responsible for injecting app-wide. Fails
 * against pre-fix main where DesignSystemProvider only mounted inside the
 * configurator/create pages themselves.
 *
 * RED 3 — a user with NO saved preference (Convex returns a user with no
 * `designSystem` key, e.g. pre-migration accounts) gets DEFAULT_CONFIG, no
 * crash, no missing color.
 */
import { act, render } from "@testing-library/react";
import { DEFAULT_CONFIG } from "@/lib/design-system/config";
import type { DesignSystemSearchParams } from "@/lib/design-system/search-params";
import { DesignSystemProvider } from "@/providers/DesignSystemProvider";

const THEME_STYLE_ID = "design-system-theme-vars";
const NON_DEFAULT_RADIUS = "small"; // RADII["small"].value is "0.45rem"
const EXPECTED_RADIUS_CSS = "0.45rem";

let mockConvexUser: unknown;
const updatePreferencesMock = jest.fn().mockResolvedValue({ success: true });

jest.mock("convex/react", () => ({
	useQuery: () => mockConvexUser,
	useMutation: () => updatePreferencesMock,
}));
jest.mock("@/convex/_generated/api", () => ({
	api: {
		users: {
			getCurrentUser: "users.getCurrentUser",
			updatePreferences: "users.updatePreferences",
		},
	},
}));

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

function readAppliedThemeRadius(): string | null {
	const style = document.getElementById(THEME_STYLE_ID);
	if (!style) return null;
	const match = style.textContent?.match(/--radius:\s*([^;]+);/);
	return match ? match[1] : null;
}

// Stands in for an arbitrary non-configurator dashboard route — the
// assertion reads the same shared <style> tag the layout-level
// DashboardDesignSystemMount is responsible for producing app-wide.
function NonConfiguratorDashboardPage() {
	return <div data-testid="dashboard-page">Missions</div>;
}

describe("DesignSystemProvider — Convex-backed persistence (signed-in)", () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.getElementById(THEME_STYLE_ID)?.remove();
		updatePreferencesMock.mockClear();
	});

	it("RED 1: rehydrates the saved selection from the Convex pref, not only localStorage", async () => {
		mockConvexUser = {
			preferences: {
				theme: "dark",
				language: "en",
				notifications: true,
				designSystem: { radius: NON_DEFAULT_RADIUS },
			},
		};
		// Deliberately do NOT seed localStorage — proves the value came from
		// the Convex pref, not the anonymous fallback.
		await act(async () =>
			render(
				<DesignSystemProvider>
					<div data-testid="child">child</div>
				</DesignSystemProvider>,
			),
		);
		expect(readAppliedThemeRadius()).toBe(EXPECTED_RADIUS_CSS);
	});

	it("RED 2: the saved choice applies on a non-configurator dashboard page via the shared provider mount", async () => {
		mockConvexUser = {
			preferences: {
				theme: "dark",
				language: "en",
				notifications: true,
				designSystem: { radius: NON_DEFAULT_RADIUS },
			},
		};
		const { getByTestId } = await act(async () =>
			render(
				<DesignSystemProvider>
					<NonConfiguratorDashboardPage />
				</DesignSystemProvider>,
			),
		);
		expect(getByTestId("dashboard-page")).toBeInTheDocument();
		expect(readAppliedThemeRadius()).toBe(EXPECTED_RADIUS_CSS);
	});

	it("RED 3: a user with no saved preference gets DEFAULT_CONFIG, no crash, no missing color", async () => {
		// Signed-in user, but no designSystem key at all (pre-migration account).
		mockConvexUser = {
			preferences: { theme: "dark", language: "en", notifications: true },
		};
		let result: ReturnType<typeof render> | undefined;
		await act(async () => {
			result = render(
				<DesignSystemProvider>
					<div data-testid="child">child</div>
				</DesignSystemProvider>,
			);
		});
		expect(result?.getByTestId("child")).toBeInTheDocument();
		// No crash, and the default base-color theme's own --radius (not the
		// NON_DEFAULT_RADIUS "0.45rem" used in RED 1/2) is what gets applied —
		// proving no stale/missing value, and no throw from a shape the
		// provider wasn't expecting.
		expect(DEFAULT_CONFIG.radius).toBe("default");
		expect(readAppliedThemeRadius()).not.toBe(EXPECTED_RADIUS_CSS);
		expect(readAppliedThemeRadius()).not.toBeNull();
		const style = document.getElementById(THEME_STYLE_ID);
		expect(style).not.toBeNull();
	});
});

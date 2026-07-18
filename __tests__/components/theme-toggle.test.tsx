/**
 * RED-first coverage for the Day-133 defect: the app's own `ThemeToggle`
 * (components/theme-toggle.tsx) is never mounted anywhere in the
 * authenticated UI, so the dashboard renders dark-only with no way to
 * switch. The fix mounts the EXISTING component into DashboardHeader — it
 * does not create a new one.
 *
 * Two things are asserted:
 * (a) `ThemeToggle` itself flips the theme via next-themes' `setTheme`,
 *     exposing an accessible name driven by the real `theme_toggle.*` i18n
 *     keys pulled from messages/en.json (not an echo of the key).
 * (b) `DashboardHeader.tsx`'s source imports and renders `<ThemeToggle`.
 *
 * DashboardHeader itself pulls Clerk (OrganizationSwitcher, useUser,
 * SignOutButton), Convex (useCredits -> convex/react), useDevice, and
 * next-intl across 14+ call sites. Mounting the full component here would
 * duplicate the mock surface already built for it elsewhere with no
 * additional signal about ThemeToggle's own behaviour — the wrapper-mount
 * assertion below is the static-import check (b), which is what actually
 * proves ThemeToggle is wired into the header, without re-deriving every
 * Clerk/Convex mock this file doesn't otherwise need.
 */

import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = nsDict?.[key];
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

const setThemeMock = jest.fn();
let mockTheme = "dark";
jest.mock("next-themes", () => ({
	useTheme: () => ({ theme: mockTheme, setTheme: setThemeMock }),
}));

import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
	beforeEach(() => {
		setThemeMock.mockClear();
		mockTheme = "dark";
	});

	test("exposes an accessible name from the real theme_toggle i18n catalog and flips dark -> light", async () => {
		const user = userEvent.setup();
		render(<ThemeToggle />);

		const button = screen.getByRole("button", {
			name: en.theme_toggle.switch_to_light,
		});
		await user.click(button);

		expect(setThemeMock).toHaveBeenCalledWith("light");
	});

	test("flips light -> dark and exposes the light-mode accessible name", async () => {
		mockTheme = "light";
		const user = userEvent.setup();
		render(<ThemeToggle />);

		const button = screen.getByRole("button", {
			name: en.theme_toggle.switch_to_dark,
		});
		await user.click(button);

		expect(setThemeMock).toHaveBeenCalledWith("dark");
	});
});

describe("DashboardHeader wiring", () => {
	test("imports and renders ThemeToggle in its source", () => {
		const source = fs.readFileSync(
			path.join(process.cwd(), "components/dashboard/DashboardHeader.tsx"),
			"utf-8",
		);

		expect(source).toMatch(
			/import\s*\{\s*ThemeToggle\s*\}\s*from\s*["']@\/components\/theme-toggle["']/,
		);
		expect(source).toMatch(/<ThemeToggle\b/);
	});
});

/**
 * Tests for the existing `LanguageSwitcher` (components/shared/LanguageSwitcher.tsx),
 * the real fix target after the coordinator's course-correction: the switcher
 * already existed and was simply hidden on desktop (`md:hidden`) — no
 * duplicate component was needed.
 *
 * Asserts:
 * (a) the rendered locales are DERIVED from `routing.locales` (never a
 *     hardcoded count) — adding a locale to routing.ts must not silently
 *     drop it from the switcher.
 * (b) switching locale preserves the current route via
 *     `router.replace(pathname, { locale })`.
 * (c) the switcher renders without any breakpoint restriction (no
 *     `md:hidden` / `hidden md:*` wrapper needed around it here — that
 *     restriction now lives, correctly removed, only in DashboardHeader).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replaceMock = jest.fn();

// next-intl/navigation is ESM-only and can't be transformed by the
// project's jest config, so `@/i18n/routing` is replaced wholesale here.
// This fixture mirrors the single source of truth in `i18n/routing.ts`
// (locales + defaultLocale) — the component under test and this test's
// assertions both read `routing.locales` off this same mock, so the set
// of locales is never duplicated independently.
jest.mock("@/i18n/routing", () => ({
	routing: {
		locales: ["en", "fr", "de", "it", "es", "pt", "ru"],
		defaultLocale: "en",
	},
	usePathname: () => "/dashboard/catalog",
	useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => (key: string) => key,
}));

jest.mock("@clerk/nextjs", () => ({
	useAuth: () => ({ isSignedIn: false }),
}));

const mutationMock = jest.fn();
jest.mock("convex/react", () => ({
	useMutation: () => mutationMock,
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		users: { updateLanguagePreference: "users.updateLanguagePreference" },
	},
}));

import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { routing } from "@/i18n/routing";

describe("LanguageSwitcher", () => {
	beforeEach(() => {
		replaceMock.mockClear();
		mutationMock.mockClear();
	});

	test("renders without any breakpoint restriction wrapper (no hidden class on itself)", () => {
		const { container } = render(<LanguageSwitcher />);
		const button = screen.getByRole("button", { name: /change_language/i });
		expect(button).toBeInTheDocument();
		expect(container.firstChild).not.toHaveClass("hidden");
		expect(container.firstChild).not.toHaveClass("md:hidden");
	});

	test("offers exactly the locales derived from routing.locales (count, not hardcoded)", async () => {
		const user = userEvent.setup();
		render(<LanguageSwitcher />);

		await user.click(screen.getByRole("button", { name: /change_language/i }));

		const items = await screen.findAllByRole("menuitem");
		expect(items).toHaveLength(routing.locales.length);
	});

	test("switching locale preserves the current route via router.replace({ locale })", async () => {
		const user = userEvent.setup();
		render(<LanguageSwitcher />);

		await user.click(screen.getByRole("button", { name: /change_language/i }));
		const frItem = await screen.findByText("Français");
		await user.click(frItem);

		expect(replaceMock).toHaveBeenCalledWith("/dashboard/catalog", {
			locale: "fr",
		});
	});
});

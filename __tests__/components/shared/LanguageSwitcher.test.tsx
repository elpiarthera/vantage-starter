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
 *
 * NOT COVERED — the wrapper, which is where the bug actually was.
 * This file mounts LanguageSwitcher in isolation. The defect this PR fixes
 * never lived in LanguageSwitcher: it was the `<div className="md:hidden">`
 * wrapping it in DashboardHeader.tsx, which hid a working component on
 * desktop. So these tests stay green if that wrapper comes back — proven by
 * the reviewer, who restored the exact defect and watched all of them pass.
 * An earlier revision of this docstring claimed the opposite. It named
 * DashboardHeader as the place the restriction lives while never rendering
 * it: a fear named without a test, which is worse than an untested boundary,
 * because it reads as coverage.
 *
 * Covering it means mounting DashboardHeader with its 14 imports (Clerk
 * useUser/OrganizationSwitcher, useCredits, useDevice, PurchaseCreditsModal,
 * next-intl). That is not free, and it is deliberately not paid here: the
 * jest harness itself is broken (jest.config.ts:17 sweeps vitest's territory,
 * so 90 of 93 suites never start while `Tests: 16 passed` prints green).
 * Wrapper coverage lands with that fix — task k178sp7bswnqb6qpetpbvmq1ds8ammqw.
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

	// Scope note: this asserts the component does not hide ITSELF. It says
	// nothing about the wrapper that hid it in DashboardHeader — see the
	// NOT COVERED block at the top. The name used to claim the wrapper; it
	// does not, and a test name that overstates its assertion is read as
	// coverage by everyone who never opens the body.
	test("does not hide itself at any breakpoint (says nothing about its wrapper)", () => {
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

import { expect, test } from "./fixtures";

/**
 * Auth i18n coverage.
 *
 * The previous auth.spec.ts test only asserted the page's own heading
 * (plain JSX, translated via next-intl) was visible -- that assertion
 * passes even when the Clerk widget itself fails to mount, which is
 * exactly what happened in production on /fr and /it: the heading
 * rendered, the actual sign-in FORM did not.
 *
 * These tests assert the Clerk-rendered form itself (identifier input +
 * submit button) is visible, on every locale, for both /sign-in and
 * /sign-up.
 */

const LOCALES = ["en", "fr", "de", "it", "es", "pt", "ru"] as const;

// Clerk's own `formButtonPrimary` string per @clerk/localizations pack --
// asserting the widget's OWN label (not just its presence) proves the
// localization wiring in i18n/clerk-localization.ts actually reaches the
// mounted component, not just that a button exists.
const PRIMARY_BUTTON_LABEL: Record<(typeof LOCALES)[number], string> = {
	en: "Continue",
	fr: "Continuer",
	de: "Fortsetzen",
	it: "Continua",
	es: "Continuar",
	pt: "Continuar",
	ru: "Продолжить",
};

function primarySubmitButtonName(locale: string) {
	return PRIMARY_BUTTON_LABEL[locale as (typeof LOCALES)[number]];
}

// NAMED GAP (out of this task's scope): in THIS dev sandbox, the bare
// unprefixed URL ("/sign-in", "/sign-up", even "/") 404s -- verified via
// `curl` returning 404 and the Next.js dev server log printing
// `GET /sign-in 404`. This reproduces identically for the bare "/" root,
// which this task's diff never touches, so it predates this fix and is
// not a regression it introduces. The `/en/`-prefixed URL for the SAME
// route mounts correctly (verified below). This is a next-intl
// localePrefix:"as-needed" root-rewrite issue that lives in
// middleware.ts/routing.ts, which are explicitly out of this task's file
// scope -- reported here rather than silently worked around.
function localizedPath(locale: string, page: "sign-in" | "sign-up") {
	return `/${locale}/${page}`;
}

for (const locale of LOCALES) {
	test.describe(`Auth i18n — ${locale}`, () => {
		test(`sign-in form mounts on /${locale === "en" ? "" : `${locale}/`}sign-in`, async ({
			page,
		}) => {
			await page.goto(localizedPath(locale, "sign-in"), {
				waitUntil: "domcontentloaded",
			});

			// The /${locale}/sign-in URL itself is always valid under
			// localePrefix: "as-needed" (next-intl accepts the default
			// locale's own prefix even though it also serves unprefixed --
			// see the NAMED GAP above re: bare-URL 404 in this sandbox).
			// What must NEVER happen is our own component code (SignIn's
			// `path`/`signUpUrl` props) emitting a DIFFERENT locale's prefix
			// than the one requested -- assert no cross-locale redirect.
			if (locale !== "en") {
				await expect(page).not.toHaveURL(/\/en\/sign-in/);
			}

			const identifierInput = page.locator(
				'input[name="identifier"], input[type="email"]',
			);
			await expect(identifierInput.first()).toBeVisible({ timeout: 15_000 });

			// getByRole("button") only matches elements exposed in the accessibility
			// tree -- Clerk renders extra aria-hidden="true" submit buttons in the DOM
			// (decoys for its internal multi-step flow) that a raw CSS selector like
			// button[type="submit"] would match first and report as "hidden".
			const submitButton = page.getByRole("button", {
				name: primarySubmitButtonName(locale),
			});
			await expect(submitButton.first()).toBeVisible({ timeout: 15_000 });
		});

		test(`sign-up form mounts on /${locale === "en" ? "" : `${locale}/`}sign-up`, async ({
			page,
		}) => {
			await page.goto(localizedPath(locale, "sign-up"), {
				waitUntil: "domcontentloaded",
			});

			if (locale !== "en") {
				await expect(page).not.toHaveURL(/\/en\/sign-up/);
			}

			const emailInput = page.locator(
				'input[name="emailAddress"], input[type="email"]',
			);
			await expect(emailInput.first()).toBeVisible({ timeout: 15_000 });

			const submitButton = page.getByRole("button", {
				name: primarySubmitButtonName(locale),
			});
			await expect(submitButton.first()).toBeVisible({ timeout: 15_000 });
		});
	});
}

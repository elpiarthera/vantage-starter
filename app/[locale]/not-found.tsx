import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

/**
 * Locale-aware 404 for routes that fail to match INSIDE a valid `[locale]`
 * segment (e.g. `/fr/some-typo-page`). Rendered nested under
 * `app/[locale]/layout.tsx`, so `NextIntlClientProvider` is already active —
 * `getLocale()` reads the locale next-intl resolved for this request without
 * needing route params (not-found boundaries never receive `params`).
 *
 * The root `app/not-found.tsx` remains the fallback ONLY for requests whose
 * locale segment itself failed validation (see `LocaleLayout`'s `notFound()`
 * call) — at that point no locale has been resolved, so there is nothing to
 * translate against.
 */
export default async function LocaleNotFound() {
	const locale = await getLocale();
	const t = await getTranslations({ locale, namespace: "not_found" });

	return (
		<main className="min-h-screen flex items-center justify-center bg-background px-4">
			<div className="w-full max-w-md text-center">
				<p className="text-6xl font-bold text-primary">404</p>
				<h1 className="mt-3 text-xl font-semibold text-foreground">
					{t("title")}
				</h1>
				<p className="mt-3 text-sm text-muted-foreground leading-relaxed">
					{t("description")}
				</p>
				<Link
					href={ROUTES.home}
					className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-ring"
				>
					{t("cta_home")}
				</Link>
			</div>
		</main>
	);
}

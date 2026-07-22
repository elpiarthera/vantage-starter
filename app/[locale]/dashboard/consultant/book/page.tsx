import { getTranslations } from "next-intl/server";
import { BookingSection } from "@/components/consultant/BookingSection";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

/**
 * `/dashboard/consultant/book` — the consultant booking surface (mcpcn
 * `date-time-picker` block, `docs/mcpcn-block-mapping.md` §4, Batch 4
 * third bullet).
 *
 * AUTHENTICATED, unlike `/contact` and `/report` (the two prior Batch 4
 * bullets, both deliberately public). This route lives under
 * `app/[locale]/dashboard/...`, and `middleware.ts`'s `isPublicRoute`
 * matcher does NOT list any `/dashboard/...` path — every route under
 * `dashboard` is protected by `clerkMiddleware`'s `auth.protect()` call by
 * default (see `middleware.ts`, the `if (!isPublic) { ... auth.protect(...)
 * }` branch). Concretely: a signed-in user reaches this page and sees the
 * picker below; a visitor who is NOT signed in never reaches this
 * component at all — the middleware redirects them, before this file's
 * code runs, to the locale-aware `/sign-up` page with
 * `?redirect_url=<this-page>` set, so they land back here automatically
 * once they sign in.
 */
type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "booking" });
	return {
		title: t("meta_title"),
		description: t("meta_description"),
	};
}

export default async function BookingPage({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "booking" });

	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
			<div className="w-full max-w-2xl">
				<Link
					href={ROUTES.dashboard}
					className="mb-8 inline-block text-muted-foreground text-sm transition-colors duration-150 hover:text-foreground"
				>
					{t("back_home")}
				</Link>
			</div>
			<BookingSection />
		</main>
	);
}

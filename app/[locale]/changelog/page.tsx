import { getTranslations } from "next-intl/server";
import { ChangelogListSection } from "@/components/changelog/ChangelogListSection";
import { Link } from "@/i18n/routing";
import { parseChangelog } from "@/lib/changelog/parseChangelog";
import { ROUTES } from "@/lib/routes";

/**
 * `/changelog` — the public "what's new" browse page (mcpcn `post-card` /
 * `post-list` blocks, docs/mcpcn-block-mapping.md §4 "Content / blog",
 * Batch 4's fifth bullet), built from `CHANGELOG.md` itself rather than a
 * Convex table (see `lib/changelog/parseChangelog.ts`'s header).
 *
 * PUBLIC AND UNAUTHENTICATED, same reasoning as `/events` (Batch 4's fourth
 * bullet): reading the changelog is the whole point of a public "what's
 * new" page. `middleware.ts` lists `/changelog(.*)` in `isPublicRoute` so a
 * visitor reaches this page without being redirected to sign-up.
 */
type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "changelog" });
	return {
		title: t("meta_title"),
		description: t("meta_description"),
	};
}

export default async function ChangelogPage({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "changelog" });
	// `parseChangelog()` is read here, in this already-async Server
	// Component, rather than inside `ChangelogListSection` — see that
	// component's own header for why it stays a plain synchronous function.
	const entries = parseChangelog();

	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
			<div className="w-full max-w-5xl">
				<Link
					href={ROUTES.home}
					className="mb-8 inline-block text-muted-foreground text-sm transition-colors duration-150 hover:text-foreground"
				>
					{t("back_home")}
				</Link>
				<h1 className="mb-8 font-semibold text-3xl text-foreground">
					{t("title")}
				</h1>
				<ChangelogListSection entries={entries} locale={locale} t={t} />
			</div>
		</main>
	);
}

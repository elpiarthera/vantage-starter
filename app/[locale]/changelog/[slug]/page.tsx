import { getTranslations } from "next-intl/server";
import { ChangelogDetailSection } from "@/components/changelog/ChangelogDetailSection";
import { Link } from "@/i18n/routing";
import { parseChangelog } from "@/lib/changelog/parseChangelog";
import { ROUTES } from "@/lib/routes";

/**
 * `/changelog/[slug]` — the public single-entry page (mcpcn `post-detail`
 * block, docs/mcpcn-block-mapping.md §4 "Content / blog", Batch 4's fifth
 * bullet).
 *
 * PUBLIC AND UNAUTHENTICATED for the same reasoning as
 * `app/[locale]/changelog/page.tsx`. A slug matching no `CHANGELOG.md`
 * entry renders a real Next.js 404 via `notFound()` in
 * `ChangelogDetailSection`, not a 200 "not found" sentence.
 */
type Props = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "changelog" });
	return {
		title: t("meta_title"),
		description: t("meta_description"),
	};
}

export default async function ChangelogDetailPage({ params }: Props) {
	const { locale, slug } = await params;
	const t = await getTranslations({ locale, namespace: "changelog" });
	// `parseChangelog()` is read here, in this already-async Server
	// Component, rather than inside `ChangelogDetailSection` — see that
	// component's own header for why it stays a plain synchronous function.
	const entries = parseChangelog();

	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
			<div className="w-full max-w-2xl">
				<Link
					href={ROUTES.changelog}
					className="mb-8 inline-block text-muted-foreground text-sm transition-colors duration-150 hover:text-foreground"
				>
					{t("back_changelog")}
				</Link>
				<ChangelogDetailSection
					entries={entries}
					slug={slug}
					locale={locale}
					t={t}
				/>
			</div>
		</main>
	);
}

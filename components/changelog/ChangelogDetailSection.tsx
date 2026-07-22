import { notFound } from "next/navigation";
import {
	PostDetail,
	PostDetailBody,
	PostDetailHeader,
	PostDetailRelated,
} from "@/components/ui/post-detail";
import type { ChangelogEntry } from "@/lib/changelog/parseChangelog";
import { ROUTES } from "@/lib/routes";

/**
 * Server-rendered wiring for the public `/changelog/[slug]` page (Batch 4
 * fifth bullet, docs/mcpcn-block-mapping.md §4 "Content / blog"). The
 * presentational block lives in `components/ui/post-detail.tsx`; this
 * component owns the slug lookup and the related-entries selection (up to
 * 3 other entries, most-recent-first) against the entries the page parsed.
 *
 * SYNCHRONOUS SERVER COMPONENT, ON PURPOSE — see `ChangelogListSection`'s
 * header for the full reasoning: an async Server Component cannot be
 * rendered as JSX (`TS2786`), so `parseChangelog()` and `getTranslations()`
 * both live in `app/[locale]/changelog/[slug]/page.tsx` now, and this
 * component takes the parsed entries and resolved translator as props
 * instead of awaiting them itself.
 *
 * A slug matching no entry calls `notFound()` — a real Next.js 404, not a
 * 200 response with a "not found" sentence (the exact gap this
 * repository's own `/events/[slug]` route still carries, traced as known
 * debt in `CHANGELOG.md`'s 2026-07-22 events entry rather than repeated
 * here without comment).
 */
export function ChangelogDetailSection({
	entries,
	slug,
	locale,
	t,
}: {
	entries: ChangelogEntry[];
	slug: string;
	locale: string;
	t: (key: string) => string;
}) {
	const entry = entries.find((candidate) => candidate.slug === slug);

	if (!entry) {
		notFound();
	}

	const related = entries
		.filter((candidate) => candidate.slug !== slug)
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, 3)
		.map((candidate) => ({
			slug: candidate.slug,
			title: candidate.title,
			date: candidate.date,
			href: ROUTES.changelogDetail(candidate.slug),
		}));

	return (
		<PostDetail data={{ post: entry }} locale={locale}>
			<PostDetailHeader />
			<PostDetailBody />
			<PostDetailRelated title={t("related")} items={related} />
		</PostDetail>
	);
}

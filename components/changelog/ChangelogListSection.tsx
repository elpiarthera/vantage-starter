import {
	PostCard,
	PostCardAction,
	PostCardCategory,
	PostCardExcerpt,
	PostCardMeta,
	PostCardTitle,
} from "@/components/ui/post-card";
import {
	PostList,
	PostListEmpty,
	type PostListProps,
	type PostListVariant,
} from "@/components/ui/post-list";
import type { ChangelogEntry } from "@/lib/changelog/parseChangelog";
import { ROUTES } from "@/lib/routes";

/** Default page size for the `"fullwidth"` variant's pagination. */
const DEFAULT_FULLWIDTH_PAGE_SIZE = 6;

/**
 * Server-rendered wiring for the public `/changelog` page (Batch 4 fifth
 * bullet, docs/mcpcn-block-mapping.md §4 "Content / blog"). The
 * presentational blocks live in `components/ui/post-card.tsx` and
 * `components/ui/post-list.tsx`; this component owns the excerpt
 * derivation (first line of the entry body).
 *
 * SYNCHRONOUS SERVER COMPONENT, ON PURPOSE — the `parseChangelog()` read
 * and the `getTranslations()` call both live in `app/[locale]/changelog/page.tsx`
 * now, not here. An `async` Server Component cannot be rendered as
 * `<ChangelogListSection />`: TypeScript's JSX types reject a
 * `Promise<Element>`-returning function as a JSX component (`TS2786`,
 * verified against this exact component before this change — no other
 * async Server Component in this repository renders as JSX either, see
 * `AccessibilityDeclaration`/`AccessibilityPlan`, which carry the same
 * unresolved gap). Rather than paper over that with
 * `await ChangelogListSection({ locale })` (a bridge that drops this
 * component out of React's tree — no Suspense boundary can wrap it, no
 * error boundary catches inside it, it will not stream), the async read is
 * owned by the page (already an async Server Component free to await) and
 * this component stays a plain, synchronous function taking the parsed
 * entries and the resolved translator as props — so it renders as real
 * JSX and keeps every one of those guarantees.
 *
 * `variant` exposes all four `PostList` layouts (`list`, `grid`, `carousel`,
 * `fullwidth`) — it defaults to `"grid"` so nothing on `/changelog` changes
 * visibly unless a caller asks for a different layout. `t` now accepts
 * optional ICU `values` because the `"fullwidth"` variant's pagination
 * status ("Page 2 of 5") is resolved per-page from inside the client-side
 * `PostList`, not known ahead of time by this Server Component.
 */
export function ChangelogListSection({
	entries,
	locale,
	t,
	variant = "grid",
	pageSize = DEFAULT_FULLWIDTH_PAGE_SIZE,
}: {
	entries: ChangelogEntry[];
	locale: string;
	t: (key: string, values?: Record<string, string | number>) => string;
	variant?: PostListVariant;
	pageSize?: number;
}) {
	if (entries.length === 0) {
		return (
			<PostList
				variant={
					variant === "fullwidth" || variant === "carousel" ? "grid" : variant
				}
			>
				<PostListEmpty>{t("empty")}</PostListEmpty>
			</PostList>
		);
	}

	const listProps: PostListProps =
		variant === "carousel"
			? {
					variant: "carousel",
					labels: {
						carouselPrevious: t("carousel_previous"),
						carouselNext: t("carousel_next"),
					},
					children: null,
				}
			: variant === "fullwidth"
				? {
						variant: "fullwidth",
						pageSize,
						labels: {
							paginationPrevious: t("pagination_previous"),
							paginationNext: t("pagination_next"),
							paginationStatus: (current, total) =>
								t("pagination_status", { current, total }),
						},
						children: null,
					}
				: { variant, children: null };

	return (
		<PostList {...listProps}>
			{entries.map((entry) => (
				<PostCard
					key={entry.slug}
					data={{
						post: {
							slug: entry.slug,
							type: entry.type,
							date: entry.date,
							title: entry.title,
							excerpt: entry.body.split("\n")[0]?.trim() ?? "",
						},
					}}
					locale={locale}
					href={ROUTES.changelogDetail(entry.slug)}
				>
					<PostCardCategory />
					<PostCardTitle />
					<PostCardMeta />
					<PostCardExcerpt />
					<PostCardAction>{t("read_more")}</PostCardAction>
				</PostCard>
			))}
		</PostList>
	);
}

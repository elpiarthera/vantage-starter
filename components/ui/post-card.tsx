/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * DIVERGENCE FROM UPSTREAM, declared rather than silent: upstream's
 * `post-card` models a full blog post (cover image, author avatar + name,
 * category, tags, four layout variants, an `onReadMore` callback pulling in
 * `@base-ui/react`). This repo's changelog entries
 * (`lib/changelog/parseChangelog.ts`) carry none of that — no image, no
 * author, no category/tags — only a `type` ("Added" | "Fixed" | "Changed"),
 * a `date`, a `title`, and a `body`. This port keeps upstream's
 * compound-component shape (context + sub-exports) and its `<article>` root
 * with a real link (an anchor, not upstream's `onReadMore` button callback —
 * a changelog entry has a real navigable URL,
 * `app/[locale]/changelog/[slug]/page.tsx`, so it earns a real `<a>`), but
 * the payload is exactly what `parseChangelog` returns.
 *
 * Wired into `components/changelog/ChangelogListSection.tsx` (Batch 4 fifth
 * bullet, docs/mcpcn-block-mapping.md §4 "Content / blog"). All colors
 * resolve to this repo's OKLCH tokens (`bg-card`, `text-foreground`,
 * `text-muted-foreground`, `border-border`) — no hardcoded color.
 *
 * "use client": this compound component shares its post/locale/href across
 * sub-exports via `createContext`/`useContext`, and `createContext` is a
 * client-only React API — it cannot be imported into a module reachable from
 * a Server Component (`next build` fails closed on this, see CHANGELOG.md).
 * The state itself never changes after mount (no `useState`), so lifting it
 * out was considered; the honest fix is this directive, not a rewrite of the
 * compound-component shape shared with `post-detail.tsx`/`event-card.tsx`.
 */
"use client";

import type { ComponentProps } from "react";
import { createContext, useContext } from "react";

import { Badge } from "@/components/ui/badge";
import { formatChangelogDate } from "@/lib/changelog/formatChangelogDate";
import { cn } from "@/lib/utils";

export interface PostCardData {
	slug: string;
	type: string;
	date: string;
	title: string;
	excerpt: string;
}

interface PostCardContextValue {
	post: PostCardData;
	locale: string;
	href: string;
}

const PostCardContext = createContext<PostCardContextValue | null>(null);

function usePostCard() {
	const context = useContext(PostCardContext);
	if (!context) {
		throw new Error("PostCard components must be used within PostCard");
	}
	return context;
}

export interface PostCardProps extends ComponentProps<"article"> {
	data: { post: PostCardData };
	locale?: string;
	href: string;
}

export function PostCard({
	className,
	data,
	locale = "en",
	href,
	children,
	...props
}: PostCardProps) {
	const { post } = data;

	return (
		<PostCardContext.Provider value={{ post, locale, href }}>
			<article
				data-slot="post-card"
				className={cn(
					"flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:bg-muted/50",
					className,
				)}
				{...props}
			>
				{children ?? (
					<>
						<PostCardCategory />
						<PostCardTitle />
						<PostCardMeta />
						<PostCardExcerpt />
						<PostCardAction />
					</>
				)}
			</article>
		</PostCardContext.Provider>
	);
}

export function PostCardCategory({
	className,
	...props
}: ComponentProps<typeof Badge>) {
	const { post } = usePostCard();
	return (
		<Badge
			data-slot="post-card-category"
			variant="secondary"
			className={className}
			{...props}
		>
			{post.type}
		</Badge>
	);
}

export function PostCardTitle({ className, ...props }: ComponentProps<"h3">) {
	const { post } = usePostCard();
	return (
		<h3
			data-slot="post-card-title"
			className={cn("font-semibold text-foreground text-lg", className)}
			{...props}
		>
			{post.title}
		</h3>
	);
}

export function PostCardMeta({ className, ...props }: ComponentProps<"p">) {
	const { post, locale } = usePostCard();
	return (
		<p
			data-slot="post-card-meta"
			className={cn("text-muted-foreground text-xs", className)}
			{...props}
		>
			{formatChangelogDate(post.date, locale)}
		</p>
	);
}

export function PostCardExcerpt({ className, ...props }: ComponentProps<"p">) {
	const { post } = usePostCard();
	return (
		<p
			data-slot="post-card-excerpt"
			className={cn("line-clamp-2 text-muted-foreground text-sm", className)}
			{...props}
		>
			{post.excerpt}
		</p>
	);
}

export function PostCardAction({
	className,
	children,
	...props
}: ComponentProps<"a">) {
	const { href } = usePostCard();
	return (
		<a
			data-slot="post-card-action"
			href={href}
			className={cn(
				"mt-1 flex items-center gap-1 self-start rounded-md px-2 py-1 font-medium text-primary text-sm transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
			{...props}
		>
			{children}
		</a>
	);
}

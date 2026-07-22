/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * DIVERGENCE FROM UPSTREAM, declared: upstream's `post-detail` renders a
 * cover image, author bio, tag list, and a related-posts carousel. This
 * repo's changelog entries (`lib/changelog/parseChangelog.ts`) carry none
 * of that — no image, no author, no tags — so this port keeps upstream's
 * compound-component shape (context + sub-exports) but the payload is the
 * fields `parseChangelog` actually returns: `type`, `date`, `title`,
 * `body`. `PostDetailRelated` renders a plain list of nearby entries (by
 * date, most-recent-first over the OTHER parsed entries) rather than
 * upstream's carousel — no carousel dependency added for one link list.
 *
 * Wired into `components/changelog/ChangelogDetailSection.tsx` (Batch 4
 * fifth bullet, docs/mcpcn-block-mapping.md §4 "Content / blog").
 *
 * "use client": this compound component shares its post/locale across
 * sub-exports via `createContext`/`useContext`, and `createContext` is a
 * client-only React API — it cannot be imported into a module reachable from
 * a Server Component (`next build` fails closed on this, see CHANGELOG.md).
 * No `useState` here either; the directive is the honest fix, not a rewrite
 * of the compound-component shape shared with `post-card.tsx`.
 */
"use client";

import type { ComponentProps } from "react";
import { createContext, useContext } from "react";

import { Badge } from "@/components/ui/badge";
import { formatChangelogDate } from "@/lib/changelog/formatChangelogDate";
import { cn } from "@/lib/utils";

export interface PostDetailData {
	slug: string;
	type: string;
	date: string;
	title: string;
	body: string;
}

interface PostDetailContextValue {
	post: PostDetailData;
	locale: string;
}

const PostDetailContext = createContext<PostDetailContextValue | null>(null);

function usePostDetail() {
	const context = useContext(PostDetailContext);
	if (!context) {
		throw new Error("PostDetail components must be used within PostDetail");
	}
	return context;
}

export interface PostDetailProps extends ComponentProps<"div"> {
	data: { post: PostDetailData };
	locale?: string;
}

export function PostDetail({
	className,
	data,
	locale = "en",
	children,
	...props
}: PostDetailProps) {
	return (
		<PostDetailContext.Provider value={{ post: data.post, locale }}>
			<div
				data-slot="post-detail"
				className={cn("flex flex-col gap-6", className)}
				{...props}
			>
				{children}
			</div>
		</PostDetailContext.Provider>
	);
}

export function PostDetailHeader({
	className,
	...props
}: ComponentProps<"div">) {
	const { post, locale } = usePostDetail();
	return (
		<div
			data-slot="post-detail-header"
			className={cn("flex flex-col gap-2", className)}
			{...props}
		>
			<div>
				<Badge variant="secondary">{post.type}</Badge>
			</div>
			<h1 className="font-semibold text-2xl text-foreground">{post.title}</h1>
			<p className="text-muted-foreground text-sm">
				{formatChangelogDate(post.date, locale)}
			</p>
		</div>
	);
}

export function PostDetailBody({ className, ...props }: ComponentProps<"div">) {
	const { post } = usePostDetail();
	return (
		<div
			data-slot="post-detail-body"
			className={cn(
				"whitespace-pre-line text-foreground text-sm leading-relaxed",
				className,
			)}
			{...props}
		>
			{post.body}
		</div>
	);
}

export interface PostDetailRelatedItem {
	slug: string;
	title: string;
	date: string;
	href: string;
}

export function PostDetailRelated({
	className,
	title,
	items,
	...props
}: ComponentProps<"div"> & {
	title?: string;
	items: PostDetailRelatedItem[];
}) {
	const { locale } = usePostDetail();
	if (items.length === 0) {
		return null;
	}
	return (
		<div
			data-slot="post-detail-related"
			className={cn(
				"flex flex-col gap-2 border-border border-t pt-4",
				className,
			)}
			{...props}
		>
			<h2 className="font-semibold text-foreground text-sm">
				{title ?? "Related"}
			</h2>
			<ul className="flex flex-col gap-1">
				{items.map((item) => (
					<li key={item.slug}>
						<a
							href={item.href}
							className="text-primary text-sm transition-colors duration-150 hover:underline"
						>
							{item.title}
						</a>
						<span className="ml-2 text-muted-foreground text-xs">
							{formatChangelogDate(item.date, locale)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

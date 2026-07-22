"use client";

/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * Upstream's `post-list` ships four variants over image-bearing posts:
 * `list`, `grid`, `carousel`, and a paginated `fullwidth`. All four are
 * ported here, over this repo's non-image `PostCardData` payload
 * (`components/ui/post-card.tsx`), at full parity of BEHAVIOUR:
 * `carousel` reuses this repo's own `components/ui/carousel.tsx`
 * (`embla-carousel-react`, already a dependency — no new library added),
 * and `fullwidth` actually paginates a fixed page size, it does not merely
 * accept the prop.
 *
 * REMAINING DIVERGENCE, declared (not silent): upstream's variants render a
 * cover image and an author byline per post — this port's posts
 * (`PostCardData`) carry neither, because `lib/changelog/parseChangelog.ts`
 * has no image/author field to show (see `post-card.tsx`'s own header for
 * that declared divergence). The four LAYOUT variants and the fullwidth
 * PAGINATION are otherwise at parity; only the per-post content shape
 * differs, and it differs for the same reason `post-card.tsx` already
 * declares.
 *
 * `carousel` and `fullwidth` are interactive (keyboard-reachable controls,
 * visible focus rings via the shared `Button`/`Carousel` primitives) and
 * take their user-visible strings as `labels`, resolved by the caller
 * through `next-intl` — this file imports no translator itself, same
 * pattern as `post-card.tsx`.
 *
 * Wired into `components/changelog/ChangelogListSection.tsx` (Batch 4 fifth
 * bullet, docs/mcpcn-block-mapping.md §4 "Content / blog").
 */
import {
	Children,
	type ComponentProps,
	isValidElement,
	type ReactNode,
	useId,
	useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type PostListVariant = "list" | "grid" | "carousel" | "fullwidth";

export interface PostListCarouselLabels {
	carouselPrevious: string;
	carouselNext: string;
}

export interface PostListPaginationLabels {
	paginationPrevious: string;
	paginationNext: string;
	/** Resolved by the caller for the CURRENT page — e.g. `t("pagination_status", { current, total })`. */
	paginationStatus: (current: number, total: number) => string;
}

type PostListBaseProps = Omit<ComponentProps<"div">, "children"> & {
	children: ReactNode;
};

interface PostListNonInteractiveProps extends PostListBaseProps {
	variant?: "list" | "grid";
}

interface PostListCarouselProps extends PostListBaseProps {
	variant: "carousel";
	labels: PostListCarouselLabels;
}

interface PostListFullwidthProps extends PostListBaseProps {
	variant: "fullwidth";
	pageSize: number;
	labels: PostListPaginationLabels;
}

export type PostListProps =
	| PostListNonInteractiveProps
	| PostListCarouselProps
	| PostListFullwidthProps;

function childKey(child: ReactNode, fallbackIndex: number): string {
	if (isValidElement(child) && child.key !== null) {
		return child.key;
	}
	// No stable key was supplied by the caller for this child — every real
	// caller in this repo keys its posts (see `ChangelogListSection`), so
	// this branch is a defensive fallback, not the expected path.
	return `post-list-item-${fallbackIndex}`;
}

export function PostList(props: PostListProps) {
	if (props.variant === "carousel") {
		const { className, children, labels, variant: _variant, ...rest } = props;
		const items = Children.toArray(children);
		return (
			<Carousel
				data-slot="post-list"
				className={cn("w-full", className)}
				{...rest}
			>
				<CarouselContent>
					{items.map((child, index) => (
						<CarouselItem
							key={childKey(child, index)}
							className="sm:basis-1/2 lg:basis-1/3"
						>
							{child}
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious aria-label={labels.carouselPrevious} />
				<CarouselNext aria-label={labels.carouselNext} />
			</Carousel>
		);
	}

	if (props.variant === "fullwidth") {
		return <PostListFullwidth {...props} />;
	}

	const { className, children, variant, ...rest } = props;
	return (
		<div
			data-slot="post-list"
			className={cn(
				variant === "list"
					? "flex w-full flex-col gap-4"
					: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
				className,
			)}
			{...rest}
		>
			{children}
		</div>
	);
}

function PostListFullwidth({
	className,
	children,
	pageSize,
	labels,
	...rest
}: PostListFullwidthProps) {
	const items = Children.toArray(children);
	const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
	const [requestedPage, setRequestedPage] = useState(0);
	const page = Math.min(requestedPage, totalPages - 1);
	const start = page * pageSize;
	const visible = items.slice(start, start + pageSize);
	const statusId = useId();

	return (
		<div
			data-slot="post-list"
			className={cn("flex w-full flex-col gap-6", className)}
			{...rest}
		>
			<div className="flex w-full flex-col gap-4">
				{visible.map((child, index) => (
					<div key={childKey(child, start + index)}>{child}</div>
				))}
			</div>
			{totalPages > 1 && (
				<nav
					aria-label={labels.paginationStatus(page + 1, totalPages)}
					className="flex items-center justify-center gap-3"
				>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							setRequestedPage((current) => Math.max(0, current - 1))
						}
						disabled={page === 0}
						aria-label={labels.paginationPrevious}
					>
						{labels.paginationPrevious}
					</Button>
					<span
						id={statusId}
						className="text-muted-foreground text-sm"
						aria-live="polite"
					>
						{labels.paginationStatus(page + 1, totalPages)}
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							setRequestedPage((current) =>
								Math.min(totalPages - 1, current + 1),
							)
						}
						disabled={page === totalPages - 1}
						aria-label={labels.paginationNext}
					>
						{labels.paginationNext}
					</Button>
				</nav>
			)}
		</div>
	);
}

export function PostListEmpty({
	className,
	children,
	...props
}: ComponentProps<"div">) {
	return (
		<div
			data-slot="post-list-empty"
			className={cn(
				"col-span-full rounded-xl border border-border border-dashed bg-card p-8 text-center text-muted-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

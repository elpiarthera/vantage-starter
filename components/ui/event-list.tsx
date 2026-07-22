/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * DIVERGENCE FROM UPSTREAM, declared: upstream's `event-list` pulls in
 * `react-leaflet`/`leaflet` for a map-plus-carousel layout, matching its
 * venue-based data model. This repo's `events` table has no location field
 * (see `components/ui/event-card.tsx`'s header), so this port is a plain
 * responsive grid over `EventCard` items — no map dependency added.
 *
 * Wired into `components/events/EventListSection.tsx` (Batch 4 fourth
 * bullet, docs/mcpcn-block-mapping.md §4 "Events").
 */
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function EventList({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			data-slot="event-list"
			className={cn(
				"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
				className,
			)}
			{...props}
		/>
	);
}

export function EventListEmpty({
	className,
	children,
	...props
}: ComponentProps<"div">) {
	return (
		<div
			data-slot="event-list-empty"
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

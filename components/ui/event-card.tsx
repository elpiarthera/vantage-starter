/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * DIVERGENCE FROM UPSTREAM, declared rather than silent: upstream's
 * `event-card` models a ticketed nightlife listing (venue, price range,
 * organizer rating, vibe tags, a hero image, `react-leaflet`/`leaflet` map
 * deps pulled in transitively via `event-list`/`event-detail`). This repo's
 * `events` Convex table (`convex/schema.ts`) carries none of that — no
 * image, no venue, no price, no location — so this port keeps upstream's
 * compound-component shape (context + sub-exports) and its accessible
 * `<button>` root, but the payload is the fields `convex/events.ts` actually
 * returns: `slug`, `title`, `description`, `startDateTime`, `timezone`,
 * `capacity`, `registeredCount`. No map, no `react-leaflet`/`leaflet`
 * dependency added.
 *
 * Wired into `components/events/EventListSection.tsx` (Batch 4 fourth
 * bullet, docs/mcpcn-block-mapping.md §4 "Events"). All colors resolve to
 * this repo's OKLCH tokens (`bg-card`, `text-foreground`,
 * `text-muted-foreground`, `border-border`) — no hardcoded color.
 *
 * "use client": shares its event/isFull/locale across sub-exports via
 * `createContext`/`useContext` (client-only React APIs) and renders a real
 * `onClick` handler — both close the same class of defect fixed in
 * `post-card.tsx`/`post-detail.tsx` (`next build` fails closed the moment
 * this module becomes reachable from a Server Component; today its only
 * caller, `EventListSection.tsx`, is already `"use client"`, but the
 * directive is added here too so this file is never the next occurrence of
 * that class, per this repo's `fix-the-class` rule).
 */
"use client";

import type { ComponentProps } from "react";
import { createContext, useContext } from "react";

import { Badge } from "@/components/ui/badge";
import { formatEventDateTime } from "@/lib/events/formatEventDateTime";
import { cn } from "@/lib/utils";

export interface EventCardData {
	_id: string;
	slug: string;
	title: string;
	description: string;
	startDateTime: string;
	timezone: string;
	capacity: number;
	registeredCount: number;
}

interface EventCardContextValue {
	event: EventCardData;
	isFull: boolean;
	locale: string;
}

const EventCardContext = createContext<EventCardContextValue | null>(null);

function useEventCard() {
	const context = useContext(EventCardContext);
	if (!context) {
		throw new Error("EventCard components must be used within EventCard");
	}
	return context;
}

export interface EventCardProps
	extends Omit<ComponentProps<"button">, "onClick"> {
	data: { event: EventCardData };
	locale?: string;
	actions?: { onClick?: (event: EventCardData) => void };
	labels?: { full: string; spotsLeft: (count: number) => string };
}

export function EventCard({
	className,
	data,
	locale = "en",
	actions,
	labels,
	children,
	...props
}: EventCardProps) {
	const { event } = data;
	const isFull = event.registeredCount >= event.capacity;

	return (
		<EventCardContext.Provider value={{ event, isFull, locale }}>
			<button
				type="button"
				data-slot="event-card"
				onClick={() => actions?.onClick?.(event)}
				className={cn(
					"flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					className,
				)}
				{...props}
			>
				{children ?? (
					<>
						<EventCardTitle />
						<EventCardMeta />
						<EventCardDescription />
						<EventCardCapacity labels={labels} />
					</>
				)}
			</button>
		</EventCardContext.Provider>
	);
}

export function EventCardTitle({ className, ...props }: ComponentProps<"h3">) {
	const { event } = useEventCard();
	return (
		<h3
			data-slot="event-card-title"
			className={cn("font-semibold text-foreground text-lg", className)}
			{...props}
		>
			{event.title}
		</h3>
	);
}

export function EventCardDescription({
	className,
	...props
}: ComponentProps<"p">) {
	const { event } = useEventCard();
	return (
		<p
			data-slot="event-card-description"
			className={cn("line-clamp-2 text-muted-foreground text-sm", className)}
			{...props}
		>
			{event.description}
		</p>
	);
}

export function EventCardMeta({ className, ...props }: ComponentProps<"p">) {
	const { event, locale } = useEventCard();
	return (
		<p
			data-slot="event-card-meta"
			className={cn("text-muted-foreground text-xs", className)}
			{...props}
		>
			{formatEventDateTime(event.startDateTime, event.timezone, locale)}
		</p>
	);
}

export function EventCardCapacity({
	className,
	labels,
	...props
}: ComponentProps<"div"> & {
	labels?: { full: string; spotsLeft: (count: number) => string };
}) {
	const { event, isFull } = useEventCard();
	const spotsLeft = Math.max(event.capacity - event.registeredCount, 0);
	return (
		<div
			data-slot="event-card-capacity"
			className={cn("flex items-center", className)}
			{...props}
		>
			<Badge variant={isFull ? "destructive" : "secondary"}>
				{isFull
					? (labels?.full ?? "Full")
					: (labels?.spotsLeft?.(spotsLeft) ?? `${spotsLeft} spots left`)}
			</Badge>
		</div>
	);
}

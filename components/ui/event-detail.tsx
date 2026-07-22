/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * DIVERGENCE FROM UPSTREAM, declared: upstream's `event-detail` renders a
 * venue map (`react-leaflet`/`leaflet`) and ticket-tier pricing. This repo's
 * `events` table carries neither location nor price (see
 * `components/ui/event-card.tsx`'s header) — this port keeps upstream's
 * agenda list and registration-CTA shape, dropping the map.
 *
 * THE THREE REFUSED STATES THIS BLOCK MUST RENDER (Batch 4 fourth bullet's
 * own words): "event full", "already registered", "not signed in" — each
 * MUST be visible before a registration attempt is even offered, not only
 * surfaced as an error after a throw. This component is presentation-only;
 * the actual state (which of the four branches to render) is decided by
 * `components/events/EventDetailSection.tsx`, which holds the Convex query/
 * mutation and Clerk auth state this component has no way to know on its
 * own. `EventDetailRegistration`'s `state` prop is the single source that
 * selects the branch — never re-derived twice.
 *
 * Wired into `components/events/EventDetailSection.tsx` (Batch 4 fourth
 * bullet, docs/mcpcn-block-mapping.md §4 "Events").
 */
import type { ComponentProps } from "react";
import { createContext, useContext } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventCardData } from "@/components/ui/event-card";
import { formatEventDateTime } from "@/lib/events/formatEventDateTime";
import { cn } from "@/lib/utils";

export interface EventDetailData extends EventCardData {
	agenda: string[];
}

interface EventDetailContextValue {
	event: EventDetailData;
	locale: string;
}

const EventDetailContext = createContext<EventDetailContextValue | null>(null);

function useEventDetail() {
	const context = useContext(EventDetailContext);
	if (!context) {
		throw new Error("EventDetail components must be used within EventDetail");
	}
	return context;
}

export interface EventDetailProps extends ComponentProps<"div"> {
	data: { event: EventDetailData };
	locale?: string;
}

export function EventDetail({
	className,
	data,
	locale = "en",
	children,
	...props
}: EventDetailProps) {
	return (
		<EventDetailContext.Provider value={{ event: data.event, locale }}>
			<div
				data-slot="event-detail"
				className={cn("flex flex-col gap-6", className)}
				{...props}
			>
				{children}
			</div>
		</EventDetailContext.Provider>
	);
}

export function EventDetailHeader({
	className,
	...props
}: ComponentProps<"div">) {
	const { event, locale } = useEventDetail();
	const isFull = event.registeredCount >= event.capacity;
	const spotsLeft = Math.max(event.capacity - event.registeredCount, 0);
	return (
		<div
			data-slot="event-detail-header"
			className={cn("flex flex-col gap-2", className)}
			{...props}
		>
			<h1 className="font-semibold text-2xl text-foreground">{event.title}</h1>
			<p className="text-muted-foreground text-sm">
				{formatEventDateTime(event.startDateTime, event.timezone, locale)}
			</p>
			<p className="text-foreground text-sm">{event.description}</p>
			<div>
				<Badge variant={isFull ? "destructive" : "secondary"}>
					{isFull ? "Full" : `${spotsLeft} spots left`}
				</Badge>
			</div>
		</div>
	);
}

export function EventDetailAgenda({
	className,
	title,
	...props
}: ComponentProps<"div"> & { title?: string }) {
	const { event } = useEventDetail();
	return (
		<div
			data-slot="event-detail-agenda"
			className={cn("flex flex-col gap-2", className)}
			{...props}
		>
			<h2 className="font-semibold text-foreground text-sm">
				{title ?? "Agenda"}
			</h2>
			<ul className="flex list-inside list-disc flex-col gap-1 text-muted-foreground text-sm">
				{event.agenda.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
		</div>
	);
}

export type EventDetailRegistrationState =
	| "signed-out"
	| "full"
	| "already-registered"
	| "can-register"
	| "registering";

export interface EventDetailRegistrationProps
	extends Omit<ComponentProps<"div">, "onClick"> {
	state: EventDetailRegistrationState;
	labels: {
		signedOut: string;
		signIn: string;
		full: string;
		alreadyRegistered: string;
		register: string;
		registering: string;
	};
	errorMessage?: string | null;
	actions: {
		onRegister?: () => void;
		onSignIn?: () => void;
	};
}

/**
 * Renders EXACTLY ONE of the four states — never an actionable register
 * button alongside a "full"/"already registered"/"signed out" message. The
 * `state` prop is the ONLY thing that decides the branch (see this file's
 * header on why the decision is not re-derived here).
 */
export function EventDetailRegistration({
	className,
	state,
	labels,
	errorMessage,
	actions,
	...props
}: EventDetailRegistrationProps) {
	return (
		<div
			data-slot="event-detail-registration"
			className={cn("flex flex-col gap-2", className)}
			{...props}
		>
			{state === "signed-out" ? (
				<div className="rounded-lg border border-border bg-muted/50 p-4">
					<p className="mb-2 text-foreground text-sm">{labels.signedOut}</p>
					<Button type="button" onClick={actions.onSignIn}>
						{labels.signIn}
					</Button>
				</div>
			) : null}

			{state === "full" ? (
				<div
					aria-live="polite"
					className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm"
				>
					{labels.full}
				</div>
			) : null}

			{state === "already-registered" ? (
				<div
					aria-live="polite"
					className="rounded-lg border border-border bg-muted/50 p-4 text-foreground text-sm"
				>
					{labels.alreadyRegistered}
				</div>
			) : null}

			{state === "can-register" || state === "registering" ? (
				<Button
					type="button"
					disabled={state === "registering"}
					onClick={actions.onRegister}
				>
					{state === "registering" ? labels.registering : labels.register}
				</Button>
			) : null}

			{errorMessage ? (
				<p role="alert" className="text-destructive text-sm">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}

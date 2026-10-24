"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { EventConfirmation } from "@/components/ui/event-confirmation";
import {
	EventDetail,
	EventDetailAgenda,
	EventDetailHeader,
	EventDetailRegistration,
	type EventDetailRegistrationState,
} from "@/components/ui/event-detail";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

/**
 * Client wiring for the public `/events/[slug]` page (Batch 4 fourth
 * bullet, docs/mcpcn-block-mapping.md §4 "Events"). The presentational
 * blocks live in `components/ui/event-detail.tsx` and
 * `components/ui/event-confirmation.tsx`; this component owns the
 * `events.getBySlug` query, the `events.register` mutation, and the
 * decision of which of the four registration states to render.
 *
 * THE BULLET'S ASSERTION, taken as written, not reformulated:
 * "registering for an event from `event-detail` inserts exactly one
 * `eventRegistrations` row, and `event-confirmation` renders only when
 * that insert has succeeded." `EventConfirmation` below is mounted ONLY
 * inside the `try` block's success branch of `handleRegister` — never in
 * `catch`, and never unconditionally alongside the registration control.
 *
 * THE THREE REFUSED STATES, each rendered before a throw is even possible
 * where the data already makes the outcome knowable:
 *  - "not signed in" — `useUser().user` is `null` -> `signed-out` state,
 *    no register button offered at all.
 *  - "event full" — `event.registeredCount >= event.capacity`, known from
 *    the SAME `getBySlug` read that renders the page -> `full` state,
 *    computed BEFORE any attempt, never only surfaced after a throw.
 *  - "already registered" — cannot be known ahead of a first attempt (no
 *    `isRegistered` query exists — `convex/events.ts` exposes only `list`,
 *    `getBySlug`, `register`), so the FIRST attempt from a duplicate
 *    identity does throw; `handleRegister`'s `catch` recognizes the
 *    Convex "already registered" error text and flips `hasRegistered` to
 *    `true` so no SECOND attempt is ever offered in this session — the
 *    register button is not shown again after that point.
 */
export function EventDetailSection({ slug }: { slug: string }) {
	const t = useTranslations("events");
	const locale = useLocale();
	const router = useRouter();
	const { user } = useUser();
	const event = useQuery(api.events.getBySlug, { slug });
	const register = useMutation(api.events.register);

	const [isRegistering, setIsRegistering] = useState(false);
	const [hasRegistered, setHasRegistered] = useState(false);
	const [confirmed, setConfirmed] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (event === undefined) {
		return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
	}

	if (event === null) {
		// The existence of this slug is already guaranteed server-side by
		// `app/[locale]/events/[slug]/page.tsx`'s `fetchQuery` +
		// `notFound()` gate, which runs before this client component ever
		// mounts. `null` can only land here if the event is deleted in the
		// instant between that server read and this client subscription's
		// first tick — an unrenderable race, not a routable 404 — so this
		// renders nothing rather than a soft "not found" sentence at 200.
		return null;
	}

	const isFull = event.registeredCount >= event.capacity;

	const state: EventDetailRegistrationState = !user
		? "signed-out"
		: hasRegistered
			? "already-registered"
			: isFull
				? "full"
				: isRegistering
					? "registering"
					: "can-register";

	const handleRegister = async () => {
		setErrorMessage(null);
		setIsRegistering(true);
		try {
			await register({ eventId: event._id as Id<"events"> });
			setConfirmed(true);
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			if (/already registered/i.test(message)) {
				setHasRegistered(true);
			} else if (/full/i.test(message)) {
				setErrorMessage(t("error_full"));
			} else {
				setErrorMessage(t("error_generic"));
			}
		} finally {
			setIsRegistering(false);
		}
	};

	// The bullet's assertion, enforced structurally: `EventConfirmation` is
	// mounted ONLY on this branch (`confirmed === true`, set ONLY inside
	// the `try` block's success path above) — never in the `catch` branch,
	// never unconditionally.
	if (confirmed) {
		return (
			<EventConfirmation
				data={event}
				locale={locale}
				labels={{
					heading: t("confirmation_heading"),
					description: (title, when) =>
						t("confirmation_description", { title, when }),
				}}
			/>
		);
	}

	return (
		<EventDetail data={{ event }} locale={locale}>
			<EventDetailHeader />
			<EventDetailAgenda title={t("agenda_title")} />
			<EventDetailRegistration
				state={state}
				errorMessage={errorMessage}
				labels={{
					signedOut: t("signed_out"),
					signIn: t("sign_in"),
					full: t("full"),
					alreadyRegistered: t("already_registered"),
					register: t("register"),
					registering: t("registering"),
				}}
				actions={{
					onRegister: handleRegister,
					onSignIn: () => router.push(ROUTES.signUp),
				}}
			/>
		</EventDetail>
	);
}

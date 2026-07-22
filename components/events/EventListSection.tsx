"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { EventCard } from "@/components/ui/event-card";
import { EventList, EventListEmpty } from "@/components/ui/event-list";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

/**
 * Client wiring for the public `/events` page (Batch 4 fourth bullet,
 * docs/mcpcn-block-mapping.md §4 "Events"). The presentational blocks live
 * in `components/ui/event-card.tsx` and `components/ui/event-list.tsx`;
 * this component owns the `events.list` query and navigation to the
 * per-event detail page.
 *
 * PUBLIC AND UNAUTHENTICATED — `api.events.list` requires no identity (see
 * `convex/events.ts`'s header), matching `middleware.ts`'s
 * `isPublicRoute` entry for `/events`.
 */
export function EventListSection() {
	const t = useTranslations("events");
	const router = useRouter();
	const events = useQuery(api.events.list, {});

	if (events === undefined) {
		return (
			<EventList>
				<EventListEmpty>{t("loading")}</EventListEmpty>
			</EventList>
		);
	}

	if (events.length === 0) {
		return (
			<EventList>
				<EventListEmpty>{t("empty")}</EventListEmpty>
			</EventList>
		);
	}

	return (
		<EventList>
			{events.map((event) => (
				<EventCard
					key={event._id}
					data={{ event }}
					actions={{
						onClick: () => router.push(ROUTES.eventDetail(event.slug)),
					}}
					labels={{
						full: t("full"),
						spotsLeft: (count) => t("spots_left", { count }),
					}}
				/>
			))}
		</EventList>
	);
}

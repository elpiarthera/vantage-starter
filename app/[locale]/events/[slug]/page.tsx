import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EventDetailSection } from "@/components/events/EventDetailSection";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

/**
 * `/events/[slug]` — the public detail + registration page (mcpcn
 * `event-detail` / `event-confirmation` blocks,
 * docs/mcpcn-block-mapping.md §4 "Events", Batch 4 fourth bullet).
 *
 * PUBLIC AND UNAUTHENTICATED for browsing — same reasoning as
 * `app/[locale]/events/page.tsx`. Only the registration action itself
 * (`api.events.register`) requires sign-in, enforced Convex-side and
 * reflected in `EventDetailSection`'s `signed-out` render branch.
 *
 * REAL 404, NOT A 200 "NOT FOUND" SENTENCE: `api.events.getBySlug` is a
 * PUBLIC query (no Clerk token needed, unlike
 * `app/[locale]/dashboard/account/order-confirmed/page.tsx`'s
 * `fetchQuery(..., { token })` call — there is no signed-in identity to
 * pass here). This Server Component reads the event with `fetchQuery`
 * BEFORE any render and calls `notFound()` on a missing slug, same
 * contract as `app/[locale]/changelog/[slug]/page.tsx`. A missing slug
 * used to reach `EventDetailSection`'s client `useQuery`, which only
 * discovers the absence AFTER the server has already answered 200 —
 * tracked as debt `k1702eac75b36tpvd7rb05x7c98b176z`, closed here.
 */
type Props = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale, slug } = await params;
	const t = await getTranslations({ locale, namespace: "events" });
	const event = await fetchQuery(api.events.getBySlug, { slug });

	if (!event) {
		// A missing event must not carry the same generic title as a real
		// one — `notFound()` is not called a second time here (the page
		// component below already does, and Next.js only needs one call per
		// request to produce the 404 response); this metadata call only
		// needs to stop asserting a title that implies the event exists.
		return {
			title: t("not_found"),
			description: t("not_found"),
		};
	}

	return {
		title: t("meta_title"),
		description: t("meta_description"),
	};
}

export default async function EventDetailPage({ params }: Props) {
	const { locale, slug } = await params;
	const t = await getTranslations({ locale, namespace: "events" });
	const event = await fetchQuery(api.events.getBySlug, { slug });

	if (!event) {
		notFound();
		// `notFound()` always throws in the real Next.js runtime (return type
		// `never`) — this `return` only guards a test double that does not.
		return;
	}

	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
			<div className="w-full max-w-2xl">
				<Link
					href={ROUTES.events}
					className="mb-8 inline-block text-muted-foreground text-sm transition-colors duration-150 hover:text-foreground"
				>
					{t("back_events")}
				</Link>
				<EventDetailSection slug={slug} />
			</div>
		</main>
	);
}

import { getTranslations } from "next-intl/server";
import { EventDetailSection } from "@/components/events/EventDetailSection";
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
 */
type Props = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "events" });
	return {
		title: t("meta_title"),
		description: t("meta_description"),
	};
}

export default async function EventDetailPage({ params }: Props) {
	const { locale, slug } = await params;
	const t = await getTranslations({ locale, namespace: "events" });

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

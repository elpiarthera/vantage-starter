import { getTranslations } from "next-intl/server";
import { EventListSection } from "@/components/events/EventListSection";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

/**
 * `/events` — the public browse page (mcpcn `event-card` / `event-list`
 * blocks, docs/mcpcn-block-mapping.md §4 "Events", Batch 4 fourth bullet).
 *
 * PUBLIC AND UNAUTHENTICATED, same reasoning as `/contact` (Batch 4's
 * first bullet): browsing events is the whole point of a public listing
 * page. `middleware.ts` lists `/events(.*)` in `isPublicRoute` so a
 * visitor reaches this page without being redirected to sign-up.
 */
type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "events" });
	return {
		title: t("meta_title"),
		description: t("meta_description"),
	};
}

export default async function EventsPage({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "events" });

	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
			<div className="w-full max-w-5xl">
				<Link
					href={ROUTES.home}
					className="mb-8 inline-block text-muted-foreground text-sm transition-colors duration-150 hover:text-foreground"
				>
					{t("back_home")}
				</Link>
				<h1 className="mb-8 font-semibold text-3xl text-foreground">
					{t("title")}
				</h1>
				<EventListSection />
			</div>
		</main>
	);
}

import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TrackingButton } from "@/components/dashboard/account/TrackingButton";
import { OrderConfirmation } from "@/components/ui/order-confirmation";
import { api } from "@/convex/_generated/api";
import { ROUTES } from "@/lib/routes";

/**
 * `/dashboard/account/order-confirmed` — the shared post-purchase
 * confirmation screen (mcpcn `order-confirm` / `payment-confirmed` blocks,
 * docs/mcpcn-block-mapping.md §4 "Commerce / confirmation", lines 173-181,
 * Batch 4). One route, two branches, driven by the signed-in user's most
 * recent `purchases` row's `kind`:
 *  - "digital"   -> `order-confirm`   (no tracking control)
 *  - "trackable" -> `payment-confirmed` (tracking control, driven by the
 *    row's `trackingRef`)
 *
 * AUTH: this is a dashboard route — `middleware.ts`'s `isPublicRoute` does
 * NOT list `/dashboard(.*)`, so `clerkMiddleware`'s `auth.protect()` has
 * already redirected an unauthenticated request before this Server
 * Component ever runs. The `redirect()` below is a defensive second layer,
 * not the primary gate.
 *
 * SERVER-SIDE CONVEX READ: this repo's one existing precedent for reading
 * Convex from a Server Component/Route Handler with a Clerk identity is
 * `app/api/consultant/onboard/route.ts` — `auth()` for `userId` +
 * `getToken({ template: "convex" })`, then `fetchQuery` from `convex/nextjs`
 * with that token. Reused verbatim here; no other pattern exists in the
 * repo for this shape of read.
 *
 * 404, NOT A 200 "NOT FOUND" SENTENCE: a signed-in user with no `purchases`
 * row calls `notFound()` — same contract as
 * `app/[locale]/changelog/[slug]/page.tsx`'s `ChangelogDetailSection`. This
 * repo already tracks one instance of the opposite defect (a genuine 404
 * rendered as an HTTP 200 page) as debt (`k1702eac75b36tpvd7rb05x7c98b176z`)
 * and this route must not become a second.
 */
type Props = {
	params: Promise<{ locale: string }>;
};

export default async function OrderConfirmedPage({ params }: Props) {
	const { locale } = await params;
	const { userId, getToken } = await auth();

	if (!userId) {
		redirect(ROUTES.signIn);
		// `redirect()` always throws in the real Next.js runtime (return type
		// `never`) — this `return` only guards a test double that does not.
		return;
	}

	const token = await getToken({ template: "convex" });
	const purchase = await fetchQuery(
		api.purchases.getLatestForUser,
		{ userId },
		token ? { token } : undefined,
	);

	if (!purchase) {
		notFound();
		// `notFound()` always throws in the real Next.js runtime (return type
		// `never`) — this `return` only guards a test double that does not.
		return;
	}

	const t = await getTranslations({ locale, namespace: "order_confirmation" });

	const purchasedOnLabel = new Intl.DateTimeFormat(locale, {
		dateStyle: "long",
	}).format(new Date(purchase.purchasedAt));

	const isTrackable = purchase.kind === "trackable";

	return (
		<div className="animate-in fade-in duration-300">
			<div className="border-b border-border px-4 md:px-6 py-4">
				<h1 className="text-base font-semibold text-foreground">
					{isTrackable ? t("trackable_heading") : t("digital_heading")}
				</h1>
			</div>
			<div className="px-4 md:px-6 py-6">
				<OrderConfirmation
					kind={purchase.kind}
					productKey={purchase.productKey}
					purchasedOnLabel={purchasedOnLabel}
					trackingRef={purchase.trackingRef}
					labels={{
						heading: isTrackable
							? t("trackable_heading")
							: t("digital_heading"),
						description: isTrackable
							? t("trackable_description")
							: t("digital_description"),
						productLabel: t("product_label"),
						purchasedOnLabel: t("purchased_on_label"),
						trackingRefLabel: t("tracking_ref_label"),
					}}
					trackingAction={
						isTrackable && purchase.trackingRef ? (
							<TrackingButton
								trackingRef={purchase.trackingRef}
								label={t("track_button")}
								copiedToastMessage={t("track_copied")}
							/>
						) : undefined
					}
				/>
			</div>
		</div>
	);
}

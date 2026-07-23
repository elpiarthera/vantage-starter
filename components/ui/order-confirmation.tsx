/**
 * `order-confirmation` — the shared presentational block behind the
 * post-purchase confirmation route (mcpcn `order-confirm` /
 * `payment-confirmed` blocks, docs/mcpcn-block-mapping.md §4 "Commerce /
 * confirmation", lines 173-181, Batch 4). Purely presentational, following
 * the same idiom as `components/ui/event-confirmation.tsx`: it renders
 * whatever branch its ONE caller (the server route) decided on, it never
 * queries or decides `kind` itself.
 *
 * Two branches, driven by `kind`:
 *  - "digital" -> `order-confirm`: confirmation + product info + a
 *    delivery-info line (download link), no tracking control.
 *  - "trackable" -> `payment-confirmed`: confirmation + delivery info +
 *    the tracking control, rendered via the `trackingAction` slot so the
 *    one genuinely interactive bit (clipboard copy) stays in its own small
 *    Client Component instead of promoting this whole block to one.
 *
 * NOTE ON SCOPE: `convex/purchases.ts`'s `purchases` table carries no price
 * field (`productKey`, `kind`, `trackingRef`, `purchasedAt`, `polarOrderId`
 * only) — a price row would have to be read off `subscriptionTiers`, and no
 * public query joins the two today. This component does not fabricate a
 * price; it renders exactly what the row provides.
 */

import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface OrderConfirmationProps {
	kind: "digital" | "trackable";
	productKey: string;
	purchasedOnLabel: string;
	labels: {
		heading: string;
		description: string;
		productLabel: string;
		purchasedOnLabel: string;
		trackingRefLabel?: string;
	};
	trackingRef?: string;
	/** Slot for the tracking control — only rendered on the "trackable" branch. */
	trackingAction?: ReactNode;
	className?: string;
}

export function OrderConfirmation({
	kind,
	productKey,
	purchasedOnLabel,
	labels,
	trackingRef,
	trackingAction,
	className,
}: OrderConfirmationProps) {
	return (
		<div
			data-slot="order-confirmation"
			aria-live="polite"
			className={cn(
				"flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center",
				className,
			)}
		>
			<CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
			<h2 className="font-semibold text-foreground text-xl">
				{labels.heading}
			</h2>
			<p className="text-muted-foreground text-sm">{labels.description}</p>

			<dl className="mt-2 grid w-full max-w-sm grid-cols-1 gap-2 text-left text-sm">
				<div className="flex items-center justify-between border-border border-b pb-2">
					<dt className="text-muted-foreground">{labels.productLabel}</dt>
					<dd className="font-medium text-foreground">{productKey}</dd>
				</div>
				<div className="flex items-center justify-between border-border border-b pb-2">
					<dt className="text-muted-foreground">{labels.purchasedOnLabel}</dt>
					<dd className="font-medium text-foreground">{purchasedOnLabel}</dd>
				</div>
				{kind === "trackable" && trackingRef ? (
					<div className="flex items-center justify-between pb-2">
						<dt className="text-muted-foreground">{labels.trackingRefLabel}</dt>
						<dd className="font-mono font-medium text-foreground">
							{trackingRef}
						</dd>
					</div>
				) : null}
			</dl>

			{kind === "trackable" && trackingAction ? (
				<div className="mt-2 w-full max-w-sm">{trackingAction}</div>
			) : null}
		</div>
	);
}

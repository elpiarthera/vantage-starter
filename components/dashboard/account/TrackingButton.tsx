"use client";

/**
 * The tracking control for the `payment-confirmed` branch of the shared
 * confirmation route (mcpcn `payment-confirmed` block,
 * docs/mcpcn-block-mapping.md §4 line 178, Batch 4).
 *
 * `purchases.trackingRef` is an opaque carrier reference (e.g.
 * "TRACK-1234567890", see `__tests__/convex/fixtures/purchases.ts`), not a
 * URL — no carrier/tracking-URL config exists anywhere in this repo
 * (`convex/schema.ts`'s `purchases` table carries no such field). Rather
 * than fabricate an external tracking-site integration this route has no
 * data to drive, the control copies the reference to the clipboard so the
 * user can paste it into whichever carrier's own tracking page they use —
 * the one action fully supported by the data this row actually carries.
 *
 * Isolated in its own small Client Component (the only interactive piece
 * of the confirmation screen) so `OrderConfirmation` and the route itself
 * stay Server Components.
 */
import { Check, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface TrackingButtonProps {
	trackingRef: string;
	label: string;
	copiedToastMessage: string;
}

export function TrackingButton({
	trackingRef,
	label,
	copiedToastMessage,
}: TrackingButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(trackingRef);
		setCopied(true);
		toast.success(copiedToastMessage);
	};

	return (
		<Button
			type="button"
			variant="outline"
			className="w-full"
			onClick={handleCopy}
		>
			{copied ? (
				<Check className="size-4" aria-hidden="true" />
			) : (
				<Truck className="size-4" aria-hidden="true" />
			)}
			{label}
		</Button>
	);
}

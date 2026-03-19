"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Detects the `?creditsAdded=1` query param that PurchaseCreditsModal appends
 * to the success_url after a successful Polar credit purchase.
 *
 * When detected:
 * 1. Shows a localised success toast — either via the provided `showToast`
 *    callback (for components that have their own toast system, e.g. voice/image
 *    generators) or via sonner's global `toast()` (for guided step pages which
 *    don't maintain their own toast state).
 * 2. Removes `creditsAdded` from the URL via replaceState so a hard refresh
 *    doesn't re-show the toast.
 *
 * Usage in a component with its own toast system:
 * ```ts
 * usePurchaseSuccessToast((msg) => showToast(msg, "success"));
 * ```
 *
 * Usage in a page/component that relies on the global Sonner Toaster:
 * ```ts
 * usePurchaseSuccessToast();
 * ```
 */
export function usePurchaseSuccessToast(
	showToast?: (message: string) => void,
): void {
	const searchParams = useSearchParams();
	const tCredits = useTranslations("credits");

	useEffect(() => {
		if (searchParams.get("creditsAdded") !== "1") return;

		const message = tCredits("purchase_success_toast");

		if (showToast) {
			showToast(message);
		} else {
			toast.success(message);
		}

		// Strip the param from the URL so a refresh doesn't re-show the toast
		const url = new URL(window.location.href);
		url.searchParams.delete("creditsAdded");
		window.history.replaceState(null, "", url.toString());
	}, [searchParams, showToast, tCredits]);
}

"use client";

import { AlertCircle, CreditCard, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useDevice } from "@/contexts/DeviceContext";
import { useRouter } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

interface InsufficientCreditsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onPurchase?: () => void;
	required: number;
	available: number;
	actionName?: string;
	/** When provided, Polar will redirect here after a successful purchase.
	 *  Defaults to the current page URL so the user always returns to their workflow. */
	returnUrl?: string;
}

/**
 * Modal displayed when user attempts an action but doesn't have enough credits.
 * Provides options to purchase more credits or cancel.
 *
 * @example
 * ```tsx
 * <InsufficientCreditsModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onPurchase={() => router.push('/dashboard/account?tab=credits')}
 *   required={20}
 *   available={5}
 *   actionName="Generate Video"
 * />
 * ```
 */
export function InsufficientCreditsModal({
	isOpen,
	onClose,
	onPurchase,
	required,
	available,
	actionName = "this action",
	returnUrl,
}: InsufficientCreditsModalProps) {
	const { isMobile } = useDevice();
	const tCredits = useTranslations("credits");
	const tErrors = useTranslations("errors");
	const tCommon = useTranslations("common");
	const router = useRouter();

	const creditsNeeded = Math.max(0, required - available);

	const handlePurchase = () => {
		onClose();
		if (onPurchase) {
			// Explicit handler provided — use it as-is (backward compatible)
			onPurchase();
		} else {
			// Smart default: navigate to credits tab, preserve originating URL so
			// PurchaseCreditsModal can set it as the Polar success_url.
			const returnTo =
				returnUrl ??
				(typeof window !== "undefined" ? window.location.href : "");
			const params = new URLSearchParams({ tab: "usage" });
			if (returnTo) params.set("returnTo", returnTo);
			router.push(`${ROUTES.dashboardAccount}?${params.toString()}`);
		}
	};

	const content = (
		<div className="space-y-6">
			{/* Warning Icon */}
			<div className="flex justify-center">
				<div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
					<AlertCircle className="w-8 h-8 text-warning" />
				</div>
			</div>

			{/* Credit Info */}
			<div className="space-y-4">
				<div className="bg-muted rounded-lg p-4 space-y-3">
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground">
							{tCredits("required_for_action", { actionName })}
						</span>
						<span className="text-foreground font-medium">
							{required} {tCredits("credits")}
						</span>
					</div>
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground">
							{tCredits("your_balance", { balance: available })}
						</span>
					</div>
					<div className="border-t border-border pt-3">
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">
								{tCredits("credits_needed")}
							</span>
							<span className="text-warning-accent font-bold">
								{tCredits("more_credits", { creditsNeeded })}
							</span>
						</div>
					</div>
				</div>

				{/* Tip */}
				<div className="flex items-start gap-2 text-xs text-muted-foreground">
					<Zap className="w-4 h-4 text-warning-accent flex-shrink-0 mt-0.5" />
					<p>{tCredits("purchase_tip")}</p>
				</div>
			</div>

			{/* Actions */}
			<div className="flex flex-col gap-3">
				<Button
					onClick={handlePurchase}
					className="w-full min-h-[44px] bg-gradient-to-r from-warning to-warning-secondary hover:from-warning-accent hover:to-warning-secondary-hover text-warning-foreground font-semibold"
				>
					<CreditCard className="w-4 h-4 mr-2" />
					{tCredits("purchase_button")}
				</Button>
				<Button
					variant="outline"
					onClick={onClose}
					className="w-full min-h-[44px]"
				>
					{tCommon("cancel")}
				</Button>
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DrawerContent className="bg-card border-border">
					<DrawerHeader className="text-center">
						<DrawerTitle className="text-foreground">
							{tErrors("insufficient_credits_title")}
						</DrawerTitle>
						<DrawerDescription className="text-muted-foreground">
							{tErrors("insufficient_credits_description", { actionName })}
						</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
						{content}
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="bg-card border-border sm:max-w-md">
				<DialogHeader className="text-center">
					<DialogTitle className="text-foreground">
						{tErrors("insufficient_credits_title")}
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						{tErrors("insufficient_credits_description", { actionName })}
					</DialogDescription>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { useAction, useQuery } from "convex/react";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";

interface PurchaseCreditsModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** When set, Polar will redirect the user to this URL after a successful
	 *  purchase instead of staying on the account page. Used to return the user
	 *  to the exact guided workflow step they came from. */
	successUrl?: string;
}

export function PurchaseCreditsModal({
	isOpen,
	onClose,
	successUrl,
}: PurchaseCreditsModalProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("purchase_credits_modal");

	// Single source of truth — fetched from Convex subscriptionTiers table.
	// No hardcoded data. Changing credit amounts or prices in Convex = instant UI update.
	const packages = useQuery(api.subscriptionTiers.listCreditPackages);

	const [selectedTierKey, setSelectedTierKey] =
		useState<string>("credits_popular");
	const [isCheckingOut, setIsCheckingOut] = useState(false);

	const selectedPackage = packages?.find((p) => p.tierKey === selectedTierKey);
	const selectedPolarProductId = selectedPackage?.polarProductId;

	const generateCheckoutLink = useAction(api.polar.generateCheckoutLink);

	const handleCheckout = async () => {
		if (!selectedPolarProductId) return;
		setIsCheckingOut(true);
		try {
			// Append creditsAdded=1 to the success URL so the landing page can
			// show a "Credits added" toast when the user returns to their workflow.
			const baseUrl = successUrl ?? window.location.href;
			const successWithFlag = new URL(baseUrl);
			successWithFlag.searchParams.set("creditsAdded", "1");

			const { url } = await generateCheckoutLink({
				productIds: [selectedPolarProductId],
				origin: window.location.origin,
				successUrl: successWithFlag.toString(),
			});
			window.location.href = url;
		} finally {
			setIsCheckingOut(false);
		}
	};

	const content = (
		<div className="space-y-6">
			{/* Credit Packages */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
				{packages === undefined ? (
					// Loading state
					<div className="col-span-2 flex items-center justify-center py-8 text-muted-foreground">
						<Loader2 className="h-5 w-5 animate-spin mr-2" />
						<span>{t("loading_packages")}</span>
					</div>
				) : (
					packages.map((pkg) => {
						const totalCredits = pkg.initialCredits + (pkg.bonusCredits ?? 0);
						const isSelected = selectedTierKey === pkg.tierKey;
						const isPopular = pkg.tierKey === "credits_popular";

						return (
							<Card
								key={pkg.tierKey}
								onClick={() => setSelectedTierKey(pkg.tierKey)}
								className={`
                  p-4 md:p-6 cursor-pointer transition-all relative
                  min-h-[120px]
                  ${isSelected ? "border-primary border-2 bg-primary/5" : "border-border"}
                  ${isMobile ? "active:scale-98" : "hover:border-primary/50"}
                `}
							>
								{isPopular && (
									<div className="absolute -top-2 right-4 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
										{t("popular_badge")}
									</div>
								)}

								<div className="space-y-3">
									<div className="flex items-baseline gap-2">
										<span className="text-3xl md:text-4xl font-bold">
											{totalCredits}
										</span>
										<span className="text-sm text-muted-foreground">
											{t("credits_unit")}
										</span>
										{(pkg.bonusCredits ?? 0) > 0 && (
											<span className="text-sm text-success font-medium">
												{t("bonus_amount", { count: pkg.bonusCredits ?? 0 })}
											</span>
										)}
									</div>

									<div className="space-y-1">
										<p className="text-sm text-muted-foreground">
											{pkg.displayName}
										</p>
										<p className="text-lg font-semibold">
											${pkg.priceUsd?.toFixed(2) ?? "—"}
										</p>
									</div>

									{isSelected && (
										<div className="flex items-center gap-2 text-primary text-sm font-medium">
											<Check className="h-4 w-4" />
											<span>{t("selected_label")}</span>
										</div>
									)}
								</div>
							</Card>
						);
					})
				)}
			</div>

			{/* Payment Info */}
			<Card className="p-4 md:p-6 bg-muted/50">
				<div className="space-y-3">
					<div className="flex items-center gap-2 text-sm font-medium">
						<CreditCard className="h-4 w-4" />
						<span>{t("payment_method_label")}</span>
					</div>
					<p className="text-sm text-muted-foreground">
						{t("payment_redirect_notice")}
					</p>
				</div>
			</Card>

			{/* Action Buttons */}
			<div className="flex flex-col-reverse md:flex-row gap-3 md:justify-end">
				<Button
					variant="outline"
					onClick={onClose}
					className="min-h-[44px] bg-transparent"
				>
					{t("cancel")}
				</Button>
				<Button
					onClick={handleCheckout}
					disabled={!selectedPolarProductId || isCheckingOut}
					className="min-h-[44px] w-full md:w-auto"
				>
					{isCheckingOut ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<CreditCard className="h-4 w-4 mr-2" />
					)}
					{t("purchase_credits_cta")}
				</Button>
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={onClose}>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>{t("purchase_credits_cta")}</DrawerTitle>
					</DrawerHeader>
					<div className="px-4 pb-6">{content}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("purchase_credits_cta")}</DialogTitle>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
}

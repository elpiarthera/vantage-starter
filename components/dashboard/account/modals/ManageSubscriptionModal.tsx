"use client";

import { CheckoutLink } from "@convex-dev/polar/react";
import { useAction, useQuery } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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

interface ManageSubscriptionModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentPlan: "free" | "starter" | "pro" | "enterprise";
}

// Maps DB tierKey → plan id used by the UI / currentPlan prop
const TIER_KEY_TO_PLAN_ID: Record<string, "starter" | "pro" | "enterprise"> = {
	tier_1: "starter",
	tier_2: "pro",
	tier_3: "enterprise",
};

// Numeric order for upgrade/downgrade detection
const PLAN_ORDER: Record<string, number> = {
	free: 0,
	starter: 1,
	pro: 2,
	enterprise: 3,
};

export function ManageSubscriptionModal({
	isOpen,
	onClose,
	currentPlan,
}: ManageSubscriptionModalProps) {
	const { isMobile } = useDevice();
	const [isChanging, setIsChanging] = useState(false);
	const t = useTranslations("manage_subscription_modal");

	const generatePortalUrl = useAction(api.polar.generateCustomerPortalUrl);

	// Single source of truth — subscription plans from Convex DB
	const dbTiers = useQuery(api.subscriptionTiers.listSubscriptionPlans);

	// Feature lists remain i18n strings (marketing copy, not business data)
	const planFeatures: Record<string, string[]> = {
		free: [
			t("free_feature_projects_per_month"),
			t("free_feature_ai_credits_per_month"),
			t("free_feature_sd_video_export"),
			t("free_feature_community_support"),
			t("free_feature_basic_templates"),
		],
		starter: [
			t("starter_feature_projects_per_month"),
			t("starter_feature_ai_credits_per_month"),
			t("starter_feature_sd_video_export"),
			t("starter_feature_email_support"),
			t("starter_feature_basic_templates"),
		],
		pro: [
			t("pro_feature_unlimited_projects"),
			t("pro_feature_ai_credits_per_month"),
			t("pro_feature_hd_video_export"),
			t("pro_feature_priority_support"),
			t("pro_feature_custom_templates"),
			t("pro_feature_advanced_analytics"),
		],
		enterprise: [
			t("enterprise_feature_unlimited_projects"),
			t("enterprise_feature_ai_credits_per_month"),
			t("enterprise_feature_4k_video_export"),
			t("enterprise_feature_dedicated_support"),
			t("enterprise_feature_custom_templates"),
			t("enterprise_feature_advanced_analytics"),
			t("enterprise_feature_api_access"),
			t("enterprise_feature_white_label_options"),
		],
	};

	// Build the full plans list: free (no Polar product) + DB tiers
	const plans = [
		{
			id: "free" as const,
			name: t("plan_name_free"),
			price: 0,
			monthlyCredits: 0,
			sortOrder: 0,
			polarProductId: undefined as string | undefined,
			popular: false,
			features: planFeatures.free,
		},
		...(dbTiers?.map((tier) => {
			const planId = TIER_KEY_TO_PLAN_ID[tier.tierKey] ?? "starter";
			return {
				id: planId as "starter" | "pro" | "enterprise",
				name: tier.displayName,
				price: tier.priceUsd ?? 0,
				monthlyCredits: tier.monthlyCredits ?? 0,
				sortOrder: tier.sortOrder,
				polarProductId: tier.polarProductId,
				popular: tier.tierKey === "tier_2",
				features: planFeatures[planId] ?? [],
			};
		}) ?? []),
	];

	const handleOpenPortal = async () => {
		setIsChanging(true);
		try {
			const { url } = await generatePortalUrl({});
			window.open(url, "_blank");
		} catch (error) {
			console.error("Failed to open customer portal:", error);
			alert("Failed to open customer portal. Please try again.");
		} finally {
			setIsChanging(false);
		}
	};

	const content = (
		<div className="space-y-6">
			{dbTiers === undefined ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			) : (
				<>
					{/* Plan Comparison */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{plans.map((plan) => {
							const isCurrent = plan.id === currentPlan;
							const isUpgrade =
								(PLAN_ORDER[plan.id] ?? 0) > (PLAN_ORDER[currentPlan] ?? 0);

							return (
								<Card
									key={plan.id}
									className={`p-4 md:p-6 space-y-4 relative ${isCurrent ? "border-primary border-2" : ""}`}
								>
									{plan.popular && (
										<Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
											{t("most_popular_badge")}
										</Badge>
									)}
									{isCurrent && (
										<Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
											{t("current_plan_badge")}
										</Badge>
									)}

									<div className="space-y-2">
										<h3 className="text-lg md:text-xl font-semibold">
											{plan.name}
										</h3>
										<p className="text-2xl md:text-3xl font-bold">
											${plan.price}
											<span className="text-sm font-normal text-muted-foreground">
												{t("price_per_month")}
											</span>
										</p>
										<p className="text-sm text-muted-foreground">
											{t("ai_credits_per_month", {
												credits: plan.monthlyCredits,
											})}
										</p>
									</div>

									<div className="space-y-2">
										{plan.features.map((feature) => (
											<div
												key={feature}
												className="flex items-start gap-2 text-sm"
											>
												<Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
												<span>{feature}</span>
											</div>
										))}
									</div>

									{isCurrent ? (
										<Button
											disabled
											variant="outline"
											className="w-full min-h-[44px]"
										>
											{t("current_plan_button")}
										</Button>
									) : plan.id === "free" ? (
										// Downgrade to free = cancel via Polar Portal
										<Button
											onClick={handleOpenPortal}
											disabled={isChanging}
											variant="outline"
											className="w-full min-h-[44px]"
										>
											{t("downgrade_button")}
										</Button>
									) : currentPlan === "free" ? (
										plan.polarProductId ? (
											<CheckoutLink
												polarApi={{
													generateCheckoutLink: api.polar.generateCheckoutLink,
												}}
												productIds={[plan.polarProductId]}
												embed={false}
												className="w-full"
												lazy
											>
												<Button
													variant={isUpgrade ? "default" : "outline"}
													className="w-full min-h-[44px]"
													disabled={isChanging}
												>
													{t("upgrade_button")}
												</Button>
											</CheckoutLink>
										) : (
											<Button
												variant="outline"
												disabled
												className="w-full min-h-[44px]"
											>
												{t("upgrade_button")}
											</Button>
										)
									) : (
										// Existing subscriber: open Polar Customer Portal for upgrade/downgrade/cancel
										<Button
											onClick={handleOpenPortal}
											disabled={isChanging}
											variant={isUpgrade ? "default" : "outline"}
											className="w-full min-h-[44px]"
										>
											{isUpgrade ? t("upgrade_button") : t("downgrade_button")}
										</Button>
									)}
								</Card>
							);
						})}
					</div>

					{/* Manage in Portal — for cancel, payment method, billing history */}
					{currentPlan !== "free" && (
						<div className="pt-6 border-t border-border">
							<Button
								onClick={handleOpenPortal}
								disabled={isChanging}
								variant="outline"
								className="min-h-[44px] w-full md:w-auto"
							>
								{t("manage_in_portal_button")}
							</Button>
							<p className="text-sm text-muted-foreground mt-2">
								{t("manage_in_portal_description")}
							</p>
						</div>
					)}
				</>
			)}
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={onClose}>
				<DrawerContent className="max-h-[90vh]">
					<DrawerHeader>
						<DrawerTitle>{t("manage_subscription_title")}</DrawerTitle>
					</DrawerHeader>
					<div className="px-4 pb-6 overflow-y-auto">{content}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("manage_subscription_title")}</DialogTitle>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
}

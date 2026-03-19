"use client";

import type { UserResource } from "@clerk/types";
import { CustomerPortalLink } from "@convex-dev/polar/react";
import { useQuery } from "convex/react";
import { Calendar, Check, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ManageSubscriptionModal } from "@/components/dashboard/account/modals/ManageSubscriptionModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import { useDateFormatter } from "@/hooks/useDateFormatter";

interface SubscriptionTabProps {
	user: UserResource;
}

export function SubscriptionTab({ user }: SubscriptionTabProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("subscription_tab");
	const [isManageModalOpen, setIsManageModalOpen] = useState(false);
	const { formatShort } = useDateFormatter();

	// Get user's subscription from Polar component (not the always-empty custom table)
	const subscription = useQuery(api.subscriptions.getFormattedSubscription, {
		clerkUserId: user.id,
	});

	const formatDate = (timestamp: number) => {
		return formatShort(timestamp);
	};

	const _formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	// If no subscription data yet, show loading or free plan
	const currentPlan = subscription?.plan.tier || "free";
	const planName = subscription?.plan.name || t("plan_name_free");
	const isActive = ["active", "trialing"].includes(subscription?.status ?? "");

	return (
		<div className="space-y-6 md:space-y-8">
			{/* Current Plan Section */}
			<div className="space-y-4">
				<h2 className="text-xl md:text-2xl font-semibold">
					{t("current_plan")}
				</h2>

				<Card className="p-4 md:p-6 space-y-4">
					<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<h3 className="text-lg md:text-xl font-semibold">{planName}</h3>
								<Badge
									variant={isActive ? "default" : "secondary"}
									className="capitalize"
								>
									{isActive ? t("status_active") : t("status_inactive")}
								</Badge>
							</div>
							{subscription && (
								<p className="text-2xl md:text-3xl font-bold text-primary">
									$
									{subscription.plan.tier === "starter"
										? "9.99"
										: subscription.plan.tier === "pro"
											? "29.99"
											: subscription.plan.tier === "enterprise"
												? "99.99"
												: "0.00"}
									<span className="text-sm md:text-base font-normal text-muted-foreground">
										{t("per_month")}
									</span>
								</p>
							)}
						</div>

						<Button
							onClick={() => setIsManageModalOpen(true)}
							size={isMobile ? "default" : "lg"}
							className="min-h-[44px] w-full md:w-auto"
						>
							{t("manage_subscription")}
						</Button>
					</div>

					{/* Plan Features */}
					{subscription && subscription.plan.features.length > 0 && (
						<div className="pt-4 border-t border-border">
							<h4 className="text-sm font-medium mb-3">{t("plan_features")}</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								{subscription.plan.features.map((feature) => (
									<div
										key={feature}
										className="flex items-center gap-2 text-sm"
									>
										<Check className="h-4 w-4 text-primary flex-shrink-0" />
										<span>{feature}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Billing Period */}
					{subscription && (
						<div className="pt-4 border-t border-border flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								<span>
									{t("current_period")}{" "}
									{subscription.currentPeriodStart
										? formatDate(subscription.currentPeriodStart)
										: "—"}
								</span>
							</div>
							<span className="hidden md:inline">-</span>
							<span>
								{subscription.currentPeriodEnd
									? formatDate(subscription.currentPeriodEnd)
									: "—"}
							</span>
						</div>
					)}
				</Card>
			</div>

			{/* Payment Method Section */}
			{subscription && (
				<div className="space-y-4">
					<h2 className="text-xl md:text-2xl font-semibold">
						{t("payment_method")}
					</h2>

					<Card className="p-4 md:p-6">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
							<div className="flex items-center gap-4">
								<div className="h-12 w-12 md:h-14 md:w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
									<CreditCard className="h-6 w-6 md:h-7 md:w-7 text-primary" />
								</div>
								<div className="space-y-1">
									<p className="font-medium">
										{t("payment_method_managed_by_polar")}
									</p>
									<p className="text-sm text-muted-foreground">
										{t("update_via_customer_portal")}
									</p>
								</div>
							</div>

							<CustomerPortalLink
								polarApi={{
									generateCustomerPortalUrl:
										api.polar.generateCustomerPortalUrl,
								}}
							>
								<Button
									variant="outline"
									size={isMobile ? "default" : "lg"}
									className="min-h-[44px] w-full md:w-auto bg-transparent"
								>
									{t("update_payment")}
								</Button>
							</CustomerPortalLink>
						</div>
					</Card>
				</div>
			)}

			{/* Billing History Section */}
			{subscription && (
				<div className="space-y-4">
					<h2 className="text-xl md:text-2xl font-semibold">
						{t("billing_history")}
					</h2>

					<Card className="p-4 md:p-6">
						<div className="text-sm text-muted-foreground">
							<p>{t("billing_history_managed_by_polar")}</p>
							<CustomerPortalLink
								polarApi={{
									generateCustomerPortalUrl:
										api.polar.generateCustomerPortalUrl,
								}}
								className="text-primary hover:underline"
							>
								{t("view_billing_history")}
							</CustomerPortalLink>
						</div>
					</Card>
				</div>
			)}

			{/* Manage Subscription Modal */}
			<ManageSubscriptionModal
				isOpen={isManageModalOpen}
				onClose={() => setIsManageModalOpen(false)}
				currentPlan={currentPlan}
			/>
		</div>
	);
}

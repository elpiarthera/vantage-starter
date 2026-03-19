"use client";

import { useUser } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import { useQuery } from "convex/react";
import {
	Activity,
	CreditCard,
	HardDrive,
	Sparkles,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PurchaseCreditsModal } from "@/components/dashboard/account/modals/PurchaseCreditsModal";
// biome-ignore lint/correctness/noUnusedImports: UsageChart used when Cost Breakdown section is uncommented (see Post-MVP-Improvement.md)
import { UsageChart } from "@/components/dashboard/usage/UsageChart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { useDateFormatter } from "@/hooks/useDateFormatter";

interface UsageCreditsTabProps {
	user: UserResource;
}

export function UsageCreditsTab({ user: _user }: UsageCreditsTabProps) {
	const { isMobile } = useDevice();
	const { user } = useUser();
	const t = useTranslations("usage_tab");
	const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

	// Read returnTo from URL — set by InsufficientCreditsModal when navigating here
	// from a guided workflow step. Passed to PurchaseCreditsModal as the Polar success_url.
	const searchParams = useSearchParams();
	const returnTo = searchParams.get("returnTo") ?? undefined;

	// Get real credit balance from Convex
	const {
		balance,
		totalUsed,
		totalPurchased,
		isLoading: creditsLoading,
	} = useCredits(user?.id || "");

	// Get real usage history from Convex
	const usageHistory = useQuery(api.usageTracking.listByUser, { limit: 50 });

	const isLoading = creditsLoading || usageHistory === undefined;

	// Date formatter hook for i18n
	const { formatShort } = useDateFormatter();

	// Placeholder — wire up to product-specific project data when available
	const projectNameMap: Record<string, string> = {};

	// Calculate usage statistics from real data
	const usageStats = useMemo(() => {
		if (!usageHistory)
			return {
				images: 0,
				videos: 0,
				music: 0,
				narrations: 0,
				totalCost: 0,
				totalCredits: 0,
			};

		return {
			images: usageHistory.filter((u) => u.resourceType === "image").length,
			videos: usageHistory.filter((u) => u.resourceType === "video").length,
			music: usageHistory.filter(
				(u) =>
					u.resourceType === "audio" &&
					(u.model?.toLowerCase().includes("stable-audio") ||
						u.model?.toLowerCase().includes("lyria") ||
						u.eventType === "music_generation"),
			).length,
			narrations: usageHistory.filter(
				(u) =>
					u.resourceType === "audio" &&
					(u.model?.toLowerCase().includes("minimax") ||
						u.eventType === "narration_generation"),
			).length,
			totalCost: usageHistory.reduce((sum, u) => sum + (u.cost || 0), 0),
			totalCredits: usageHistory.reduce(
				(sum, u) => sum + (u.creditsUsed ?? 0),
				0,
			),
		};
	}, [usageHistory]);

	// Format date using i18n
	const formatDate = (timestamp: number) => {
		return formatShort(timestamp);
	};

	// Kept for potential re-use if Cost (USD) or Cost Breakdown is shown again (see Post-MVP-Improvement.md)
	// biome-ignore lint/correctness/noUnusedVariables: reserved for future USD display
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	if (isLoading) {
		return (
			<div className="space-y-6 md:space-y-8">
				{/* Credit Balance Skeleton */}
				<div>
					<Skeleton className="h-8 w-40 mb-4" />
					<Skeleton className="h-32 w-full" />
				</div>

				{/* Usage Statistics Skeleton */}
				<div>
					<Skeleton className="h-8 w-48 mb-4" />
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-24" />
						))}
					</div>
				</div>

				{/* Chart Skeleton */}
				<div>
					<Skeleton className="h-8 w-40 mb-4" />
					<Skeleton className="h-64 w-full" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 md:space-y-8">
			{/* Credit Balance Section */}
			<div>
				<h2 className="text-xl md:text-2xl font-semibold mb-4">
					{t("credit_balance")}
				</h2>
				<Card className="p-4 md:p-6">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<CreditCard className="h-4 w-4" />
								<span className="text-sm">{t("available_credits")}</span>
							</div>
							<div className="text-3xl md:text-4xl font-bold text-primary">
								{t("credits_label", { count: balance })}
							</div>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<span>
									{t("total_purchased")} <strong>{totalPurchased}</strong>
								</span>
								<span>
									{t("total_used")} <strong>{totalUsed}</strong>
								</span>
							</div>
						</div>
						<Button
							size={isMobile ? "lg" : "default"}
							onClick={() => setIsPurchaseModalOpen(true)}
							className="min-h-[44px] w-full md:w-auto"
						>
							<CreditCard className="h-4 w-4 mr-2" />
							{t("purchase_credits")}
						</Button>
					</div>
				</Card>
			</div>

			{/* Usage Statistics */}
			<div>
				<h2 className="text-xl md:text-2xl font-semibold mb-4">
					{t("usage_statistics")}
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
					{/* API Calls */}
					<Card className="p-4 md:p-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 rounded-lg bg-primary/10">
								<Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
							</div>
							<span className="text-2xl md:text-3xl font-bold">
								{usageStats.images}
							</span>
						</div>
						<p className="text-xs md:text-sm text-muted-foreground">
							{t("images_generated")}
						</p>
					</Card>

					{/* AI Generations */}
					<Card className="p-4 md:p-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 rounded-lg bg-primary/10">
								<Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
							</div>
							<span className="text-2xl md:text-3xl font-bold">
								{usageStats.videos}
							</span>
						</div>
						<p className="text-xs md:text-sm text-muted-foreground">
							{t("videos_generated")}
						</p>
					</Card>

					{/* Storage Used */}
					<Card className="p-4 md:p-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 rounded-lg bg-primary/10">
								<HardDrive className="h-4 w-4 md:h-5 md:w-5 text-primary" />
							</div>
							<span className="text-2xl md:text-3xl font-bold">
								{usageStats.music}
							</span>
						</div>
						<p className="text-xs md:text-sm text-muted-foreground">
							{t("music_tracks")}
						</p>
					</Card>

					{/* Credits Consumed */}
					<Card className="p-4 md:p-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 rounded-lg bg-primary/10">
								<Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
							</div>
							<span className="text-2xl md:text-3xl font-bold">
								{usageStats.narrations}
							</span>
						</div>
						<p className="text-xs md:text-sm text-muted-foreground">
							{t("narrations")}
						</p>
					</Card>
				</div>
			</div>

			{/* COMMENT DO NOT DELETE - Cost Breakdown section: to implement later (see docs/Post MVP Improvement/Post-MVP-Improvement.md)
			<div>
				<h2 className="text-xl md:text-2xl font-semibold mb-4">
					{t("cost_breakdown")}
				</h2>
				<Card className="p-4 md:p-6">
					<UsageChart usageData={usageHistory || []} />
				</Card>
			</div>
			*/}

			{/* Usage History Table */}
			<div>
				<h2 className="text-xl md:text-2xl font-semibold mb-4">
					{t("usage_history")}
				</h2>
				<Card className="overflow-hidden">
					{!usageHistory || usageHistory.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							<TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p className="text-lg font-medium">{t("no_history_title")}</p>
							<p className="text-sm">{t("no_history_desc")}</p>
						</div>
					) : isMobile ? (
						// Mobile: Card layout
						<div className="divide-y divide-border">
							{usageHistory.map((usage) => (
								<div key={usage._id} className="p-4 space-y-2">
									<div className="flex items-start justify-between">
										<div className="space-y-1">
											<p className="font-medium text-sm">
												{usage.projectId
													? (projectNameMap[usage.projectId] ?? usage.projectId)
													: t("no_project")}
											</p>
											{/* COMMENT DO NOT DELETE - Service/Model: see Post-MVP-Improvement.md
											<p className="text-xs text-muted-foreground">{usage.service}</p>
											<p className="text-xs text-muted-foreground">{usage.model}</p>
											*/}
										</div>
										<span className="font-semibold text-sm">
											{t("credits_label", {
												count: usage.creditsUsed ?? 0,
											})}
										</span>
									</div>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span className="capitalize">{usage.resourceType}</span>
										<span>{formatDate(usage.timestamp)}</span>
									</div>
								</div>
							))}
						</div>
					) : (
						// Desktop: Table layout
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-muted/50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											{t("project_name")}
										</th>
										{/* COMMENT DO NOT DELETE - Service column: see Post-MVP-Improvement.md
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											{t("service")}
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											{t("model")}
										</th>
										*/}
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											{t("resource_type")}
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											{t("credits")}
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											{t("date")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{usageHistory.map((usage) => (
										<tr key={usage._id} className="hover:bg-muted/50">
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												{usage.projectId
													? (projectNameMap[usage.projectId] ?? usage.projectId)
													: t("no_project")}
											</td>
											{/* COMMENT DO NOT DELETE - Service/Model columns: see Post-MVP-Improvement.md
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												{usage.service}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
												{usage.model}
											</td>
											*/}
											<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
												{usage.resourceType}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
												{t("credits_label", {
													count: usage.creditsUsed ?? 0,
												})}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
												{formatDate(usage.timestamp)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card>
			</div>

			{/* Total Credits Used Summary */}
			<Card className="p-4 md:p-6 bg-muted/50">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5 text-primary" />
						<span className="font-medium">{t("total_credits_used")}</span>
					</div>
					<span className="text-xl md:text-2xl font-bold">
						{t("credits_label", { count: usageStats.totalCredits })}
					</span>
				</div>
			</Card>

			{/* Purchase Credits Modal */}
			<PurchaseCreditsModal
				isOpen={isPurchaseModalOpen}
				onClose={() => setIsPurchaseModalOpen(false)}
				successUrl={returnTo}
			/>
		</div>
	);
}

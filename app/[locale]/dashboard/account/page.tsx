"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { AccountTabs } from "@/components/dashboard/account/AccountTabs";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountPage() {
	const { user, isLoaded } = useUser();
	const t = useTranslations("account");

	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-background animate-in fade-in duration-300">
				{/* Page Header Skeleton */}
				<div className="border-b border-border bg-card">
					<div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
						<div className="max-w-6xl mx-auto space-y-2">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-4 w-64" />
						</div>
					</div>
				</div>

				{/* Tabs Skeleton */}
				<div className="container mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-64 w-full" />
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-background animate-in fade-in duration-300">
				<div className="border-b border-border bg-card">
					<div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
						<h1 className="text-2xl md:text-3xl font-bold text-foreground">
							{t("title")}
						</h1>
					</div>
				</div>
				<div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
					<ErrorState
						title={t("error_title")}
						description={t("error_description")}
						actionLabel={t("sign_in")}
						onAction={() => {
							window.location.href = "/sign-in";
						}}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background animate-in fade-in duration-300">
			{/* Page Header */}
			<div className="border-b border-border bg-card">
				<div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
					<h1 className="text-2xl md:text-3xl font-bold text-foreground">
						{t("title")}
					</h1>
					<p className="text-sm md:text-base text-muted-foreground mt-2">
						{t("subtitle")}
					</p>
				</div>
			</div>

			{/* Account Tabs */}
			<div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
				<Suspense fallback={null}>
					<AccountTabs user={user} />
				</Suspense>
			</div>
		</div>
	);
}

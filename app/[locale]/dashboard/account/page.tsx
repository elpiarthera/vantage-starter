"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { AccountTabs } from "@/components/dashboard/account/AccountTabs";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";

export default function AccountPage() {
	const { user, isLoaded } = useUser();
	const t = useTranslations("account");

	if (!isLoaded) {
		return (
			<div className="animate-in fade-in duration-300">
				{/* Page Header Skeleton */}
				<div className="border-b border-border px-4 md:px-6 py-4">
					<div className="space-y-1.5">
						<div className="animate-pulse bg-muted rounded h-5 w-36" />
						<div className="animate-pulse bg-muted rounded h-3 w-56" />
					</div>
				</div>

				{/* Tabs Skeleton */}
				<div className="px-4 md:px-6 py-6 space-y-6">
					<div className="animate-pulse bg-muted rounded h-9 w-64" />
					<div className="animate-pulse bg-muted rounded h-64 w-full" />
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="animate-in fade-in duration-300">
				<div className="border-b border-border px-4 md:px-6 py-4">
					<h1 className="text-base font-semibold text-foreground">
						{t("title")}
					</h1>
				</div>
				<div className="px-4 md:px-6 py-6">
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
		<div className="animate-in fade-in duration-300">
			{/* Page Header */}
			<div className="border-b border-border px-4 md:px-6 py-4">
				<h1 className="text-base font-semibold text-foreground">
					{t("title")}
				</h1>
				<p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
			</div>

			{/* Account Tabs */}
			<Suspense fallback={null}>
				<AccountTabs user={user} />
			</Suspense>
		</div>
	);
}

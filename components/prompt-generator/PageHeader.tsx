"use client";

import { RefreshIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { DashboardSubheader } from "@/components/ui/dashboard-subheader";

interface PageHeaderProps {
	onClearAll: () => void;
}

export function PageHeader({ onClearAll }: PageHeaderProps) {
	return (
		<div className="border-b border-border bg-card/30">
			<div className="flex items-center justify-between">
				<DashboardSubheader
					icon={SparklesIcon}
					title="Prompt Generator"
					description="Create professional cinematic prompts with our intelligent generator"
				/>
				<Button onClick={onClearAll} variant="outline" className="gap-2">
					<HugeiconsIcon icon={RefreshIcon} className="size-4" />
					Clear All
				</Button>
			</div>
		</div>
	);
}

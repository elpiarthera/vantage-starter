"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
	title: string;
	description?: string;
	action?: {
		label: string | React.ReactNode;
		onClick: () => void;
		icon?: LucideIcon;
	};
}

export function AdminHeader({ title, description, action }: AdminHeaderProps) {
	return (
		<div className="border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-10">
			<div className="h-[88px] px-8 flex items-center">
				<div className="flex items-center justify-between w-full">
					<div>
						<h1 className="text-2xl font-semibold text-foreground">{title}</h1>
						{description && (
							<p className="text-sm text-muted-foreground mt-1">
								{description}
							</p>
						)}
					</div>
					{action && (
						<Button onClick={action.onClick} className="gap-2">
							{action.icon && <action.icon className="w-4 h-4" />}
							{action.label}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

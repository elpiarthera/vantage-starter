"use client";

/**
 * MissionsHeader — Ported from vantage-studio
 * Adapted for vantage-starter:
 * - lucide-react → inline SVGs
 * - shadcn Button/SidebarTrigger → native HTML with OKLCH tokens
 * - MissionWizard removed — uses CreateMissionModal directly
 * - MissionFilters removed — filter toggle simplified to callback prop
 */

import type { ReactNode } from "react";
import { CreateMissionModal } from "./create-mission-modal";

interface MissionsHeaderProps {
	onCreateSuccess?: () => void;
	children?: ReactNode;
}

export function MissionsHeader({
	onCreateSuccess,
	children,
}: MissionsHeaderProps) {
	return (
		<header className="flex items-center justify-between p-4 md:p-6 border-b border-border shrink-0">
			{/* Left: icon + title */}
			<div className="flex items-center gap-3">
				<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					{/* Target icon */}
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-primary"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="10" />
						<circle cx="12" cy="12" r="6" />
						<circle cx="12" cy="12" r="2" />
					</svg>
				</div>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Mission Control
					</h1>
					<p className="text-sm text-muted-foreground">See the factory floor</p>
				</div>
			</div>

			{/* Right: children + create button */}
			<div className="flex items-center gap-2">
				{children}
				<CreateMissionModal
					onSuccess={onCreateSuccess}
					trigger={
						<button
							type="button"
							className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{/* Rocket icon */}
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								aria-hidden="true"
							>
								<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
								<path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
								<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
								<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
							</svg>
							New Mission
						</button>
					}
				/>
			</div>
		</header>
	);
}

"use client";

/**
 * MissionsEmptyState — Ported from vantage-studio
 * Adapted for vantage-starter:
 * - lucide-react → inline SVGs
 * - shadcn Button → native HTML with OKLCH tokens
 * - Uses local CreateMissionModal
 */

import { CreateMissionModal } from "./create-mission-modal";

export function MissionsEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
			{/* Target icon */}
			<div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
				<svg
					width="32"
					height="32"
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

			<h2 className="text-xl font-semibold tracking-tight text-foreground mb-2">
				No missions yet
			</h2>

			<p className="text-sm text-muted-foreground max-w-md mb-6">
				Missions are goal-driven containers for your AI-powered work. Create
				your first mission to start orchestrating agents.
			</p>

			<CreateMissionModal
				trigger={
					<button
						type="button"
						className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:bg-primary/90 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
						Create Your First Mission
					</button>
				}
			/>

			{/* Tips */}
			<div className="mt-8 rounded-lg border border-border bg-muted/50 p-4 text-left max-w-md">
				<div className="flex items-start gap-3">
					{/* Lightbulb icon */}
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="mt-0.5 text-warning shrink-0"
						aria-hidden="true"
					>
						<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
						<path d="M9 18h6" />
						<path d="M10 22h4" />
					</svg>
					<div className="text-sm">
						<p className="font-medium text-foreground">What is a Mission?</p>
						<p className="mt-1 text-muted-foreground">
							A mission contains a brief (shared context for AI), operations
							(tasks), and flows through stages: Pending → Executing → Awaiting
							Checkpoint → Completed.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

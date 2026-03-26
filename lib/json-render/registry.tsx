"use client";

/**
 * VantageStarter json-render Component Registry
 *
 * Maps catalog component names to React components.
 * Design: sharp cards (0px radius), Space Grotesk headings, OKLCH palette.
 * Adapted from vantage-studio with VantageStarter design tokens.
 */

import type { ComponentRegistry } from "@json-render/react";
import { cn } from "@/lib/utils";

// ============================================================================
// STATUS ICONS (inline SVG — no icon lib dependency)
// ============================================================================

function IconBot() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden="true"
		>
			<rect x="3" y="11" width="18" height="10" rx="2" />
			<circle cx="12" cy="5" r="2" />
			<line x1="12" y1="7" x2="12" y2="11" />
			<line
				x1="8"
				y1="16"
				x2="8"
				y2="16"
				strokeWidth="2.5"
				strokeLinecap="round"
			/>
			<line
				x1="12"
				y1="16"
				x2="12"
				y2="16"
				strokeWidth="2.5"
				strokeLinecap="round"
			/>
			<line
				x1="16"
				y1="16"
				x2="16"
				y2="16"
				strokeWidth="2.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function IconUser() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden="true"
		>
			<circle cx="12" cy="8" r="4" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
		</svg>
	);
}

function IconClock() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<polyline points="12 7 12 12 15 15" />
		</svg>
	);
}

function IconArrow() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden="true"
		>
			<path d="M5 12h14M12 5l7 7-7 7" />
		</svg>
	);
}

function IconCheck() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}

function IconPause() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<line x1="10" y1="8" x2="10" y2="16" />
			<line x1="14" y1="8" x2="14" y2="16" />
		</svg>
	);
}

// ============================================================================
// COMPONENTS
// ============================================================================

export const vantageOSRegistry: ComponentRegistry = {
	MissionProposal: ({ element, children }: any) => {
		const { name, brief, objective, estimatedTimeline, successCriteria } =
			element.props;

		return (
			<div
				className="w-full border border-border bg-[oklch(0.17_0.01_240)] overflow-hidden"
				role="region"
				aria-label={`Mission proposal: ${name}`}
			>
				{/* Header */}
				<div className="border-b border-border px-6 py-5">
					<div className="flex items-start justify-between gap-4 mb-3">
						<h2 className="font-space-grotesk text-lg font-semibold text-[oklch(0.93_0.01_240)] leading-tight">
							{name}
						</h2>
						<span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border border-[oklch(0.62_0.18_240)] text-[oklch(0.62_0.18_240)] tabular-nums">
							{estimatedTimeline}
						</span>
					</div>

					{brief && (
						<p className="text-sm text-[oklch(0.65_0.01_240)] leading-relaxed mb-4">
							{brief}
						</p>
					)}

					{objective && (
						<div className="bg-[oklch(0.13_0.01_240)] border border-border px-4 py-3">
							<p className="text-xs font-medium text-[oklch(0.65_0.01_240)] uppercase tracking-wider mb-1">
								Objective
							</p>
							<p className="text-sm text-[oklch(0.93_0.01_240)] leading-relaxed">
								{objective}
							</p>
						</div>
					)}
				</div>

				{/* Success Criteria */}
				{successCriteria && successCriteria.length > 0 && (
					<div className="border-b border-border px-6 py-4">
						<p className="text-xs font-medium text-[oklch(0.65_0.01_240)] uppercase tracking-wider mb-3">
							Success Criteria
						</p>
						<ul className="space-y-2">
							{successCriteria.map((criterion: string, i: number) => (
								<li key={i} className="flex items-start gap-2 text-sm">
									<span className="mt-0.5 text-[oklch(0.62_0.18_240)] shrink-0">
										<IconCheck />
									</span>
									<span className="text-[oklch(0.65_0.01_240)] leading-relaxed">
										{criterion}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Operations + Checkpoints */}
				<div className="px-6 py-4 space-y-2">{children}</div>
			</div>
		);
	},

	OperationItem: ({ element }: any) => {
		const {
			id,
			name,
			description,
			type,
			assignedAgent,
			estimatedMinutes,
			phase,
			dependsOn,
			requiredTools,
			requiresReview,
		} = element.props;

		const isAI = type === "ai";

		return (
			<div className="border border-border bg-[oklch(0.13_0.01_240)] p-4">
				{/* Top row */}
				<div className="flex items-start gap-3 mb-3">
					{/* Type indicator */}
					<div
						className={cn(
							"mt-0.5 shrink-0 w-6 h-6 flex items-center justify-center",
							isAI
								? "text-[oklch(0.62_0.18_240)]"
								: "text-[oklch(0.75_0.14_65)]",
						)}
						aria-label={isAI ? "AI operation" : "Human operation"}
					>
						{isAI ? <IconBot /> : <IconUser />}
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap mb-1">
							<span className="text-sm font-medium text-[oklch(0.93_0.01_240)]">
								{name}
							</span>
							{requiresReview && (
								<span className="text-xs px-2 py-0.5 rounded-full border border-[oklch(0.75_0.14_65)]/50 text-[oklch(0.75_0.14_65)]">
									Review required
								</span>
							)}
							{phase && (
								<span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.17_0.01_240)] text-[oklch(0.65_0.01_240)] border border-border">
									{phase}
								</span>
							)}
						</div>
						{description && (
							<p className="text-xs text-[oklch(0.65_0.01_240)] leading-relaxed">
								{description}
							</p>
						)}
					</div>
				</div>

				{/* Metadata row */}
				<div className="flex flex-wrap items-center gap-4 text-xs text-[oklch(0.65_0.01_240)] ml-9">
					{assignedAgent && (
						<span className="flex items-center gap-1">
							{isAI ? <IconBot /> : <IconUser />}
							{assignedAgent}
						</span>
					)}
					{estimatedMinutes && (
						<span className="flex items-center gap-1 tabular-nums">
							<IconClock />
							{estimatedMinutes} min
						</span>
					)}
					{dependsOn && dependsOn.length > 0 && (
						<span className="flex items-center gap-1">
							<IconArrow />
							After {dependsOn.length} op{dependsOn.length > 1 ? "s" : ""}
						</span>
					)}
					{requiredTools && requiredTools.length > 0 && (
						<span className="text-[oklch(0.65_0.01_240)]">
							{requiredTools.join(", ")}
						</span>
					)}
				</div>
			</div>
		);
	},

	Checkpoint: ({ element }: any) => {
		const { description } = element.props;

		return (
			<div
				className="flex items-center gap-3 border-2 border-dashed border-[oklch(0.75_0.14_65)]/50 bg-[oklch(0.75_0.14_65)]/5 px-4 py-3"
				role="note"
				aria-label="Human checkpoint"
			>
				<div className="shrink-0 text-[oklch(0.75_0.14_65)]">
					<IconPause />
				</div>
				<div>
					<p className="text-xs font-medium text-[oklch(0.75_0.14_65)] uppercase tracking-wider mb-0.5">
						Checkpoint
					</p>
					<p className="text-xs text-[oklch(0.65_0.01_240)] leading-relaxed">
						{description}
					</p>
				</div>
			</div>
		);
	},

	SuccessCriteria: ({ element }: any) => {
		const { description } = element.props;
		return (
			<div className="flex items-start gap-2 text-sm">
				<span className="mt-0.5 text-[oklch(0.62_0.18_240)] shrink-0">
					<IconCheck />
				</span>
				<span className="text-[oklch(0.65_0.01_240)] leading-relaxed">
					{description}
				</span>
			</div>
		);
	},

	ActionButton: ({ element }: any) => {
		const { label, action, variant } = element.props;

		const isDestructive = variant === "destructive";
		const isPrimary = variant === "primary" || !variant;

		return (
			<button
				type="button"
				className={cn(
					"px-6 py-2.5 rounded-full text-sm font-medium transition-opacity duration-150 min-h-[44px]",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
					isDestructive
						? "bg-[oklch(0.65_0.2_25)] text-white hover:opacity-80 focus-visible:ring-[oklch(0.65_0.2_25)]"
						: isPrimary
							? "bg-[oklch(0.62_0.18_240)] text-white hover:opacity-80 focus-visible:ring-[oklch(0.62_0.18_240)]"
							: "border border-border text-[oklch(0.93_0.01_240)] hover:opacity-80 focus-visible:ring-border",
				)}
				onClick={() => console.log(`Action: ${action}`)}
			>
				{label}
			</button>
		);
	},

	// ============================================================================
	// ONBOARDING COMPONENTS
	// ============================================================================

	OnboardingConfig: ({ element, children }: any) => {
		const { projectName, clientName, sector, summary, painPoints } =
			element.props;

		return (
			<section
				className="w-full border border-border bg-[oklch(0.17_0.01_240)] overflow-hidden"
				aria-label={`Onboarding config: ${projectName}`}
			>
				{/* Header */}
				<div className="border-b border-border px-6 py-5">
					<div className="flex items-start justify-between gap-4 mb-2">
						<h2 className="font-space-grotesk text-lg font-semibold text-[oklch(0.93_0.01_240)] leading-tight">
							{projectName}
						</h2>
						<span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border border-[oklch(0.62_0.18_240)] text-[oklch(0.62_0.18_240)] uppercase tracking-wider">
							{sector}
						</span>
					</div>

					<p className="text-xs text-[oklch(0.65_0.01_240)] mb-3">
						{clientName}
					</p>

					{summary && (
						<div className="bg-[oklch(0.13_0.01_240)] border border-border px-4 py-3 mb-4">
							<p className="text-xs font-medium text-[oklch(0.65_0.01_240)] uppercase tracking-wider mb-1">
								Summary
							</p>
							<p className="text-sm text-[oklch(0.93_0.01_240)] leading-relaxed">
								{summary}
							</p>
						</div>
					)}

					{painPoints && painPoints.length > 0 && (
						<div>
							<p className="text-xs font-medium text-[oklch(0.65_0.01_240)] uppercase tracking-wider mb-2">
								Pain Points
							</p>
							<div className="flex flex-wrap gap-1.5">
								{painPoints.map((pain: string) => (
									<span
										key={pain}
										className="text-xs px-2.5 py-1 rounded-full bg-[oklch(0.65_0.2_25)]/10 border border-[oklch(0.65_0.2_25)]/30 text-[oklch(0.75_0.15_25)]"
									>
										{pain}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Selected teams, agents, skills */}
				<div className="px-6 py-4 space-y-2">{children}</div>
			</section>
		);
	},

	TeamSelection: ({ element, children }: any) => {
		const { name, description, category, agentCount, selected, matchedPains } =
			element.props;

		return (
			<fieldset
				className={cn(
					"border p-4 transition-colors duration-150",
					selected
						? "border-[oklch(0.62_0.18_240)] bg-[oklch(0.62_0.18_240)]/5"
						: "border-border bg-[oklch(0.13_0.01_240)]",
				)}
			>
				<legend className="sr-only">{name}</legend>
				{/* Top row */}
				<div className="flex items-start gap-3 mb-3">
					<div
						className={cn(
							"mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded-full border",
							selected
								? "border-[oklch(0.62_0.18_240)] bg-[oklch(0.62_0.18_240)] text-white"
								: "border-[oklch(0.45_0.01_240)]",
						)}
					>
						{selected && <IconCheck />}
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap mb-1">
							<span className="text-sm font-medium text-[oklch(0.93_0.01_240)]">
								{name}
							</span>
							<span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.17_0.01_240)] text-[oklch(0.65_0.01_240)] border border-border">
								{category}
							</span>
							<span className="text-xs px-2 py-0.5 rounded-full border border-[oklch(0.62_0.18_240)]/50 text-[oklch(0.62_0.18_240)] tabular-nums">
								{agentCount} agent{agentCount !== 1 ? "s" : ""}
							</span>
						</div>
						{description && (
							<p className="text-xs text-[oklch(0.65_0.01_240)] leading-relaxed">
								{description}
							</p>
						)}
					</div>
				</div>

				{/* Matched pains */}
				{matchedPains && matchedPains.length > 0 && (
					<div className="flex flex-wrap gap-1.5 ml-8 mb-3">
						{matchedPains.map((pain: string) => (
							<span
								key={pain}
								className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.65_0.2_25)]/10 border border-[oklch(0.65_0.2_25)]/30 text-[oklch(0.75_0.15_25)]"
							>
								{pain}
							</span>
						))}
					</div>
				)}

				{/* Child agents */}
				{children && <div className="ml-8 space-y-1.5">{children}</div>}
			</fieldset>
		);
	},

	AgentSelection: ({ element, children }: any) => {
		const { name, role, description, skills, selected } = element.props;

		return (
			<div
				className={cn(
					"flex items-start gap-3 border p-3 transition-colors duration-150",
					selected
						? "border-[oklch(0.62_0.18_240)]/40 bg-[oklch(0.62_0.18_240)]/5"
						: "border-border bg-[oklch(0.13_0.01_240)]",
				)}
			>
				{/* Bot icon */}
				<div
					className={cn(
						"mt-0.5 shrink-0",
						selected
							? "text-[oklch(0.62_0.18_240)]"
							: "text-[oklch(0.45_0.01_240)]",
					)}
				>
					<IconBot />
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap mb-0.5">
						<span className="text-sm font-medium text-[oklch(0.93_0.01_240)]">
							{name}
						</span>
						<span className="text-xs text-[oklch(0.65_0.01_240)]">{role}</span>
					</div>

					{description && (
						<p className="text-xs text-[oklch(0.65_0.01_240)] leading-relaxed mb-2">
							{description}
						</p>
					)}

					{skills && skills.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{skills.map((skill: string) => (
								<span
									key={skill}
									className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.17_0.01_240)] border border-border text-[oklch(0.65_0.01_240)]"
								>
									{skill}
								</span>
							))}
						</div>
					)}

					{children && <div className="mt-2">{children}</div>}
				</div>
			</div>
		);
	},

	SkillSelection: ({ element }: any) => {
		const { name, description, category, selected } = element.props;

		return (
			<div
				className={cn(
					"flex items-center gap-3 border px-3 py-2.5 transition-colors duration-150",
					selected
						? "border-[oklch(0.62_0.18_240)]/40 bg-[oklch(0.62_0.18_240)]/5"
						: "border-border bg-[oklch(0.13_0.01_240)]",
				)}
			>
				{/* Checkbox indicator */}
				<div
					className={cn(
						"shrink-0 w-4 h-4 flex items-center justify-center border",
						selected
							? "border-[oklch(0.62_0.18_240)] bg-[oklch(0.62_0.18_240)] text-white"
							: "border-[oklch(0.45_0.01_240)]",
					)}
				>
					{selected && (
						<svg
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							aria-hidden="true"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					)}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-xs font-medium text-[oklch(0.93_0.01_240)]">
							{name}
						</span>
						{description && (
							<span className="text-xs text-[oklch(0.65_0.01_240)] truncate">
								{description}
							</span>
						)}
					</div>
				</div>

				<span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-[oklch(0.17_0.01_240)] border border-border text-[oklch(0.65_0.01_240)]">
					{category}
				</span>
			</div>
		);
	},
};

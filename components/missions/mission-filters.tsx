"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type MissionStatus =
	| "pending"
	| "executing"
	| "awaiting_checkpoint"
	| "completed"
	| "failed";

export type MissionPriority = "urgent" | "high" | "medium" | "low";

export interface MissionFilterState {
	statuses: MissionStatus[];
	priorities: MissionPriority[];
	showArchived: boolean;
}

interface MissionFiltersProps {
	filters: MissionFilterState;
	onFiltersChange: (filters: MissionFilterState) => void;
}

const STATUS_OPTIONS: { value: MissionStatus; label: string; color: string }[] =
	[
		{ value: "pending", label: "Pending", color: "bg-slate-400" },
		{ value: "executing", label: "Executing", color: "bg-amber-500" },
		{
			value: "awaiting_checkpoint",
			label: "Awaiting Checkpoint",
			color: "bg-blue-500",
		},
		{ value: "completed", label: "Completed", color: "bg-emerald-500" },
		{ value: "failed", label: "Failed", color: "bg-red-500" },
	];

const PRIORITY_OPTIONS: {
	value: MissionPriority;
	label: string;
	color: string;
}[] = [
	{ value: "urgent", label: "Urgent", color: "bg-red-500" },
	{ value: "high", label: "High", color: "bg-orange-500" },
	{ value: "medium", label: "Medium", color: "bg-yellow-500" },
	{ value: "low", label: "Low", color: "bg-slate-400" },
];

// Inline SVG replacing lucide-react Filter icon
function IconFilter({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
		</svg>
	);
}

// Inline SVG replacing lucide-react X icon
function IconX({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	);
}

interface CheckboxRowProps {
	id: string;
	checked: boolean;
	onChange: () => void;
	dotColor: string;
	label: string;
}

function CheckboxRow({
	id,
	checked,
	onChange,
	dotColor,
	label,
}: CheckboxRowProps) {
	return (
		<div className="flex items-center gap-2">
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={onChange}
				className="size-4 rounded border-border accent-primary cursor-pointer"
			/>
			<label
				htmlFor={id}
				className="flex items-center gap-2 text-sm font-normal cursor-pointer text-foreground"
			>
				<span className={cn("size-2 rounded-full", dotColor)} />
				{label}
			</label>
		</div>
	);
}

export function MissionFilters({
	filters,
	onFiltersChange,
}: MissionFiltersProps) {
	const [open, setOpen] = useState(false);

	const hasStatusFilter = filters.statuses.length > 0;
	const hasPriorityFilter = filters.priorities.length > 0;
	const activeFilterCount =
		filters.statuses.length +
		filters.priorities.length +
		(filters.showArchived ? 1 : 0);

	const getFilterLabel = () => {
		if (!hasStatusFilter && !hasPriorityFilter && !filters.showArchived) {
			return "All Active";
		}
		if (activeFilterCount === 1 && filters.showArchived) {
			return "Archived";
		}
		return `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""}`;
	};

	const toggleStatus = (status: MissionStatus) => {
		const newStatuses = filters.statuses.includes(status)
			? filters.statuses.filter((s) => s !== status)
			: [...filters.statuses, status];
		onFiltersChange({ ...filters, statuses: newStatuses });
	};

	const togglePriority = (priority: MissionPriority) => {
		const newPriorities = filters.priorities.includes(priority)
			? filters.priorities.filter((p) => p !== priority)
			: [...filters.priorities, priority];
		onFiltersChange({ ...filters, priorities: newPriorities });
	};

	const toggleShowArchived = () => {
		onFiltersChange({ ...filters, showArchived: !filters.showArchived });
	};

	const clearAll = () => {
		onFiltersChange({ statuses: [], priorities: [], showArchived: false });
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted min-h-[44px]"
			>
				<IconFilter className="size-4" />
				<span className="hidden sm:inline">{getFilterLabel()}</span>
				{activeFilterCount > 0 && (
					<span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
						{activeFilterCount}
					</span>
				)}
			</button>

			{open && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setOpen(false)}
						aria-hidden="true"
					/>

					{/* Popover panel */}
					<div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-card p-4 shadow-lg">
						<div className="space-y-4">
							{/* Header */}
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-medium text-foreground">Filters</h4>
								{activeFilterCount > 0 && (
									<button
										type="button"
										onClick={clearAll}
										className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
									>
										<IconX className="size-3" />
										Show All
									</button>
								)}
							</div>

							{/* Current state summary */}
							<div className="rounded bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
								{!hasStatusFilter && !hasPriorityFilter && !filters.showArchived
									? "Showing all active missions"
									: filters.showArchived &&
											!hasStatusFilter &&
											!hasPriorityFilter
										? "Showing archived missions only"
										: `Filtered: ${activeFilterCount} active`}
							</div>

							<hr className="border-border" />

							{/* Status */}
							<div className="space-y-3">
								<h5 className="text-sm font-medium text-muted-foreground">
									Status
								</h5>
								<div className="space-y-2">
									{STATUS_OPTIONS.map((option) => (
										<CheckboxRow
											key={option.value}
											id={`status-${option.value}`}
											checked={filters.statuses.includes(option.value)}
											onChange={() => toggleStatus(option.value)}
											dotColor={option.color}
											label={option.label}
										/>
									))}
								</div>
							</div>

							<hr className="border-border" />

							{/* Priority */}
							<div className="space-y-3">
								<h5 className="text-sm font-medium text-muted-foreground">
									Priority
								</h5>
								<div className="space-y-2">
									{PRIORITY_OPTIONS.map((option) => (
										<CheckboxRow
											key={option.value}
											id={`priority-${option.value}`}
											checked={filters.priorities.includes(option.value)}
											onChange={() => togglePriority(option.value)}
											dotColor={option.color}
											label={option.label}
										/>
									))}
								</div>
							</div>

							<hr className="border-border" />

							{/* Archived */}
							<div className="space-y-3">
								<h5 className="text-sm font-medium text-muted-foreground">
									Archived
								</h5>
								<CheckboxRow
									id="show-archived"
									checked={filters.showArchived}
									onChange={toggleShowArchived}
									dotColor="bg-slate-500"
									label="Show Archived"
								/>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

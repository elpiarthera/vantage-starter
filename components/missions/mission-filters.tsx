/**
 * Status filter section adapted onto the ported mcpcn `tag-select` block
 * (components/ui/tag-select.tsx) — see the block's own file header for the
 * upstream MIT attribution. Previously a hand-rolled list of
 * `<input type="checkbox">` rows (`CheckboxRow`); `TagSelect` already does
 * exactly this job (multi-select toggle chips + a "clear all" action), so
 * the checkboxes are replaced rather than duplicated alongside it.
 */
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
	TagSelect,
	TagSelectActions,
	TagSelectContent,
	TagSelectItem,
	TagSelectTags,
	useTagSelect,
} from "@/components/ui/tag-select";
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

const STATUS_OPTIONS: { value: MissionStatus; color: string }[] = [
	{ value: "pending", color: "bg-muted-foreground" },
	{ value: "executing", color: "bg-warning" },
	{ value: "awaiting_checkpoint", color: "bg-primary" },
	{ value: "completed", color: "bg-success" },
	{ value: "failed", color: "bg-destructive" },
];

const PRIORITY_OPTIONS: { value: MissionPriority; color: string }[] = [
	{ value: "urgent", color: "bg-destructive" },
	{ value: "high", color: "bg-warning" },
	{ value: "medium", color: "bg-warning" },
	{ value: "low", color: "bg-muted-foreground" },
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

// `TagSelect` is uncontrolled internally (its `selected` state is seeded
// from `control.selectedTagIds` once, then only mutated by its own
// toggle/clear) — it exposes no onChange prop, only `onValidate` on an
// explicit submit. This mission filter panel has no submit step: every
// toggle must apply immediately. `useTagSelect()` is the block's own
// exported escape hatch for exactly this — a headless child reads the live
// `selected` array from context and forwards it up. The content-equality
// guard (rather than forwarding on every reference change) is required:
// `control.selectedTagIds` and the forwarded `selected` array bounce new
// array references back and forth every render, and forwarding on
// reference alone loops forever; forwarding only on content change
// converges within one round trip.
function StatusTagSync({
	current,
	onChange,
}: {
	current: MissionStatus[];
	onChange: (statuses: MissionStatus[]) => void;
}) {
	const { selected } = useTagSelect();

	useEffect(() => {
		const same =
			selected.length === current.length &&
			selected.every((id) => current.includes(id as MissionStatus));
		if (!same) {
			onChange(selected as MissionStatus[]);
		}
	}, [selected, current, onChange]);

	return null;
}

function StatusTagItem({
	value,
	color,
	label,
}: {
	value: MissionStatus;
	color: string;
	label: string;
}) {
	const { isSelected } = useTagSelect();
	const selected = isSelected(value);

	return (
		<TagSelectItem
			aria-pressed={selected}
			tag={{ id: value, label }}
			tagId={value}
		>
			<span className={cn("size-2 rounded-full", color)} aria-hidden="true" />
			{label}
		</TagSelectItem>
	);
}

// Routes through the block's OWN `clear()` context action rather than
// writing `onFiltersChange({ statuses: [] })` directly: a second write path
// bypassing `TagSelect`'s internal state raced against `StatusTagSync`'s
// forwarding effect (the effect reads `selected` from the SAME render pass
// the external reset was requested in, before `TagSelect`'s own
// control-prop effect had applied it — the two updates fought each other on
// every subsequent commit, an infinite loop caught by the mutation-proof
// step below). Calling context `clear()` keeps every mutation on the single
// path `TagSelect` internal state -> StatusTagSync -> onFiltersChange.
function StatusClearButton({ label }: { label: string }) {
	const { clear, selected } = useTagSelect();

	if (selected.length === 0) {
		return null;
	}

	return (
		<button
			className="inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
			onClick={clear}
			type="button"
		>
			<IconX className="size-3" />
			{label}
		</button>
	);
}

export function MissionFilters({
	filters,
	onFiltersChange,
}: MissionFiltersProps) {
	const t = useTranslations("missions.filters");
	const [open, setOpen] = useState(false);

	const hasStatusFilter = filters.statuses.length > 0;
	const hasPriorityFilter = filters.priorities.length > 0;
	const activeFilterCount =
		filters.statuses.length +
		filters.priorities.length +
		(filters.showArchived ? 1 : 0);

	const getFilterLabel = () => {
		if (!hasStatusFilter && !hasPriorityFilter && !filters.showArchived) {
			return t("all_active");
		}
		if (activeFilterCount === 1 && filters.showArchived) {
			return t("archived");
		}
		return t("filtered_count", {
			count: activeFilterCount,
			plural: activeFilterCount > 1 ? "s" : "",
		});
	};

	const setStatuses = (statuses: MissionStatus[]) => {
		onFiltersChange({ ...filters, statuses });
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
				className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted min-h-[44px]"
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
					<div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-3 shadow-lg">
						<div className="space-y-4">
							{/* Header */}
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-medium text-foreground">
									{t("label")}
								</h4>
								{activeFilterCount > 0 && (
									<button
										type="button"
										onClick={clearAll}
										className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
									>
										<IconX className="size-3" />
										{t("show_all")}
									</button>
								)}
							</div>

							{/* Current state summary */}
							<div className="rounded bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
								{!hasStatusFilter && !hasPriorityFilter && !filters.showArchived
									? t("showing_all_active")
									: filters.showArchived &&
											!hasStatusFilter &&
											!hasPriorityFilter
										? t("showing_archived_only")
										: t("filtered_active", { count: activeFilterCount })}
							</div>

							<hr className="border-border" />

							{/* Status */}
							<div className="space-y-3">
								<h5 className="text-sm font-medium text-muted-foreground">
									{t("status")}
								</h5>
								<TagSelect
									appearance={{ mode: "multiple", showValidate: false }}
									control={{ selectedTagIds: filters.statuses }}
									data={{
										tags: STATUS_OPTIONS.map((option) => ({
											id: option.value,
											label: t(`status_${option.value}`),
										})),
									}}
									className="w-full rounded-none bg-transparent p-0"
								>
									<StatusTagSync
										current={filters.statuses}
										onChange={setStatuses}
									/>
									<TagSelectContent>
										<TagSelectTags className="gap-1.5">
											{STATUS_OPTIONS.map((option) => (
												<StatusTagItem
													key={option.value}
													value={option.value}
													color={option.color}
													label={t(`status_${option.value}`)}
												/>
											))}
										</TagSelectTags>
										<TagSelectActions>
											<StatusClearButton label={t("clear_status_selection")} />
										</TagSelectActions>
									</TagSelectContent>
								</TagSelect>
							</div>

							<hr className="border-border" />

							{/* Priority */}
							<div className="space-y-3">
								<h5 className="text-sm font-medium text-muted-foreground">
									{t("priority")}
								</h5>
								<div className="space-y-2">
									{PRIORITY_OPTIONS.map((option) => (
										<CheckboxRow
											key={option.value}
											id={`priority-${option.value}`}
											checked={filters.priorities.includes(option.value)}
											onChange={() => togglePriority(option.value)}
											dotColor={option.color}
											label={t(`priority_${option.value}`)}
										/>
									))}
								</div>
							</div>

							<hr className="border-border" />

							{/* Archived */}
							<div className="space-y-3">
								<h5 className="text-sm font-medium text-muted-foreground">
									{t("archived")}
								</h5>
								<CheckboxRow
									id="show-archived"
									checked={filters.showArchived}
									onChange={toggleShowArchived}
									dotColor="bg-muted-foreground"
									label={t("show_archived")}
								/>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

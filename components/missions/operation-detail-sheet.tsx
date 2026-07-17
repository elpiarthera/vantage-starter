"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

type OperationStatus =
	| "pending"
	| "blocked"
	| "in_progress"
	| "awaiting_review"
	| "completed"
	| "failed";

interface OperationDetailSheetProps {
	operation: Doc<"operations">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDelete: () => void;
}

const STATUS_DOT: Record<OperationStatus, string> = {
	pending: "bg-muted-foreground",
	blocked: "bg-destructive",
	in_progress: "bg-primary",
	awaiting_review: "bg-warning",
	completed: "bg-success",
	failed: "bg-destructive",
};

// Valid status transitions
const NEXT_STATUSES: Partial<Record<OperationStatus, OperationStatus[]>> = {
	pending: ["in_progress", "blocked"],
	blocked: ["pending", "in_progress"],
	in_progress: ["awaiting_review", "completed", "failed"],
	awaiting_review: ["completed", "failed", "in_progress"],
};

export function OperationDetailSheet({
	operation,
	open,
	onOpenChange,
	onDelete,
}: OperationDetailSheetProps) {
	const t = useTranslations("missions.operation_detail_sheet");
	const tStatus = useTranslations("missions.detail");
	const updateStatus = useMutation(api.operations.updateStatus);

	// Close on Escape
	useEffect(() => {
		if (!open) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onOpenChange(false);
			}
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [open, onOpenChange]);

	if (!open) return null;

	const status = operation.status as OperationStatus;
	const dotClass = STATUS_DOT[status] ?? "bg-[var(--muted-foreground)]";
	const nextStatuses = NEXT_STATUSES[status] ?? [];

	const handleStatusChange = async (next: OperationStatus) => {
		try {
			await updateStatus({ id: operation._id, status: next });
			toast.success(
				t("toast_status_updated", { status: tStatus(`status_${next}`) }),
			);
		} catch (error) {
			toast.error(t("toast_status_error"));
			console.error(error);
		}
	};

	const formatDate = (ts: number | undefined) => {
		if (!ts) return null;
		return new Date(ts).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
				onClick={() => onOpenChange(false)}
				aria-hidden="true"
			/>

			{/* Sheet */}
			<aside
				className="fixed right-0 inset-y-0 z-50 w-full max-w-[400px] bg-[var(--card)] border-l border-[var(--border)] shadow-lg flex flex-col"
				aria-label={t("aria_label")}
			>
				{/* Header */}
				<div className="flex items-start justify-between p-5 border-b border-[var(--border)] shrink-0">
					<div className="flex items-center gap-2 min-w-0">
						<span
							className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotClass}`}
							aria-hidden="true"
						/>
						<h2 className="text-base font-semibold text-[var(--foreground)] truncate">
							{operation.name}
						</h2>
					</div>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="ml-3 shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
						aria-label={t("close_aria")}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
						>
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				</div>

				{/* Body — scrollable */}
				<div className="flex-1 overflow-y-auto p-5 space-y-6">
					{/* Status + Type row */}
					<div className="flex items-center gap-3 flex-wrap">
						<span className="text-xs capitalize px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted-foreground)]">
							{tStatus(`status_${status}`)}
						</span>
						<span className="text-xs capitalize px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted-foreground)]">
							{operation.type === "ai" ? t("type_ai") : t("type_human")}
						</span>
						{operation.priority && operation.priority !== "medium" && (
							<span className="text-xs capitalize px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted-foreground)]">
								{operation.priority}
							</span>
						)}
					</div>

					{/* Description */}
					{operation.description ? (
						<div>
							<p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
								{t("description_label")}
							</p>
							<p className="text-sm text-[var(--foreground)] leading-relaxed">
								{operation.description}
							</p>
						</div>
					) : (
						<p className="text-sm text-[var(--muted-foreground)] italic">
							{t("no_description")}
						</p>
					)}

					{/* Progress bar — only for in_progress */}
					{status === "in_progress" && (
						<div>
							<p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
								{t("progress_label")}
							</p>
							<div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
								<div
									className="h-full rounded-full bg-[var(--primary)] transition-all"
									style={{ width: "40%" }}
									role="progressbar"
									aria-valuenow={40}
									aria-valuemin={0}
									aria-valuemax={100}
								/>
							</div>
							<p className="text-xs text-[var(--muted-foreground)] mt-1">
								{t("in_progress")}
							</p>
						</div>
					)}

					{/* Status transitions */}
					{nextStatuses.length > 0 && (
						<div>
							<p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
								{t("move_to")}
							</p>
							<div className="flex flex-wrap gap-2">
								{nextStatuses.map((next) => (
									<button
										key={next}
										type="button"
										onClick={() => void handleStatusChange(next)}
										className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
									>
										{tStatus(`status_${next}`)}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Timestamps */}
					<div className="space-y-2">
						<p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
							{t("timeline")}
						</p>
						<dl className="space-y-1.5">
							<div className="flex justify-between text-sm">
								<dt className="text-[var(--muted-foreground)]">
									{t("created")}
								</dt>
								<dd className="text-[var(--foreground)]">
									{formatDate(operation.createdAt) ?? "—"}
								</dd>
							</div>
							{operation.startedAt ? (
								<div className="flex justify-between text-sm">
									<dt className="text-[var(--muted-foreground)]">
										{t("started")}
									</dt>
									<dd className="text-[var(--foreground)]">
										{formatDate(operation.startedAt)}
									</dd>
								</div>
							) : null}
							{operation.completedAt ? (
								<div className="flex justify-between text-sm">
									<dt className="text-[var(--muted-foreground)]">
										{t("completed")}
									</dt>
									<dd className="text-[var(--foreground)]">
										{formatDate(operation.completedAt)}
									</dd>
								</div>
							) : null}
							<div className="flex justify-between text-sm">
								<dt className="text-[var(--muted-foreground)]">
									{t("updated")}
								</dt>
								<dd className="text-[var(--foreground)]">
									{formatDate(operation.updatedAt) ?? "—"}
								</dd>
							</div>
						</dl>
					</div>

					{/* Output */}
					{operation.output ? (
						<div>
							<p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
								{t("output")}
							</p>
							<pre className="text-xs text-[var(--foreground)] bg-[var(--muted)] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
								{operation.output}
							</pre>
						</div>
					) : null}

					{/* Error */}
					{operation.error ? (
						<div>
							<p className="text-xs font-medium text-destructive uppercase tracking-wide mb-2">
								{t("error")}
							</p>
							<pre className="text-xs text-destructive bg-destructive/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words border border-destructive/20">
								{operation.error}
							</pre>
						</div>
					) : null}
				</div>

				{/* Footer — delete */}
				<div className="shrink-0 border-t border-[var(--border)] p-4">
					<button
						type="button"
						onClick={() => {
							onOpenChange(false);
							onDelete();
						}}
						className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
					>
						{/* trash icon */}
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M3 6h18" />
							<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
							<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
						</svg>
						{t("delete")}
					</button>
				</div>
			</aside>
		</>
	);
}

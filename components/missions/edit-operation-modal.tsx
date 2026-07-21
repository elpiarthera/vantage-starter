"use client";

/**
 * EditOperationModal — corrects an operation after creation: title,
 * description, duration (estimatedMinutes), and dependencies.
 *
 * Reused from CreateOperationModal (components/missions/create-operation-modal.tsx)
 * for the modal shell/input classes, and from OperationDetailSheet
 * (components/missions/operation-detail-sheet.tsx) for status-dot styling
 * conventions. Dependency edits are validated server-side by
 * convex/operations.ts::update (self-dependency + cross-mission +
 * circular-chain guards) — this component only prevents the operation from
 * offering itself as a dependency option.
 */

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

interface EditOperationModalProps {
	operation: Doc<"operations">;
	siblingOperations: Doc<"operations">[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EditOperationModal({
	operation,
	siblingOperations,
	open,
	onOpenChange,
}: EditOperationModalProps) {
	const t = useTranslations("missions.edit_operation_modal");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [name, setName] = useState(operation.name);
	const [description, setDescription] = useState(operation.description ?? "");
	const [estimatedMinutes, setEstimatedMinutes] = useState(
		operation.estimatedMinutes?.toString() ?? "",
	);
	const [dependsOn, setDependsOn] = useState<Id<"operations">[]>(
		operation.dependsOn ?? [],
	);

	const updateOperation = useMutation(api.operations.update);

	useEffect(() => {
		if (!open) return;
		setName(operation.name);
		setDescription(operation.description ?? "");
		setEstimatedMinutes(operation.estimatedMinutes?.toString() ?? "");
		setDependsOn(operation.dependsOn ?? []);
	}, [open, operation]);

	const handleClose = () => {
		onOpenChange(false);
	};

	const toggleDependency = (id: Id<"operations">) => {
		setDependsOn((prev) =>
			prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
		);
	};

	const handleSubmit = async () => {
		if (!name.trim()) {
			toast.error(t("toast_name_required"));
			return;
		}

		const parsedMinutes = estimatedMinutes.trim()
			? Number(estimatedMinutes)
			: undefined;
		if (parsedMinutes !== undefined && Number.isNaN(parsedMinutes)) {
			toast.error(t("toast_invalid_duration"));
			return;
		}

		setIsSubmitting(true);
		try {
			await updateOperation({
				operationId: operation._id,
				name: name.trim(),
				description: description.trim() || undefined,
				estimatedMinutes: parsedMinutes,
				dependsOn,
			});
			toast.success(t("toast_success"));
			handleClose();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t("toast_error"));
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && e.metaKey) {
			void handleSubmit();
		}
		if (e.key === "Escape") {
			handleClose();
		}
	};

	const inputClass =
		"w-full h-12 bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors";
	const labelClass =
		"block text-sm font-medium text-[var(--foreground)] mb-1.5";

	if (!open) return null;

	const eligibleDependencies = siblingOperations.filter(
		(op) => op._id !== operation._id,
	);

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center p-4"
			aria-modal="true"
			role="dialog"
			aria-labelledby="edit-operation-title"
			onKeyDown={handleKeyDown}
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-background/80 backdrop-blur-sm"
				onClick={handleClose}
				aria-hidden="true"
			/>

			{/* Card */}
			<div className="relative z-10 mt-[10vh] w-full max-w-lg max-h-[80vh] overflow-y-auto bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg">
				<div className="p-6">
					{/* Header */}
					<div className="flex items-start justify-between mb-6">
						<div>
							<h2
								id="edit-operation-title"
								className="text-lg font-semibold text-[var(--foreground)]"
							>
								{t("title")}
							</h2>
							<p className="text-sm text-[var(--muted-foreground)] mt-0.5">
								{t("subtitle")}
							</p>
						</div>
						<button
							type="button"
							onClick={handleClose}
							className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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

					{/* Form */}
					<div className="grid gap-4">
						{/* Name */}
						<div>
							<label htmlFor="edit-operation-name" className={labelClass}>
								{t("name_label")}{" "}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>
							</label>
							<input
								id="edit-operation-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("name_placeholder")}
								className={inputClass}
								aria-required="true"
								// biome-ignore lint/a11y/noAutofocus: modal autofocus is intentional UX
								autoFocus
							/>
						</div>

						{/* Description */}
						<div>
							<label
								htmlFor="edit-operation-description"
								className={labelClass}
							>
								{t("description_label")}
							</label>
							<textarea
								id="edit-operation-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t("description_placeholder")}
								rows={3}
								className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors resize-none"
							/>
						</div>

						{/* Duration */}
						<div>
							<label htmlFor="edit-operation-duration" className={labelClass}>
								{t("duration_label")}
							</label>
							<input
								id="edit-operation-duration"
								type="number"
								min={0}
								inputMode="numeric"
								value={estimatedMinutes}
								onChange={(e) => setEstimatedMinutes(e.target.value)}
								placeholder={t("duration_placeholder")}
								className={inputClass}
							/>
						</div>

						{/* Dependencies */}
						{eligibleDependencies.length > 0 && (
							<div>
								<span className={labelClass}>{t("dependencies_label")}</span>
								<div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] max-h-40 overflow-y-auto">
									{eligibleDependencies.map((op) => (
										<label
											key={op._id}
											htmlFor={`dep-${op._id}`}
											className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--accent)] transition-colors"
										>
											<input
												id={`dep-${op._id}`}
												type="checkbox"
												checked={dependsOn.includes(op._id)}
												onChange={() => toggleDependency(op._id)}
												className="size-4 rounded border-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
											/>
											<span className="truncate">{op.name}</span>
										</label>
									))}
								</div>
								<p className="text-xs text-[var(--muted-foreground)] mt-1">
									{t("dependencies_hint")}
								</p>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
						<button
							type="button"
							onClick={handleClose}
							disabled={isSubmitting}
							className="flex-1 sm:flex-none px-6 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50"
						>
							{t("cancel")}
						</button>
						<button
							type="button"
							onClick={() => void handleSubmit()}
							disabled={isSubmitting || !name.trim()}
							className="flex-1 px-6 py-2.5 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
						>
							{isSubmitting ? t("saving") : t("save")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

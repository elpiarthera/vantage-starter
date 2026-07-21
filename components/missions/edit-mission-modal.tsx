"use client";

/**
 * EditMissionModal — corrects a mission after creation.
 *
 * Reused from CreateMissionModal (components/missions/create-mission-modal.tsx):
 * same modal shell, input/label classes, keyboard shortcuts, and error
 * handling. Scoped to the fields a typo actually hits (title, description,
 * objective, success criteria) rather than the full creation form — status,
 * priority, intent, and dates already have dedicated controls elsewhere.
 */

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

interface EditMissionModalProps {
	mission: Doc<"missions">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EditMissionModal({
	mission,
	open,
	onOpenChange,
}: EditMissionModalProps) {
	const t = useTranslations("missions.edit_modal");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [name, setName] = useState(mission.name);
	const [description, setDescription] = useState(mission.description ?? "");
	const [objective, setObjective] = useState(mission.objective ?? "");
	const [successCriteriaText, setSuccessCriteriaText] = useState(
		(mission.successCriteria ?? []).join("\n"),
	);

	const updateMission = useMutation(api.missions.update);

	// Re-sync local state whenever a different mission is opened for edit.
	useEffect(() => {
		if (!open) return;
		setName(mission.name);
		setDescription(mission.description ?? "");
		setObjective(mission.objective ?? "");
		setSuccessCriteriaText((mission.successCriteria ?? []).join("\n"));
	}, [open, mission]);

	const handleClose = () => {
		onOpenChange(false);
	};

	const handleSubmit = async () => {
		if (!name.trim()) {
			toast.error(t("toast_name_required"));
			return;
		}

		const successCriteria = successCriteriaText
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		setIsSubmitting(true);
		try {
			await updateMission({
				id: mission._id,
				name: name.trim(),
				description: description.trim() || undefined,
				objective: objective.trim() || undefined,
				successCriteria,
			});
			toast.success(t("toast_success"));
			handleClose();
		} catch (error) {
			toast.error(t("toast_error"));
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

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			aria-modal="true"
			role="dialog"
			aria-labelledby="edit-mission-title"
			onKeyDown={handleKeyDown}
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-background/80 backdrop-blur-sm"
				onClick={handleClose}
				aria-hidden="true"
			/>

			{/* Card */}
			<div className="relative z-10 w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg">
				<div className="p-6">
					{/* Header */}
					<div className="flex items-start justify-between mb-6">
						<div>
							<h2
								id="edit-mission-title"
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
							<label htmlFor="edit-mission-name" className={labelClass}>
								{t("name_label")}{" "}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>
							</label>
							<input
								id="edit-mission-name"
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

						{/* Objective */}
						<div>
							<label htmlFor="edit-mission-objective" className={labelClass}>
								{t("objective_label")}
							</label>
							<textarea
								id="edit-mission-objective"
								value={objective}
								onChange={(e) => setObjective(e.target.value)}
								placeholder={t("objective_placeholder")}
								rows={2}
								className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors resize-none"
							/>
						</div>

						{/* Description */}
						<div>
							<label htmlFor="edit-mission-description" className={labelClass}>
								{t("description_label")}
							</label>
							<textarea
								id="edit-mission-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t("description_placeholder")}
								rows={2}
								className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors resize-none"
							/>
						</div>

						{/* Success criteria — one per line */}
						<div>
							<label
								htmlFor="edit-mission-success-criteria"
								className={labelClass}
							>
								{t("success_criteria_label")}
							</label>
							<textarea
								id="edit-mission-success-criteria"
								value={successCriteriaText}
								onChange={(e) => setSuccessCriteriaText(e.target.value)}
								placeholder={t("success_criteria_placeholder")}
								rows={3}
								className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors resize-none"
							/>
							<p className="text-xs text-[var(--muted-foreground)] mt-1">
								{t("success_criteria_hint")}
							</p>
						</div>
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

					{/* Keyboard hint */}
					<p className="text-[10px] text-center text-[var(--muted-foreground)] mt-3">
						{t("keyboard_press")}{" "}
						<kbd className="px-1 py-0.5 rounded bg-[var(--muted)] text-[10px]">
							⌘
						</kbd>
						<kbd className="px-1 py-0.5 rounded bg-[var(--muted)] text-[10px] ml-0.5">
							{t("keyboard_enter")}
						</kbd>{" "}
						{t("keyboard_to_save")}
					</p>
				</div>
			</div>
		</div>
	);
}

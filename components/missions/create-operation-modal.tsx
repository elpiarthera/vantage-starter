"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type OperationType = "ai" | "human";
type OperationPriority = "urgent" | "high" | "medium" | "low";

const PRIORITY_VALUES: OperationPriority[] = [
	"low",
	"medium",
	"high",
	"urgent",
];

interface CreateOperationModalProps {
	missionId: Id<"missions">;
}

export function CreateOperationModal({ missionId }: CreateOperationModalProps) {
	const t = useTranslations("missions.create_operation_modal");
	const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState<OperationType>("ai");
	const [priority, setPriority] = useState<OperationPriority>("medium");

	const workspaces = useQuery(api.workspaces.list);
	const workspaceId = workspaces?.[0]?._id;
	const createOperation = useMutation(api.operations.create);

	const resetForm = () => {
		setName("");
		setDescription("");
		setType("ai");
		setPriority("medium");
	};

	const handleClose = () => {
		setOpen(false);
		resetForm();
	};

	const handleSubmit = async () => {
		if (!name.trim()) {
			toast.error(t("toast_name_required"));
			return;
		}
		if (!workspaceId) {
			toast.error(t("toast_no_workspace"));
			return;
		}

		setIsSubmitting(true);
		try {
			await createOperation({
				missionId,
				workspaceId,
				name: name.trim(),
				description: description.trim() || undefined,
				type,
				priority,
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
	const selectClass =
		"w-full h-12 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors cursor-pointer";
	const labelClass =
		"block text-sm font-medium text-[var(--foreground)] mb-1.5";

	return (
		<>
			{/* Trigger */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-2 text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
			>
				{/* plus icon */}
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
					<path d="M5 12h14" />
					<path d="M12 5v14" />
				</svg>
				<span>{t("trigger")}</span>
			</button>

			{/* Modal */}
			{open && (
				<div
					className="fixed inset-0 z-50 flex items-start justify-center p-4"
					aria-modal="true"
					role="dialog"
					aria-labelledby="create-operation-title"
					onKeyDown={handleKeyDown}
				>
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-background/80 backdrop-blur-sm"
						onClick={handleClose}
						aria-hidden="true"
					/>

					{/* Card */}
					<div className="relative z-10 mt-[20vh] w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg">
						<div className="p-6">
							{/* Header */}
							<div className="flex items-start justify-between mb-6">
								<div>
									<h2
										id="create-operation-title"
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
									<label htmlFor="operation-name" className={labelClass}>
										{t("name_label")}{" "}
										<span className="text-destructive" aria-hidden="true">
											*
										</span>
									</label>
									<input
										id="operation-name"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder={t("name_placeholder")}
										className={inputClass}
										// biome-ignore lint/a11y/noAutofocus: modal autofocus is intentional UX
										autoFocus
										aria-required="true"
									/>
								</div>

								{/* Description */}
								<div>
									<label htmlFor="operation-description" className={labelClass}>
										{t("description_label")}
									</label>
									<textarea
										id="operation-description"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder={t("description_placeholder")}
										rows={3}
										className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors resize-none"
									/>
								</div>

								{/* Type & Priority — 2 cols */}
								<div className="grid sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="operation-type" className={labelClass}>
											{t("type_label")}
										</label>
										<select
											id="operation-type"
											value={type}
											onChange={(e) => setType(e.target.value as OperationType)}
											className={selectClass}
										>
											<option value="ai">{t("type_ai")}</option>
											<option value="human">{t("type_human")}</option>
										</select>
									</div>
									<div>
										<label htmlFor="operation-priority" className={labelClass}>
											{t("priority_label")}
										</label>
										<select
											id="operation-priority"
											value={priority}
											onChange={(e) =>
												setPriority(e.target.value as OperationPriority)
											}
											className={selectClass}
										>
											{PRIORITY_VALUES.map((value) => (
												<option key={value} value={value}>
													{t(`priority_${value}`)}
												</option>
											))}
										</select>
									</div>
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
									{isSubmitting ? t("creating") : t("create")}
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
								{t("keyboard_to_create")}
							</p>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

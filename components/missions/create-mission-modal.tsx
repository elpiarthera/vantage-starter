"use client";

/**
 * CreateMissionModal — Ported from vantage-studio
 * Adapted for vantage-starter:
 * - lucide-react → inline SVGs
 * - shadcn Dialog/Button/Input/Select → native HTML with OKLCH tokens
 * - Status enum: pending|executing|awaiting_checkpoint|completed|failed
 * - workspaceId resolved via api.workspaces.list (first workspace)
 * - Keyboard shortcut ⌘+Enter to submit
 */

import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
	cloneElement,
	isValidElement,
	type ReactElement,
	useState,
} from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

// Status options — vantage-starter 5-stage pipeline
const STATUS_OPTIONS = [
	{ value: "pending", label: "Pending" },
	{ value: "executing", label: "Executing" },
	{ value: "awaiting_checkpoint", label: "Awaiting Checkpoint" },
	{ value: "completed", label: "Completed" },
	{ value: "failed", label: "Failed" },
] as const;

type MissionStatus = (typeof STATUS_OPTIONS)[number]["value"];

const PRIORITY_OPTIONS = [
	{ value: "urgent", label: "Urgent" },
	{ value: "high", label: "High" },
	{ value: "medium", label: "Medium" },
	{ value: "low", label: "Low" },
] as const;

type MissionPriority = (typeof PRIORITY_OPTIONS)[number]["value"];

const INTENT_OPTIONS = [
	{
		value: "delivery",
		label: "Delivery",
		description: "Ship a feature or product",
	},
	{
		value: "experiment",
		label: "Experiment",
		description: "Test a hypothesis",
	},
	{ value: "internal", label: "Internal", description: "Improve processes" },
] as const;

type MissionIntent = (typeof INTENT_OPTIONS)[number]["value"];

interface CreateMissionModalProps {
	trigger?: React.ReactNode;
	defaultStatus?: MissionStatus;
	onSuccess?: () => void;
}

export function CreateMissionModal({
	trigger,
	defaultStatus = "pending",
	onSuccess,
}: CreateMissionModalProps) {
	const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [name, setName] = useState("");
	const [brief, setBrief] = useState("");
	const [description, setDescription] = useState("");
	const [status, setStatus] = useState<MissionStatus>(defaultStatus);
	const [priority, setPriority] = useState<MissionPriority>("medium");
	const [intent, setIntent] = useState<MissionIntent>("delivery");
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showTargetPicker, setShowTargetPicker] = useState(false);

	const workspaces = useQuery(api.workspaces.list);
	const workspaceId = workspaces?.[0]?._id;
	const createMission = useMutation(api.missions.create);

	const resetForm = () => {
		setName("");
		setBrief("");
		setDescription("");
		setStatus(defaultStatus);
		setPriority("medium");
		setIntent("delivery");
		setStartDate(undefined);
		setTargetDate(undefined);
	};

	const handleClose = () => {
		setOpen(false);
		resetForm();
	};

	const handleSubmit = async () => {
		if (!name.trim()) {
			toast.error("Mission name is required");
			return;
		}
		if (!workspaceId) {
			toast.error("No workspace found");
			return;
		}

		setIsSubmitting(true);
		try {
			await createMission({
				workspaceId,
				name: name.trim(),
				brief: brief.trim() || undefined,
				description: description.trim() || undefined,
				status,
				priority,
				intent,
				startDate: startDate ? startDate.getTime() : undefined,
				targetDate: targetDate ? targetDate.getTime() : undefined,
			});

			toast.success("Mission created successfully");
			handleClose();
			onSuccess?.();
		} catch (error) {
			toast.error("Failed to create mission");
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && e.metaKey) {
			handleSubmit();
		}
		if (e.key === "Escape") {
			handleClose();
		}
	};

	// Shared input class — 48px height, text-base prevents iOS zoom
	const inputClass =
		"w-full h-12 bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors";
	const selectClass =
		"w-full h-12 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors cursor-pointer";
	const labelClass =
		"block text-sm font-medium text-[var(--foreground)] mb-1.5";

	// Default trigger button (used when no custom trigger is provided)
	const defaultTrigger = (
		<button
			type="button"
			onClick={() => setOpen(true)}
			className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-2 text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
		>
			{/* Rocket icon */}
			<svg
				width="14"
				height="14"
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
			<span>New Mission</span>
		</button>
	);

	return (
		<>
			{/* Trigger — inject onClick into custom trigger via cloneElement, or use default */}
			{trigger && isValidElement(trigger)
				? cloneElement(trigger as ReactElement<{ onClick?: () => void }>, {
						onClick: () => setOpen(true),
					})
				: defaultTrigger}

			{/* Modal backdrop + dialog */}
			{open && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					aria-modal="true"
					role="dialog"
					aria-labelledby="create-mission-title"
				>
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={handleClose}
						aria-hidden="true"
					/>

					{/* Card */}
					<div
						className="relative z-10 w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl"
						onKeyDown={handleKeyDown}
					>
						<div className="p-6">
							{/* Header */}
							<div className="flex items-start justify-between mb-6">
								<div>
									<h2
										id="create-mission-title"
										className="text-lg font-semibold text-[var(--foreground)]"
									>
										Create New Mission
									</h2>
									<p className="text-sm text-[var(--muted-foreground)] mt-0.5">
										Missions are goal-driven containers for AI-powered work.
									</p>
								</div>
								<button
									type="button"
									onClick={handleClose}
									className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
									aria-label="Close"
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
									<label htmlFor="mission-name" className={labelClass}>
										Name{" "}
										<span className="text-red-500" aria-hidden="true">
											*
										</span>
									</label>
									<input
										id="mission-name"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Enter mission name..."
										className={inputClass}
										aria-required="true"
									/>
								</div>

								{/* Brief */}
								<div>
									<div className="flex items-center gap-2 mb-1.5">
										<label
											htmlFor="mission-brief"
											className="text-sm font-medium text-[var(--foreground)]"
										>
											Brief
										</label>
										<span className="text-xs text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
											AI Context
										</span>
									</div>
									<textarea
										id="mission-brief"
										value={brief}
										onChange={(e) => setBrief(e.target.value)}
										placeholder="Describe the goal, constraints, and success criteria. This context is shared with all assigned AI agents."
										rows={3}
										className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors resize-none"
									/>
									<p className="flex items-start gap-1.5 text-xs text-[var(--muted-foreground)] mt-1">
										{/* Lightbulb icon */}
										<svg
											width="12"
											height="12"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											className="mt-0.5 text-amber-500 shrink-0"
											aria-hidden="true"
										>
											<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
											<path d="M9 18h6" />
											<path d="M10 22h4" />
										</svg>
										The brief provides shared context for all AI agents working
										on this mission.
									</p>
								</div>

								{/* Description */}
								<div>
									<label htmlFor="mission-description" className={labelClass}>
										Description
									</label>
									<textarea
										id="mission-description"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Additional details for human collaborators..."
										rows={2}
										className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors resize-none"
									/>
								</div>

								{/* Status & Priority — 2 cols on sm+ */}
								<div className="grid sm:grid-cols-2 gap-4">
									<div>
										<label htmlFor="mission-status" className={labelClass}>
											Status
										</label>
										<select
											id="mission-status"
											value={status}
											onChange={(e) =>
												setStatus(e.target.value as MissionStatus)
											}
											className={selectClass}
										>
											{STATUS_OPTIONS.map((opt) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
											))}
										</select>
									</div>
									<div>
										<label htmlFor="mission-priority" className={labelClass}>
											Priority
										</label>
										<select
											id="mission-priority"
											value={priority}
											onChange={(e) =>
												setPriority(e.target.value as MissionPriority)
											}
											className={selectClass}
										>
											{PRIORITY_OPTIONS.map((opt) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
											))}
										</select>
									</div>
								</div>

								{/* Intent */}
								<div>
									<label htmlFor="mission-intent" className={labelClass}>
										Intent
									</label>
									<select
										id="mission-intent"
										value={intent}
										onChange={(e) => setIntent(e.target.value as MissionIntent)}
										className={selectClass}
									>
										{INTENT_OPTIONS.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label} — {opt.description}
											</option>
										))}
									</select>
								</div>

								{/* Start Date & Target Date */}
								<div className="grid sm:grid-cols-2 gap-4">
									{/* Start Date */}
									<div>
										<label htmlFor="mission-start-date" className={labelClass}>
											Start Date
										</label>
										<div className="relative">
											<button
												type="button"
												id="mission-start-date"
												onClick={() => {
													setShowStartPicker(!showStartPicker);
													setShowTargetPicker(false);
												}}
												className={`${inputClass} flex items-center gap-2 text-left ${!startDate ? "text-[var(--muted-foreground)]" : ""}`}
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													aria-hidden="true"
												>
													<rect
														x="3"
														y="4"
														width="18"
														height="18"
														rx="2"
														ry="2"
													/>
													<line x1="16" y1="2" x2="16" y2="6" />
													<line x1="8" y1="2" x2="8" y2="6" />
													<line x1="3" y1="10" x2="21" y2="10" />
												</svg>
												{startDate ? format(startDate, "PPP") : "Pick a date"}
											</button>
											{showStartPicker && (
												<div className="absolute top-full left-0 z-20 mt-1">
													<input
														type="date"
														className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
														value={
															startDate ? format(startDate, "yyyy-MM-dd") : ""
														}
														onChange={(e) => {
															const val = e.target.value;
															setStartDate(val ? new Date(val) : undefined);
															setShowStartPicker(false);
														}}
													/>
												</div>
											)}
										</div>
									</div>

									{/* Target Date */}
									<div>
										<label htmlFor="mission-target-date" className={labelClass}>
											Target Date
										</label>
										<div className="relative">
											<button
												type="button"
												id="mission-target-date"
												onClick={() => {
													setShowTargetPicker(!showTargetPicker);
													setShowStartPicker(false);
												}}
												className={`${inputClass} flex items-center gap-2 text-left ${!targetDate ? "text-[var(--muted-foreground)]" : ""}`}
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													aria-hidden="true"
												>
													<rect
														x="3"
														y="4"
														width="18"
														height="18"
														rx="2"
														ry="2"
													/>
													<line x1="16" y1="2" x2="16" y2="6" />
													<line x1="8" y1="2" x2="8" y2="6" />
													<line x1="3" y1="10" x2="21" y2="10" />
												</svg>
												{targetDate ? format(targetDate, "PPP") : "Pick a date"}
											</button>
											{showTargetPicker && (
												<div className="absolute top-full left-0 z-20 mt-1">
													<input
														type="date"
														className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
														value={
															targetDate ? format(targetDate, "yyyy-MM-dd") : ""
														}
														onChange={(e) => {
															const val = e.target.value;
															setTargetDate(val ? new Date(val) : undefined);
															setShowTargetPicker(false);
														}}
													/>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* Footer */}
							<div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
								<button
									type="button"
									onClick={handleClose}
									disabled={isSubmitting}
									className="flex-1 sm:flex-none h-12 px-6 text-base rounded-lg border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSubmit}
									disabled={isSubmitting || !name.trim()}
									className="flex-1 h-12 px-6 text-base rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
								>
									{isSubmitting ? "Creating..." : "Create Mission"}
								</button>
							</div>

							{/* Keyboard hint */}
							<p className="text-[10px] text-center text-[var(--muted-foreground)] mt-3">
								Press{" "}
								<kbd className="px-1 py-0.5 rounded bg-[var(--muted)] text-[10px]">
									⌘
								</kbd>
								<kbd className="px-1 py-0.5 rounded bg-[var(--muted)] text-[10px] ml-0.5">
									Enter
								</kbd>{" "}
								to create
							</p>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

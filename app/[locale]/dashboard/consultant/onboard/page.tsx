"use client";

/**
 * Consultant Onboarding — Entry Page
 *
 * Multi-step flow:
 *   Step 1: Project creation form (name, client name, website URL, sector)
 *   Step 2: Competitor input (add up to 5 competitors with name + URL)
 *   Step 3: Auto-redirect to discovery chat
 *
 * Auth: Clerk (requires workspace)
 * Backend: convex/consultantProjects.ts (create, addCompetitor, updateStatus)
 */

import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

type Step = 1 | 2 | 3;

interface CompetitorRow {
	id: string;
	name: string;
	url: string;
	status: "idle" | "scraping" | "done" | "failed";
}

// ============================================================================
// SECTOR OPTIONS
// ============================================================================

const SECTORS = [
	"marketing",
	"sales",
	"engineering",
	"operations",
	"support",
	"analytics",
	"other",
] as const;

// ============================================================================
// STEP INDICATOR
// ============================================================================

function StepIndicator({ current }: { current: Step }) {
	const t = useTranslations("consultant");
	const steps: { label: string; step: Step }[] = [
		{ label: t("step1Title"), step: 1 },
		{ label: t("step2Title"), step: 2 },
		{ label: t("step3Title"), step: 3 },
	];

	return (
		<nav aria-label="Onboarding steps" className="flex items-center gap-0 mb-8">
			{steps.map((s, i) => (
				<div key={s.step} className="flex items-center gap-0">
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors duration-150",
								current === s.step
									? "border-[oklch(0.62_0.18_240)] bg-[oklch(0.62_0.18_240)] text-white"
									: current > s.step
										? "border-[oklch(0.62_0.18_240)] bg-[oklch(0.62_0.18_240)]/20 text-[oklch(0.62_0.18_240)]"
										: "border-border text-muted-foreground",
							)}
							aria-current={current === s.step ? "step" : undefined}
						>
							{current > s.step ? (
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
							) : (
								s.step
							)}
						</span>
						<span
							className={cn(
								"text-xs font-medium hidden sm:inline",
								current === s.step
									? "text-foreground"
									: "text-muted-foreground",
							)}
						>
							{s.label}
						</span>
					</div>
					{i < steps.length - 1 && (
						<div
							className={cn(
								"w-8 h-px mx-2 transition-colors duration-150",
								current > s.step ? "bg-[oklch(0.62_0.18_240)]" : "bg-border",
							)}
							aria-hidden="true"
						/>
					)}
				</div>
			))}
		</nav>
	);
}

// ============================================================================
// STEP 1 — PROJECT CREATION FORM
// ============================================================================

interface Step1Props {
	workspaceId: Id<"workspaces">;
	onCreated: (projectId: Id<"consultantProjects">, websiteUrl: string) => void;
}

function Step1ProjectForm({ workspaceId, onCreated }: Step1Props) {
	const t = useTranslations("consultant");
	const [name, setName] = useState("");
	const [clientName, setClientName] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [sector, setSector] = useState<string>("marketing");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createProject = useMutation(api.consultantProjects.create);
	const scrapeClient = useAction(api.actions.scrapeClient.run);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !clientName.trim() || !websiteUrl.trim()) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const url = websiteUrl.trim();
			const projectId = await createProject({
				workspaceId,
				name: name.trim(),
				clientName: clientName.trim(),
				clientWebsiteUrl: url,
				sector,
			});
			// Fire-and-forget: scrapes client site, sets status scraping → competitors
			scrapeClient({ projectId, url }).catch((err) => {
				console.error("[scrapeClient] failed:", err);
			});
			onCreated(projectId, url);
		} catch (err) {
			setError(err instanceof Error ? err.message : t("createProjectError"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const inputClass =
		"w-full h-10 px-3 bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors duration-150";

	return (
		<form onSubmit={handleSubmit} className="space-y-5" noValidate>
			{/* Project Name */}
			<div className="space-y-1.5">
				<label
					htmlFor="project-name"
					className="text-xs font-medium text-foreground"
				>
					{t("projectName")}
					<span className="text-[oklch(0.65_0.2_25)] ml-0.5" aria-hidden="true">
						*
					</span>
				</label>
				<input
					id="project-name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={t("projectNamePlaceholder")}
					required
					aria-required="true"
					className={inputClass}
				/>
			</div>

			{/* Client Name */}
			<div className="space-y-1.5">
				<label
					htmlFor="client-name"
					className="text-xs font-medium text-foreground"
				>
					{t("clientName")}
					<span className="text-[oklch(0.65_0.2_25)] ml-0.5" aria-hidden="true">
						*
					</span>
				</label>
				<input
					id="client-name"
					type="text"
					value={clientName}
					onChange={(e) => setClientName(e.target.value)}
					placeholder={t("clientNamePlaceholder")}
					required
					aria-required="true"
					className={inputClass}
				/>
			</div>

			{/* Website URL */}
			<div className="space-y-1.5">
				<label
					htmlFor="website-url"
					className="text-xs font-medium text-foreground"
				>
					{t("websiteUrl")}
					<span className="text-[oklch(0.65_0.2_25)] ml-0.5" aria-hidden="true">
						*
					</span>
				</label>
				<input
					id="website-url"
					type="url"
					value={websiteUrl}
					onChange={(e) => setWebsiteUrl(e.target.value)}
					placeholder={t("websiteUrlPlaceholder")}
					required
					aria-required="true"
					className={inputClass}
				/>
			</div>

			{/* Sector */}
			<div className="space-y-1.5">
				<label htmlFor="sector" className="text-xs font-medium text-foreground">
					{t("sector")}
				</label>
				<select
					id="sector"
					value={sector}
					onChange={(e) => setSector(e.target.value)}
					className={cn(inputClass, "cursor-pointer")}
				>
					{SECTORS.map((s) => (
						<option key={s} value={s}>
							{t(
								`sector${s.charAt(0).toUpperCase()}${s.slice(1)}` as Parameters<
									typeof t
								>[0],
							)}
						</option>
					))}
				</select>
			</div>

			{/* Error */}
			{error && (
				<p
					className="text-xs py-2 px-3 border border-[oklch(0.65_0.2_25)]/30 bg-[oklch(0.65_0.2_25)]/10"
					style={{ color: "oklch(0.65 0.2 25)" }}
					role="alert"
				>
					{error}
				</p>
			)}

			{/* Submit */}
			<button
				type="submit"
				disabled={
					isSubmitting ||
					!name.trim() ||
					!clientName.trim() ||
					!websiteUrl.trim()
				}
				className="w-full h-10 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring btn-shadow active-scale"
			>
				{isSubmitting ? t("analyzing") : t("next")}
			</button>
		</form>
	);
}

// ============================================================================
// STEP 2 — COMPETITOR INPUT
// ============================================================================

interface Step2Props {
	projectId: Id<"consultantProjects">;
	onComplete: () => void;
	onBack: () => void;
}

function Step2Competitors({ projectId, onComplete, onBack }: Step2Props) {
	const t = useTranslations("consultant");
	const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
	const [newName, setNewName] = useState("");
	const [newUrl, setNewUrl] = useState("");
	const [addError, setAddError] = useState<string | null>(null);
	const [isAdding, setIsAdding] = useState(false);

	const addCompetitorMutation = useMutation(
		api.consultantProjects.addCompetitor,
	);
	const scrapeCompetitor = useAction(api.actions.scrapeCompetitor.run);

	const handleAdd = useCallback(async () => {
		if (!newName.trim() || !newUrl.trim()) return;
		if (competitors.length >= 5) {
			setAddError(t("maxCompetitors"));
			return;
		}

		setAddError(null);
		setIsAdding(true);

		const rowId = `comp-${Date.now()}`;
		const trimmedName = newName.trim();
		const trimmedUrl = newUrl.trim();

		try {
			// Validate URL client-side first
			new URL(trimmedUrl);
		} catch {
			setAddError(t("invalidUrl"));
			setIsAdding(false);
			return;
		}

		setCompetitors((prev) => [
			...prev,
			{
				id: rowId,
				name: trimmedName,
				url: trimmedUrl,
				status: "scraping",
			},
		]);
		setNewName("");
		setNewUrl("");

		try {
			const competitorIndex = await addCompetitorMutation({
				projectId,
				name: trimmedName,
				url: trimmedUrl,
			});
			// Fire-and-forget scrape — updates DB when done
			scrapeCompetitor({ projectId, competitorIndex, url: trimmedUrl })
				.then(() => {
					setCompetitors((prev) =>
						prev.map((c) => (c.id === rowId ? { ...c, status: "done" } : c)),
					);
				})
				.catch(() => {
					setCompetitors((prev) =>
						prev.map((c) => (c.id === rowId ? { ...c, status: "failed" } : c)),
					);
				});
		} catch (err) {
			setCompetitors((prev) =>
				prev.map((c) => (c.id === rowId ? { ...c, status: "failed" } : c)),
			);
			setAddError(err instanceof Error ? err.message : t("addCompetitorError"));
		} finally {
			setIsAdding(false);
		}
	}, [
		newName,
		newUrl,
		competitors.length,
		projectId,
		addCompetitorMutation,
		scrapeCompetitor,
		t,
	]);

	const handleRemove = (id: string) => {
		// Remove from local UI — competitor remains in DB (MVP: no removeCompetitor mutation)
		setCompetitors((prev) => prev.filter((c) => c.id !== id));
	};

	const inputClass =
		"flex-1 h-9 px-3 bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors duration-150";

	return (
		<div className="space-y-5">
			{/* Competitor list */}
			{competitors.length > 0 && (
				<ul className="space-y-2" aria-label={t("competitors")}>
					{competitors.map((c) => (
						<li
							key={c.id}
							className="flex items-center gap-3 px-3 py-2.5 border border-border bg-muted/20"
						>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-foreground truncate">
									{c.name}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{c.url}
								</p>
							</div>
							<span
								className={cn(
									"text-xs px-2 py-0.5 rounded-full border",
									c.status === "done" &&
										"border-[oklch(0.62_0.18_240)]/50 text-[oklch(0.62_0.18_240)] bg-[oklch(0.62_0.18_240)]/10",
									c.status === "scraping" &&
										"border-border text-muted-foreground animate-pulse",
									c.status === "failed" &&
										"border-[oklch(0.65_0.2_25)]/50 text-[oklch(0.65_0.2_25)]",
									c.status === "idle" && "border-border text-muted-foreground",
								)}
							>
								{c.status === "done" && t("competitorScraped")}
								{c.status === "scraping" && t("competitorScraping")}
								{c.status === "failed" && t("competitorFailed")}
								{c.status === "idle" && t("competitorAdded")}
							</span>
							<button
								type="button"
								onClick={() => handleRemove(c.id)}
								aria-label={t("removeCompetitor")}
								className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-2"
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
									<path d="M18 6L6 18M6 6l12 12" />
								</svg>
							</button>
						</li>
					))}
				</ul>
			)}

			{/* Add competitor form */}
			{competitors.length < 5 && (
				<fieldset className="border border-border p-4 space-y-3">
					<legend className="text-xs font-medium text-muted-foreground px-1">
						{t("addCompetitor")}
					</legend>

					<div className="flex flex-col sm:flex-row gap-2">
						<input
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder={t("competitorNamePlaceholder")}
							aria-label={t("competitorName")}
							className={inputClass}
						/>
						<input
							type="url"
							value={newUrl}
							onChange={(e) => setNewUrl(e.target.value)}
							placeholder={t("competitorUrlPlaceholder")}
							aria-label={t("competitorUrl")}
							className={inputClass}
						/>
					</div>

					{addError && (
						<p
							className="text-xs"
							style={{ color: "oklch(0.65 0.2 25)" }}
							role="alert"
						>
							{addError}
						</p>
					)}

					<button
						type="button"
						onClick={handleAdd}
						disabled={isAdding || !newName.trim() || !newUrl.trim()}
						className="h-9 px-4 rounded-full text-xs font-medium border border-border bg-transparent text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M12 5v14M5 12h14" />
						</svg>
						{t("addCompetitor")}
					</button>
				</fieldset>
			)}

			{/* Navigation */}
			<div className="flex gap-3 pt-2">
				<button
					type="button"
					onClick={onBack}
					className="h-10 px-5 rounded-full text-sm font-medium border border-border bg-transparent text-foreground hover:bg-muted transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{t("back")}
				</button>
				<button
					type="button"
					onClick={onComplete}
					className="flex-1 h-10 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring btn-shadow active-scale"
				>
					{t("startDiscovery")}
				</button>
			</div>
		</div>
	);
}

// ============================================================================
// LOADING / EMPTY STATES
// ============================================================================

function WorkspaceLoading() {
	return (
		<div className="flex items-center justify-center h-full">
			<div className="space-y-2 w-48">
				<div className="h-2.5 bg-muted animate-pulse rounded-sm" />
				<div className="h-2.5 bg-muted animate-pulse w-3/4 rounded-sm" />
			</div>
		</div>
	);
}

function NoWorkspace() {
	const t = useTranslations("consultant");
	return (
		<div className="flex items-center justify-center h-full px-4">
			<div className="flex flex-col items-center gap-4 text-center max-w-xs">
				<div className="icon-container" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-muted-foreground"
						aria-hidden="true"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5" />
						<path d="M2 12l10 5 10-5" />
					</svg>
				</div>
				<div className="space-y-1">
					<p className="text-sm font-medium text-foreground tracking-[-0.015em]">
						{t("noWorkspace")}
					</p>
					<p className="text-xs text-muted-foreground leading-relaxed">
						{t("noWorkspaceDesc")}
					</p>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ConsultantOnboardPage() {
	const t = useTranslations("consultant");
	const locale = useLocale();
	const router = useRouter();
	const [step, setStep] = useState<Step>(1);
	const [projectId, setProjectId] = useState<Id<"consultantProjects"> | null>(
		null,
	);

	const workspaces = useQuery(api.workspaces.list);
	const workspaceId = workspaces?.[0]?._id;

	const updateStatus = useMutation(api.consultantProjects.updateStatus);

	const handleProjectCreated = (
		id: Id<"consultantProjects">,
		_websiteUrl: string,
	) => {
		setProjectId(id);
		setStep(2);
	};

	const handleCompetitorsComplete = async () => {
		if (!projectId) return;
		try {
			await updateStatus({ projectId, status: "discovery" });
		} catch (err) {
			console.error("[onboard] updateStatus discovery failed:", err);
		}
		router.push(`/${locale}/dashboard/consultant/onboard/${projectId}`);
	};

	if (workspaces === undefined) {
		return (
			<div className="h-full">
				<WorkspaceLoading />
			</div>
		);
	}

	if (!workspaceId) {
		return (
			<div className="h-full">
				<NoWorkspace />
			</div>
		);
	}

	const stepDescriptions: Record<Step, string> = {
		1: t("step1Desc"),
		2: t("step2Desc"),
		3: t("step3Desc"),
	};

	return (
		<div className="h-full flex flex-col items-center justify-start pt-8 px-4 pb-8">
			<div className="w-full max-w-lg">
				{/* Header */}
				<div className="mb-6">
					<h1 className="font-heading text-xl font-semibold text-foreground tracking-[-0.03em] mb-1">
						{t("title")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{stepDescriptions[step]}
					</p>
				</div>

				{/* Step indicator */}
				<StepIndicator current={step} />

				{/* Step content */}
				<div className="border border-border bg-card p-6">
					{step === 1 && (
						<Step1ProjectForm
							workspaceId={workspaceId}
							onCreated={handleProjectCreated}
						/>
					)}
					{step === 2 && projectId && (
						<Step2Competitors
							projectId={projectId}
							onComplete={handleCompetitorsComplete}
							onBack={() => setStep(1)}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

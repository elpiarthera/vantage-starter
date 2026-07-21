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
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import {
	type Option,
	OptionList,
	OptionListContent,
	OptionListOptions,
} from "@/components/ui/option-list";
import {
	ProgressStep,
	type Step as ProgressStepData,
	ProgressSteps,
	ProgressStepsList,
} from "@/components/ui/progress-steps";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { normalizeUrl } from "@/lib/validation/url";

// ============================================================================
// TYPES
// ============================================================================

type Step = 1 | 2 | 3;

interface CompetitorRow {
	id: string;
	name: string;
	url: string;
	status: "idle" | "scraping" | "done" | "failed" | "unavailable";
}

// ============================================================================
// SECTOR OPTIONS
// ============================================================================

const SECTORS = [
	"technology",
	"consulting",
	"finance",
	"healthcare",
	"manufacturing",
	"retail",
	"education",
	"legal",
	"real_estate",
	"media",
	"hospitality",
	"logistics",
	"energy",
	"construction",
	"agriculture",
	"nonprofit",
	"government",
	"marketing",
	"sales",
	"other",
] as const;

type Sector = (typeof SECTORS)[number];

// Explicit map from sector value → i18n key — avoids dynamic key generation
// which can silently fall back to EN when the generated key doesn't type-check.
const SECTOR_I18N_KEYS: Record<Sector, string> = {
	technology: "sectorTechnology",
	consulting: "sectorConsulting",
	finance: "sectorFinance",
	healthcare: "sectorHealthcare",
	manufacturing: "sectorManufacturing",
	retail: "sectorRetail",
	education: "sectorEducation",
	legal: "sectorLegal",
	real_estate: "sectorReal_estate",
	media: "sectorMedia",
	hospitality: "sectorHospitality",
	logistics: "sectorLogistics",
	energy: "sectorEnergy",
	construction: "sectorConstruction",
	agriculture: "sectorAgriculture",
	nonprofit: "sectorNonprofit",
	government: "sectorGovernment",
	marketing: "sectorMarketing",
	sales: "sectorSales",
	other: "sectorOther",
};

// ============================================================================
// STEP INDICATOR
// ============================================================================

// Adapted onto the ported mcpcn `progress-steps` block
// (components/ui/progress-steps.tsx) — see the block's own file header for
// the upstream MIT attribution. Previously a hand-rolled numbered-circle
// nav (checkmark svg + manually computed border/bg colors per step); the
// block already renders exactly this shape (completed check / current
// border / pending border) driven off the same `Step["status"]` union, so
// the by-hand version is replaced rather than duplicated alongside it.
// `aria-current="step"` is preserved explicitly per item — the block's data-
// driven auto-render has no per-step slot for it, so the steps are rendered
// through the block's own exported sub-components instead of its default
// children.
function StepIndicator({ current }: { current: Step }) {
	const t = useTranslations("consultant");
	const steps: (ProgressStepData & { step: Step })[] = [
		{
			label: t("step1Title"),
			status: current > 1 ? "completed" : current === 1 ? "current" : "pending",
			step: 1,
		},
		{
			label: t("step2Title"),
			status: current > 2 ? "completed" : current === 2 ? "current" : "pending",
			step: 2,
		},
		{
			label: t("step3Title"),
			status: current === 3 ? "current" : "pending",
			step: 3,
		},
	];

	return (
		<nav aria-label={t("onboardingStepsAriaLabel")} className="mb-8">
			<ProgressSteps data={{ steps }} className="bg-transparent p-0">
				<ProgressStepsList>
					{steps.map((s, i) => (
						<ProgressStep
							aria-current={s.status === "current" ? "step" : undefined}
							index={i}
							key={s.step}
							step={s}
						/>
					))}
				</ProgressStepsList>
			</ProgressSteps>
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
	const [sector, setSector] = useState<Sector>("technology");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const sectorOptions: Option[] = useMemo(
		() => SECTORS.map((s) => ({ label: t(SECTOR_I18N_KEYS[s]) })),
		[t],
	);

	const createProject = useMutation(api.consultantProjects.create);
	const scrapeClient = useAction(api.actions.scrapeClient.run);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !clientName.trim() || !websiteUrl.trim()) return;

		setIsSubmitting(true);
		setError(null);

		try {
			let url: string;
			try {
				url = normalizeUrl(websiteUrl);
			} catch {
				setError(t("invalidUrl"));
				setIsSubmitting(false);
				return;
			}
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
					type="text"
					inputMode="url"
					value={websiteUrl}
					onChange={(e) => setWebsiteUrl(e.target.value)}
					placeholder={t("websiteUrlPlaceholder")}
					required
					aria-required="true"
					aria-describedby="website-url-hint"
					className={inputClass}
				/>
				<p id="website-url-hint" className="text-xs text-muted-foreground">
					{t("websiteUrlHint")}
				</p>
			</div>

			{/* Sector — ported mcpcn `option-list` block (single-select pill
			    picker) replacing the previous native `<select>`. Flat, no
			    hierarchy — a genuine fit, unlike TeamSelection downstream in
			    the same flow, whose team->agent->skill cascade this block
			    cannot express (see components/ui/option-list.tsx header). */}
			<fieldset className="space-y-1.5">
				<legend className="text-xs font-medium text-foreground">
					{t("sector")}
				</legend>
				<OptionList
					data={{ options: sectorOptions }}
					control={{ selectedOptionIndex: SECTORS.indexOf(sector) }}
					actions={{
						onSubmit: (selected) => {
							const index = sectorOptions.indexOf(selected[0]);
							if (index !== -1) setSector(SECTORS[index]);
						},
					}}
					className="bg-transparent p-0"
				>
					<OptionListContent>
						<OptionListOptions />
					</OptionListContent>
				</OptionList>
			</fieldset>

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

	// Live read of the client-site scrape kicked off (fire-and-forget) from
	// Step1ProjectForm. Reactivity closes the gap that used to make a failed
	// or unconfigured extraction invisible: this query updates the instant
	// `scrapeClient`'s internal mutations write `status`/`brandKit`, with no
	// polling and no action needed from Step1.
	const project = useQuery(api.consultantProjects.get, { projectId });
	const clientScrapeError = project?.brandKit?.error as string | undefined;
	const clientScrapeConfigMissing = project?.brandKit?.configMissing as
		| boolean
		| undefined;
	const clientScrapePending =
		project?.status === "created" || project?.status === "scraping";

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

		let trimmedUrl: string;
		try {
			// Normalize (add scheme if missing) then validate URL client-side first
			trimmedUrl = normalizeUrl(newUrl);
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
			// Fire-and-forget scrape — updates DB when done. `.then()` must read
			// `result.success`: the action never rejects on an extraction failure
			// (it catches internally and resolves `{ success: false, error }`), so
			// checking only "the promise resolved" previously reported every
			// scrape as "done" even when it had failed.
			scrapeCompetitor({ projectId, competitorIndex, url: trimmedUrl })
				.then((result) => {
					setCompetitors((prev) =>
						prev.map((c) =>
							c.id === rowId
								? {
										...c,
										status: result.success
											? "done"
											: result.configMissing
												? "unavailable"
												: "failed",
									}
								: c,
						),
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
			{/* Client-site scrape status — makes the fire-and-forget scrape kicked
			    off in Step1ProjectForm visible instead of a silent console.error. */}
			{clientScrapePending && (
				<output className="block text-xs px-3 py-2 border border-border bg-muted/20 text-muted-foreground animate-pulse">
					{t("scrapeProgress")}
				</output>
			)}
			{!clientScrapePending && clientScrapeError && (
				<p
					className="text-xs px-3 py-2 border border-[oklch(0.65_0.2_25)]/50 text-[oklch(0.65_0.2_25)]"
					role="alert"
				>
					{clientScrapeConfigMissing
						? t("scrapeUnavailable")
						: t("scrapeFailed")}
				</p>
			)}
			{!clientScrapePending && !clientScrapeError && project?.brandKit && (
				<output className="block text-xs px-3 py-2 border border-[oklch(0.62_0.18_240)]/50 text-[oklch(0.62_0.18_240)] bg-[oklch(0.62_0.18_240)]/10">
					{t("scrapeDone")}
				</output>
			)}

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
									(c.status === "failed" || c.status === "unavailable") &&
										"border-[oklch(0.65_0.2_25)]/50 text-[oklch(0.65_0.2_25)]",
									c.status === "idle" && "border-border text-muted-foreground",
								)}
							>
								{c.status === "done" && t("competitorScraped")}
								{c.status === "scraping" && t("competitorScraping")}
								{c.status === "failed" && t("competitorFailed")}
								{c.status === "unavailable" && t("competitorUnavailable")}
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
		router.push(ROUTES.dashboardConsultantOnboardProject(projectId));
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

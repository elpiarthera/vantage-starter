"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import {
	ArrowLeft,
	ArrowRight,
	Baby,
	Briefcase,
	Cake,
	Calendar,
	CreditCard,
	Gift,
	Globe,
	GraduationCap,
	Heart,
	Home,
	Loader2,
	LogOut,
	Settings,
	Sparkles,
	User,
	Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { PurchaseCreditsModal } from "@/components/dashboard/account/modals/PurchaseCreditsModal";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { useProjectData } from "@/hooks/business-logic/useProjectData";
import { usePurchaseSuccessToast } from "@/hooks/business-logic/usePurchaseSuccessToast";
import { Link } from "@/i18n/routing";

function GuidedStep1Content() {
	const tCommon = useTranslations("common");
	const tStep1 = useTranslations("guided_step1"); // New namespace for step 1 specific strings
	const tOccasions = useTranslations("occasions");
	const tCredits = useTranslations("credits");
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();

	// Get projectId and templateId from URL query params
	const projectIdFromUrl = searchParams.get("projectId");
	const templateIdFromUrl = searchParams.get("templateId");
	const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(
		projectIdFromUrl ? (projectIdFromUrl as Id<"projects">) : undefined,
	);
	const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
	const hasHandledTemplateRef = useRef(false);

	// 🔧 Sprint 24: Get pre-populated selections from Tool Selection Wall
	const occasionFromUrl = searchParams.get("occasion");
	const styleFromUrl = searchParams.get("style");
	const themeFromUrl = searchParams.get("theme");

	// Initialize Convex hooks
	const { project, create, isLoading } = useProjectData(projectId);
	const { balance } = useCredits(user?.id || "");
	usePurchaseSuccessToast();
	const updateProject = useMutation(api.projects.update);
	const createFromTemplate = useMutation(api.projects.createFromTemplate);
	const incrementTemplateUsage = useMutation(api.templates.incrementUsage);

	const [showPurchaseModal, setShowPurchaseModal] = useState(false);

	// AI processing states
	const [isRefining, setIsRefining] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSavingDraft, setIsSavingDraft] = useState(false);
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [requiredCredits, setRequiredCredits] = useState(0);
	const [creditAction, setCreditAction] = useState<"refinement" | "generation">(
		(() => {
			const raw = searchParams.get("pendingAction");
			return raw === "generation" ? "generation" : "refinement";
		})(),
	);

	// Local UI state (for immediate feedback before Convex sync)
	const [selectedOccasion, setSelectedOccasion] = useState<string | null>(
		occasionFromUrl || null,
	);
	const [selectedTheme, setSelectedTheme] = useState<string | null>(
		themeFromUrl || null,
	);
	const [language, setLanguage] = useState("English");
	const [eventDetails, setEventDetails] = useState({
		name: "",
		description: "",
		date: "",
		location: "",
		rsvpLink: "",
		emotionalStory: "",
	});

	const occasions = [
		{
			id: "wedding",
			label: tOccasions("wedding"),
			icon: Heart,
			description: tOccasions("wedding_desc"),
		},
		{
			id: "birthday",
			label: tOccasions("birthday"),
			icon: Cake,
			description: tOccasions("birthday_desc"),
		},
		{
			id: "anniversary",
			label: tOccasions("anniversary"),
			icon: Calendar,
			description: tOccasions("anniversary_desc"),
		},
		{
			id: "baby-shower",
			label: tOccasions("baby_shower"),
			icon: Baby,
			description: tOccasions("baby_shower_desc"),
		},
		{
			id: "graduation",
			label: tOccasions("graduation"),
			icon: GraduationCap,
			description: tOccasions("graduation_desc"),
		},
		{
			id: "corporate",
			label: tOccasions("corporate"),
			icon: Briefcase,
			description: tOccasions("corporate_desc"),
		},
		{
			id: "holiday",
			label: tOccasions("holiday"),
			icon: Gift,
			description: tOccasions("holiday_desc"),
		},
		{
			id: "engagement",
			label: tOccasions("engagement"),
			icon: Users,
			description: tOccasions("engagement_desc"),
		},
	];

	const emotionalThemes = [
		{
			id: "joyful",
			label: tStep1("emotional_theme_joyful_label"),
			colorClass: "text-primary",
			description: tStep1("emotional_theme_joyful_description"),
		},
		{
			id: "nostalgic",
			label: tStep1("emotional_theme_nostalgic_label"),
			colorClass: "text-primary",
			description: tStep1("emotional_theme_nostalgic_description"),
		},
		{
			id: "romantic",
			label: tStep1("emotional_theme_romantic_label"),
			colorClass: "text-primary",
			description: tStep1("emotional_theme_romantic_description"),
		},
		{
			id: "energetic",
			label: tStep1("emotional_theme_energetic_label"),
			colorClass: "text-primary",
			description: tStep1("emotional_theme_energetic_description"),
		},
		{
			id: "tender",
			label: tStep1("emotional_theme_tender_label"),
			colorClass: "text-primary",
			description: tStep1("emotional_theme_tender_description"),
		},
		{
			id: "motivational",
			label: tStep1("emotional_theme_motivational_label"),
			colorClass: "text-blue-400",
			description: tStep1("emotional_theme_motivational_description"),
		},
	];

	// Only show languages supported in our translation system
	// Matches the 7 locales defined in i18n/routing.ts
	const languages = [
		tCommon("language_english"), // en
		tCommon("language_french"), // fr
		tCommon("language_german"), // de
		tCommon("language_italian"), // it
		tCommon("language_spanish"), // es
		tCommon("language_portuguese"), // pt
		tCommon("language_russian"), // ru
	];

	const isFormValid =
		selectedOccasion &&
		selectedTheme &&
		eventDetails.name.length >= 3 &&
		eventDetails.emotionalStory.length >= 10;

	// Handle AI story refinement (1 credit)
	const handleRefineStory = async () => {
		if (!selectedOccasion || !selectedTheme || !eventDetails.emotionalStory) {
			return;
		}

		setIsRefining(true);

		try {
			const response = await fetch("/api/step1/refine-story", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					personalStory: eventDetails.emotionalStory,
					occasion: selectedOccasion,
					theme: selectedTheme,
					eventTitle: eventDetails.name,
					language,
					projectId,
					projectName: eventDetails.name,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				if (data.code === "INSUFFICIENT_CREDITS") {
					setRequiredCredits(data.required);
					setCreditAction("refinement");
					setShowInsufficientCreditsModal(true);
					return;
				}
				throw new Error(data.error || "Failed to refine story");
			}

			// Update the story with the refined version
			setEventDetails((prev) => ({
				...prev,
				emotionalStory: data.refinedStory,
			}));
		} catch (error) {
			console.error("Failed to refine story:", error);
			alert(error instanceof Error ? error.message : "Failed to refine story");
		} finally {
			setIsRefining(false);
		}
	};

	// Handle continue with story generation (5 credits)
	const handleContinue = async () => {
		if (!isFormValid || !selectedOccasion || !selectedTheme) return;

		setIsGenerating(true);

		try {
			let currentProjectId = projectId;

			// Create project if it doesn't exist
			if (!currentProjectId) {
				currentProjectId = await create({
					name: eventDetails.name,
					occasion: selectedOccasion,
					theme: selectedTheme,
					eventDetails: {
						eventTitle: eventDetails.name,
						description: eventDetails.description,
						date: eventDetails.date,
						location: eventDetails.location,
						rsvpLink: eventDetails.rsvpLink,
						emotionalStory: eventDetails.emotionalStory,
					},
					language,
				});

				setProjectId(currentProjectId);
			}

			// Generate the story using AI
			const response = await fetch("/api/step1/generate-story", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					occasion: selectedOccasion,
					theme: selectedTheme,
					eventTitle: eventDetails.name,
					description: eventDetails.description,
					date: eventDetails.date,
					location: eventDetails.location,
					personalStory: eventDetails.emotionalStory,
					language,
					projectId: currentProjectId,
					projectName: eventDetails.name,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				if (data.code === "INSUFFICIENT_CREDITS") {
					setRequiredCredits(data.required);
					setCreditAction("generation");
					setShowInsufficientCreditsModal(true);
					return;
				}
				throw new Error(data.error || "Failed to generate story");
			}

			// Story is now saved to Convex by the API (no sessionStorage needed)
			// Log if we used cached story vs generated new one
			if (data.fromCache) {
				console.log("[Step 1] Using existing story (no credits charged)");
			} else {
				console.log("[Step 1] Generated new story (5 credits charged)");
			}

			// Navigate to next step WITH projectId in URL
			router.push(`/guided/step-2?projectId=${currentProjectId}`);
		} catch (error) {
			console.error("Failed to generate story:", error);
			alert(
				error instanceof Error ? error.message : "Failed to generate story",
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setEventDetails((prev) => ({ ...prev, [field]: value }));
	};

	// Handle save as draft (no story generation, no credits)
	const handleSaveDraft = async () => {
		if (!selectedOccasion || !selectedTheme || !eventDetails.name) {
			return;
		}

		setIsSavingDraft(true);

		try {
			let currentProjectId = projectId;

			// Create project if it doesn't exist
			if (!currentProjectId) {
				currentProjectId = await create({
					name: eventDetails.name,
					occasion: selectedOccasion,
					theme: selectedTheme,
					eventDetails: {
						eventTitle: eventDetails.name,
						description: eventDetails.description,
						date: eventDetails.date,
						location: eventDetails.location,
						rsvpLink: eventDetails.rsvpLink,
						emotionalStory: eventDetails.emotionalStory || "",
					},
					language,
				});

				setProjectId(currentProjectId);
				// Update URL with projectId
				router.replace(`/guided/step-1?projectId=${currentProjectId}`);
				console.log("[Step 1] Draft created successfully:", currentProjectId);
				toast.success(tStep1("draft_saved_success"));
			} else {
				// Update existing project immediately (user explicitly clicked save)
				console.log("[Step 1] Updating draft project:", currentProjectId);
				await updateProject({
					projectId: currentProjectId,
					name: eventDetails.name,
					occasion: selectedOccasion,
					theme: selectedTheme,
					eventDetails: {
						eventTitle: eventDetails.name,
						description: eventDetails.description,
						date: eventDetails.date,
						location: eventDetails.location,
						rsvpLink: eventDetails.rsvpLink,
						emotionalStory: eventDetails.emotionalStory || "",
					},
					language,
					status: "draft",
				});
				console.log("[Step 1] Draft updated successfully");
				toast.success(tStep1("draft_updated_success"));
			}
		} catch (error) {
			console.error("Failed to save draft:", error);
			alert(
				error instanceof Error
					? error.message
					: "Failed to save draft. Please try again.",
			);
		} finally {
			setIsSavingDraft(false);
		}
	};

	// When landing with templateId (Use the template): create project from template and redirect
	useEffect(() => {
		if (
			!templateIdFromUrl ||
			hasHandledTemplateRef.current ||
			projectIdFromUrl
		) {
			return;
		}
		hasHandledTemplateRef.current = true;
		setIsCreatingFromTemplate(true);
		createFromTemplate({ templateId: templateIdFromUrl as Id<"templates"> })
			.then(async (newProjectId) => {
				try {
					await incrementTemplateUsage({
						templateId: templateIdFromUrl as Id<"templates">,
					});
				} catch {
					// Usage count is not critical; continue to redirect
				}
				router.replace(`/guided/step-1?projectId=${newProjectId}`);
			})
			.catch((err) => {
				toast.error(
					err instanceof Error ? err.message : "Failed to use template",
				);
				setIsCreatingFromTemplate(false);
				hasHandledTemplateRef.current = false;
			});
	}, [
		templateIdFromUrl,
		projectIdFromUrl,
		createFromTemplate,
		incrementTemplateUsage,
		router,
	]);

	// Sync Convex data to local state when loaded (for existing projects)
	const hasSyncedFromConvex = useRef(false);
	useEffect(() => {
		if (project && !isLoading && !hasSyncedFromConvex.current) {
			hasSyncedFromConvex.current = true;
			setSelectedOccasion(project.occasion);
			setSelectedTheme(project.theme);
			setLanguage(project.language);
			setEventDetails({
				name: project.eventDetails.eventTitle,
				description: project.eventDetails.description || "",
				date: project.eventDetails.date || "",
				location: project.eventDetails.location || "",
				rsvpLink: project.eventDetails.rsvpLink || "",
				emotionalStory: project.eventDetails.emotionalStory,
			});
		}
	}, [project, isLoading]);

	// Auto-trigger pending credit action after a successful credits purchase.
	// When Polar redirects back with ?creditsAdded=1&pendingAction=<action>,
	// fire the exact action the user was attempting before the credit wall.
	const creditsAddedParam = searchParams.get("creditsAdded");
	const pendingActionParam = searchParams.get("pendingAction");
	const autoTriggerStep1Ref = useRef(false);
	// Stable refs so the useEffect dep array doesn't include the handler fns
	const handleRefineStoryRef = useRef(handleRefineStory);
	handleRefineStoryRef.current = handleRefineStory;
	const handleContinueRef = useRef(handleContinue);
	handleContinueRef.current = handleContinue;
	useEffect(() => {
		if (creditsAddedParam !== "1") return;
		if (autoTriggerStep1Ref.current) return;
		// Wait until project data is loaded
		if (isLoading) return;

		const params = new URLSearchParams(searchParams.toString());
		params.delete("creditsAdded");
		params.delete("pendingAction");
		const newUrl = `${window.location.pathname}?${params.toString()}`;

		if (!pendingActionParam) {
			router.replace(newUrl);
			return;
		}

		autoTriggerStep1Ref.current = true;
		router.replace(newUrl);

		const timer = setTimeout(() => {
			if (pendingActionParam === "refinement") {
				handleRefineStoryRef.current();
			} else if (pendingActionParam === "generation") {
				handleContinueRef.current();
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [creditsAddedParam, pendingActionParam, isLoading, router, searchParams]);

	// NO AUTO-SAVE! Data is saved when:
	// 1. User clicks "Continue to The Story" (creates project if new, or project already exists)
	// 2. User clicks "Let AI Refine It" (project must exist)
	// This avoids the save loop and unnecessary API calls

	const isProcessing = isRefining || isGenerating || isSavingDraft;

	// Loading while creating project from template (Use the template)
	if (templateIdFromUrl && isCreatingFromTemplate) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Loader2 className="h-12 w-12 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="shadow-md p-4 fixed top-0 w-full z-50 bg-card border-b border-border">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<Link href="/dashboard/projects">
						<Button
							variant="ghost"
							aria-label="Back to dashboard"
							className="text-foreground hover:bg-secondary"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							{tCommon("back_to_projects")}
						</Button>
					</Link>

					<div className="flex-1 max-w-md mx-8">
						<div className="flex items-center gap-2 text-sm font-medium mb-2 text-primary">
							<span className="md:hidden">{tStep1("step_number_short")}</span>
							<span className="hidden md:inline">
								{tStep1("step_number_full")}
							</span>
							{/* Credit balance indicator - opens purchase modal */}
							<button
								type="button"
								onClick={() => setShowPurchaseModal(true)}
								className="ml-auto flex items-center min-h-[44px] px-2 rounded-md hover:bg-accent active:scale-95 transition-colors cursor-pointer"
								aria-label={tCredits("your_balance", { balance })}
							>
								<Badge
									variant="outline"
									className="text-xs border-muted text-muted-foreground hover:border-primary hover:text-foreground cursor-pointer transition-colors"
								>
									{tCredits("your_balance", { balance })}
								</Badge>
							</button>
						</div>
						<div className="w-full rounded-full h-2 bg-muted">
							<div className="h-2 rounded-full w-1/6 transition-all duration-500 bg-primary" />
						</div>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="text-foreground hover:bg-secondary"
								aria-label="User Menu"
							>
								<User className="h-4 w-4 mr-2" />
								<span className="hidden md:inline">
									{tCommon("profile_button")}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-48 bg-card border-border text-foreground"
						>
							<DropdownMenuItem
								className="hover:bg-secondary focus:bg-secondary cursor-pointer"
								onClick={() => setShowPurchaseModal(true)}
							>
								<CreditCard className="h-4 w-4 mr-2" />
								{tCredits("your_balance", { balance })}
							</DropdownMenuItem>
							<DropdownMenuItem
								asChild
								className="hover:bg-secondary focus:bg-secondary"
							>
								<Link
									href="/dashboard"
									className="flex items-center gap-2 cursor-pointer"
								>
									<Settings className="h-4 w-4" />
									{tCommon("dashboard_link")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<SignOutButton redirectUrl="/sign-in">
									<button
										type="button"
										className="flex w-full items-center hover:bg-secondary focus:bg-secondary cursor-pointer px-2 py-1.5 text-sm"
									>
										<LogOut className="h-4 w-4 mr-2" />
										{tCommon("sign_out_button")}
									</button>
								</SignOutButton>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<LanguageSwitcher />

					<Link href="/">
						<Button
							variant="ghost"
							aria-label="Home"
							className="text-foreground hover:bg-secondary"
						>
							<Home className="h-4 w-4 mr-2" />
							<span className="hidden md:inline">{tCommon("home_button")}</span>
						</Button>
					</Link>
				</div>
			</div>

			<div className="pt-24 pb-8 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-center mb-2 animate-in fade-in duration-300 text-foreground">
							{tStep1("main_title")}
						</h1>
						<p className="text-xl italic text-center mb-8 text-primary">
							{tStep1("subtitle")}
						</p>
					</div>

					<div className="max-w-4xl mx-auto space-y-8">
						{/* 🔧 Sprint 24: Show pre-populated selections */}
						{(occasionFromUrl || styleFromUrl || themeFromUrl) && (
							<div className="bg-primary/10 border border-primary/20 rounded-lg p-4 animate-in fade-in duration-300">
								<p className="font-semibold text-foreground leading-6 mb-2">
									{tStep1("prepopulated_title")}
								</p>
								<div className="flex flex-wrap gap-2 text-sm text-muted-foreground leading-relaxed">
									{occasionFromUrl && (
										<Badge variant="secondary">
											{tStep1("prepopulated_occasion")}: {occasionFromUrl}
										</Badge>
									)}
									{styleFromUrl && (
										<Badge variant="secondary">
											{tStep1("prepopulated_style")}: {styleFromUrl}
										</Badge>
									)}
									{themeFromUrl && (
										<Badge variant="secondary">
											{tStep1("prepopulated_theme")}: {themeFromUrl}
										</Badge>
									)}
								</div>
							</div>
						)}

						{/* Occasion Selector */}
						<div>
							<h2 className="text-2xl font-semibold mb-4 text-foreground">
								{tStep1("choose_occasion_title")}
							</h2>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{occasions.map((occasion) => {
									const IconComponent = occasion.icon;
									return (
										<Card
											key={occasion.id}
											className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 bg-card ${
												selectedOccasion === occasion.id
													? "border-2 border-primary scale-105"
													: "border-transparent"
											}`}
											onClick={() => setSelectedOccasion(occasion.id)}
										>
											<CardContent className="p-4 text-center">
												<div className="mb-2 p-3 rounded-full shadow-sm mx-auto w-fit bg-secondary">
													<IconComponent className="h-8 w-8 text-primary" />
												</div>
												<h3 className="text-lg font-semibold mb-1 text-foreground">
													{occasion.label}
												</h3>
												<p className="text-sm text-muted-foreground leading-relaxed">
													{occasion.description}
												</p>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>

						{selectedOccasion && (
							<div className="animate-in slide-in-from-bottom duration-300">
								<h2 className="text-2xl font-semibold mb-4 text-foreground">
									{tStep1("shape_emotion_title")}
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{emotionalThemes.map((theme) => (
										<Card
											key={theme.id}
											className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-card ${
												selectedTheme === theme.id
													? "border-2 border-primary scale-105"
													: "border-transparent"
											}`}
											onClick={() => setSelectedTheme(theme.id)}
										>
											<CardContent className="p-4">
												<div className="flex items-center gap-3">
													<Heart className={`h-6 w-6 ${theme.colorClass}`} />
													<div>
														<h3 className="font-semibold text-foreground">
															{theme.label}
														</h3>
														<p className="text-sm text-muted-foreground leading-relaxed">
															{theme.description}
														</p>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						)}

						{selectedTheme && (
							<div className="animate-in slide-in-from-bottom duration-300">
								<h2 className="text-2xl font-semibold mb-4 text-foreground">
									{tStep1("project_details_title")}
								</h2>
								<div className="rounded-lg p-6 shadow-sm space-y-4 bg-card">
									<div>
										<label
											htmlFor="project-name"
											className="block text-sm font-medium mb-2 text-foreground"
										>
											{tStep1("project_name_label")}
										</label>
										<Input
											id="project-name"
											required
											placeholder={tStep1("project_name_placeholder")}
											value={eventDetails.name}
											onChange={(e) =>
												handleInputChange("name", e.target.value)
											}
											className={`bg-secondary border-muted text-foreground placeholder:text-muted-foreground ${eventDetails.name.length > 0 && eventDetails.name.length < 3 ? "border-destructive" : ""}`}
										/>
										{eventDetails.name.length > 0 &&
											eventDetails.name.length < 3 && (
												<p className="text-destructive text-sm mt-1 leading-relaxed">
													{tStep1("project_name_min_length")}
												</p>
											)}
									</div>

									<div>
										<label
											htmlFor="event-type"
											className="block text-sm font-medium mb-2 text-foreground"
										>
											{tStep1("event_type_label")}
										</label>
										<Input
											id="event-type"
											disabled
											value={
												occasions.find((o) => o.id === selectedOccasion)
													?.label || ""
											}
											className="bg-muted border-muted text-muted-foreground"
										/>
									</div>

									<div>
										<label
											htmlFor="description"
											className="block text-sm font-medium mb-2 text-foreground"
										>
											{tStep1("description_label")}
										</label>
										<Textarea
											id="description"
											placeholder={tStep1("description_placeholder", {
												themeLabel:
													emotionalThemes.find((th) => th.id === selectedTheme)
														?.label ?? "",
											})}
											value={eventDetails.description}
											onChange={(e) =>
												handleInputChange("description", e.target.value)
											}
											rows={3}
											className="bg-secondary border-muted text-foreground placeholder:text-muted-foreground"
										/>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="event-date"
												className="block text-sm font-medium mb-2 text-foreground"
											>
												{tStep1("date_label")}
											</label>
											<Input
												id="event-date"
												type="date"
												value={eventDetails.date}
												onChange={(e) =>
													handleInputChange("date", e.target.value)
												}
												className="bg-secondary border-muted text-foreground"
											/>
										</div>
										<div>
											<label
												htmlFor="location"
												className="block text-sm font-medium mb-2 text-foreground"
											>
												{tStep1("location_label")}
											</label>
											<Input
												id="location"
												placeholder={tStep1("location_placeholder")}
												value={eventDetails.location}
												onChange={(e) =>
													handleInputChange("location", e.target.value)
												}
												className="bg-secondary border-muted text-foreground placeholder:text-muted-foreground"
											/>
										</div>
										<div>
											<label
												htmlFor="rsvp-link"
												className="block text-sm font-medium mb-2 text-foreground"
											>
												{tStep1("rsvp_link_label")}
											</label>
											<Input
												id="rsvp-link"
												type="url"
												placeholder={tStep1("rsvp_link_placeholder")}
												value={eventDetails.rsvpLink}
												onChange={(e) =>
													handleInputChange("rsvpLink", e.target.value)
												}
												className="bg-secondary border-muted text-foreground placeholder:text-muted-foreground"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="emotional-story"
											className="block text-sm font-medium mb-2 text-foreground"
										>
											{tStep1("personal_story_label")}
										</label>
										<Textarea
											id="emotional-story"
											required
											placeholder={tStep1("personal_story_placeholder")}
											value={eventDetails.emotionalStory}
											onChange={(e) =>
												handleInputChange("emotionalStory", e.target.value)
											}
											rows={4}
											className={`bg-secondary border-muted text-foreground placeholder:text-muted-foreground ${
												eventDetails.emotionalStory.length > 0 &&
												eventDetails.emotionalStory.length < 10
													? "border-destructive"
													: ""
											}`}
										/>
										<div className="flex justify-between items-center mt-2">
											{eventDetails.emotionalStory.length > 0 &&
												eventDetails.emotionalStory.length < 10 && (
													<p className="text-destructive text-sm leading-relaxed">
														{tStep1("personal_story_min_length")}
													</p>
												)}
											<Button
												variant="outline"
												size="sm"
												onClick={handleRefineStory}
												disabled={
													isProcessing ||
													!eventDetails.emotionalStory ||
													eventDetails.emotionalStory.length < 10
												}
												className="ml-auto bg-transparent border-muted text-foreground hover:bg-secondary disabled:opacity-50"
											>
												{isRefining ? (
													<>
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
														{tStep1("refining_button")}
													</>
												) : (
													<>
														<Sparkles className="h-4 w-4 mr-2" />
														{tStep1("let_ai_refine_it_button")}
														<Badge
															variant="secondary"
															className="ml-2 text-xs bg-secondary"
														>
															{tCredits("refine_credits")}
														</Badge>
													</>
												)}
											</Button>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Language Selector */}
						{selectedTheme && (
							<div className="max-w-md">
								<h3 className="text-lg font-semibold mb-4 text-foreground">
									{tStep1("language_label")}
								</h3>
								<div className="rounded-lg p-4 shadow-sm bg-card">
									<Select value={language} onValueChange={setLanguage}>
										<SelectTrigger className="bg-secondary border-muted text-foreground">
											<Globe className="h-4 w-4 mr-2" />
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-card border-border">
											{languages.map((lang) => (
												<SelectItem
													key={lang}
													value={lang}
													className="text-foreground hover:bg-secondary"
												>
													{lang}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-sm text-muted-foreground mt-3 leading-relaxed">
										{tStep1("video_duration_hint")}
									</p>
								</div>
							</div>
						)}

						{selectedTheme && (
							<div className="pt-6 space-y-3">
								{/* Visualize Story: Show if story exists but not yet validated */}
								{project?.generatedStory && !project?.approvedMessageId && (
									<Button
										onClick={() => {
											router.push(`/guided/step-2?projectId=${projectId}`);
										}}
										className="w-full bg-blue-600 hover:bg-blue-700 text-white"
										size="lg"
									>
										{tStep1("visualize_story_button")}
										<Badge
											variant="secondary"
											className="ml-2 text-xs bg-blue-800"
										>
											{tCommon("free")}
										</Badge>
									</Button>
								)}

								{/* Skip to Visual Style: Only show if project has an approved story */}
								{project?.approvedMessageId && (
									<Button
										onClick={() => {
											router.push(`/guided/step-2b?projectId=${projectId}`);
										}}
										className="w-full bg-green-600 hover:bg-green-700 text-white"
										size="lg"
									>
										{tStep1("skip_to_visual_style")}
										<Badge
											variant="secondary"
											className="ml-2 text-xs bg-green-800"
										>
											{tCommon("free")}
										</Badge>
									</Button>
								)}

								{/* Save as draft button - always visible when theme is selected */}
								<Button
									type="button"
									onClick={handleSaveDraft}
									disabled={
										!selectedOccasion ||
										!selectedTheme ||
										!eventDetails.name ||
										isProcessing
									}
									variant="secondary"
									className="w-full border-2 border-primary/30 bg-secondary/90 text-foreground hover:bg-secondary hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/50 disabled:border-muted"
									size="lg"
								>
									{isSavingDraft ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{projectId && project && project.status === "draft"
												? tStep1("updating_draft_button")
												: tStep1("saving_draft_button")}
										</>
									) : projectId && project && project.status === "draft" ? (
										tStep1("update_draft_button")
									) : (
										tStep1("save_as_draft_button")
									)}
								</Button>

								{/* Continue with story generation */}
								<Button
									onClick={handleContinue}
									disabled={!isFormValid || isProcessing}
									className="w-full disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted"
									size="lg"
								>
									{isGenerating ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{tStep1("generating_story_button")}
										</>
									) : !isFormValid ? (
										tStep1("complete_required_fields_button")
									) : project?.approvedMessageId ? (
										<>
											{tStep1("regenerate_story_button")}
											<Badge
												variant="secondary"
												className="ml-2 text-xs bg-secondary"
											>
												{tCredits("generate_credits")}
											</Badge>
											<ArrowRight className="ml-2 h-4 w-4" />
										</>
									) : (
										<>
											{tStep1("continue_to_story_button")}
											<Badge
												variant="secondary"
												className="ml-2 text-xs bg-secondary"
											>
												{tCredits("generate_credits")}
											</Badge>
											<ArrowRight className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>

								{/* Help text when skip is available */}
								{project?.approvedMessageId && (
									<p className="text-center text-sm text-muted-foreground leading-relaxed">
										{tStep1("story_validated_hint")}
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Insufficient Credits Modal */}
			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => setShowInsufficientCreditsModal(false)}
				required={requiredCredits}
				available={balance}
				actionName={
					creditAction === "refinement"
						? tCredits("action_story_refinement")
						: tCredits("action_story_generation")
				}
				returnUrl={
					typeof window !== "undefined"
						? (() => {
								const url = new URL(window.location.href);
								url.searchParams.set("pendingAction", creditAction);
								return url.toString();
							})()
						: undefined
				}
			/>
			<PurchaseCreditsModal
				isOpen={showPurchaseModal}
				onClose={() => setShowPurchaseModal(false)}
				successUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>
		</div>
	);
}

export default function GuidedStep1() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-background">
					<Loader2 className="h-8 w-8 animate-spin text-foreground" />
				</div>
			}
		>
			<GuidedStep1Content />
		</Suspense>
	);
}

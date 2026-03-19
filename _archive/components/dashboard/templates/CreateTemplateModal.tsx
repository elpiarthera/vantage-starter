"use client";

import { useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

/** Step-1 occasions (same as guided step-1) for category dropdown */
const OCCASION_CATEGORIES = [
	"wedding",
	"birthday",
	"anniversary",
	"baby-shower",
	"graduation",
	"corporate",
	"holiday",
	"engagement",
	"custom",
] as const;

function categoryToType(
	category: string,
): "wedding" | "birthday" | "anniversary" | "business" | "custom" {
	const map: Record<
		string,
		"wedding" | "birthday" | "anniversary" | "business" | "custom"
	> = {
		wedding: "wedding",
		birthday: "birthday",
		anniversary: "anniversary",
		corporate: "business",
		business: "business",
	};
	return map[category] ?? "custom";
}

interface CreateTemplateModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave?: (template: {
		name: string;
		description: string;
		category: string;
		projectId: string;
	}) => void;
	onSuccess?: () => void;
}

export function CreateTemplateModal({
	isOpen,
	onClose,
	onSave,
	onSuccess,
}: CreateTemplateModalProps) {
	const { isMobile } = useDevice();
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		category: "wedding",
		projectId: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const projects = useQuery(api.projects.list);
	const project = useQuery(
		api.projects.get,
		formData.projectId
			? { projectId: formData.projectId as Id<"projects"> }
			: "skip",
	);
	const scenes = useQuery(
		api.scenes.list,
		formData.projectId
			? { projectId: formData.projectId as Id<"projects"> }
			: "skip",
	);
	const createTemplate = useMutation(api.templates.create);

	const t = useTranslations("create_template_modal");
	const tCommon = useTranslations("common");

	const categories = [...OCCASION_CATEGORIES];

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = t("validation.name_required");
		} else if (formData.name.length < 3) {
			newErrors.name = t("validation.name_min_length");
		} else if (formData.name.length > 50) {
			newErrors.name = t("validation.name_max_length");
		}

		if (!formData.description.trim()) {
			newErrors.description = t("validation.description_required");
		} else if (formData.description.length < 10) {
			newErrors.description = t("validation.description_min_length");
		} else if (formData.description.length > 200) {
			newErrors.description = t("validation.description_max_length");
		}

		if (!formData.projectId) {
			newErrors.projectId = t("validation.project_required");
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm()) return;
		if (!formData.projectId) {
			setErrors({ projectId: t("validation.project_required") });
			return;
		}
		if (!project) {
			toast.error(t("failed_to_load_projects"));
			return;
		}
		setIsSubmitting(true);
		try {
			const defaultScenes = (scenes ?? []).map((scene: Doc<"scenes">) => ({
				sceneNumber: scene.sceneNumber,
				title: scene.title,
				description: scene.description,
				duration: scene.duration,
				cinematicStyles: scene.cinematicStyles ?? undefined,
				startFrameUrl: (
					scene as { videoGeneration?: { startFrameUrl?: string } }
				)?.videoGeneration?.startFrameUrl,
				endFrameUrl: (scene as { videoGeneration?: { endFrameUrl?: string } })
					?.videoGeneration?.endFrameUrl,
			}));

			// Build the full validated story from step 2 (title + narration + scenes)
			const generatedStory = (
				project as {
					generatedStory?: {
						title?: string;
						narration?: string;
						emotionalArc?: string;
						scenes?: { number: number; description: string; mood: string }[];
						musicSuggestion?: string;
					};
				}
			).generatedStory;
			let validatedStory = "";
			if (generatedStory) {
				const parts: string[] = [];
				if (generatedStory.title) parts.push(generatedStory.title);
				if (generatedStory.narration) parts.push(generatedStory.narration);
				if (generatedStory.emotionalArc)
					parts.push(`Emotional Arc: ${generatedStory.emotionalArc}`);
				if (generatedStory.scenes && generatedStory.scenes.length > 0) {
					for (const scene of generatedStory.scenes) {
						parts.push(
							`Scene ${scene.number}: ${scene.description} (${scene.mood})`,
						);
					}
				}
				validatedStory = parts.join("\n\n");
			}

			await createTemplate({
				name: formData.name.trim(),
				description: formData.description.trim(),
				category: formData.category,
				type: categoryToType(formData.category),
				projectId: formData.projectId as Id<"projects">,
				config: {
					defaultScenes,
					defaultSettings: (project as { step4Data?: object }).step4Data ?? {},
					suggestedMusic: project.musicAudioUrl ? [project.musicAudioUrl] : [],
					suggestedStyles: project.visualStyle ? [project.visualStyle] : [],
					emotionalStory:
						(project as { eventDetails?: { emotionalStory?: string } })
							?.eventDetails?.emotionalStory ?? "",
					approvedNarrationScript:
						(project as { approvedNarrationScript?: string })
							.approvedNarrationScript ?? "",
					validatedStory,
				},
				thumbnail: project.finalVideoUrl ?? undefined,
			});
			toast.success(t("create_success_toast", { name: formData.name.trim() }));
			handleClose();
			onSuccess?.();
			onSave?.(formData);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("create_failed_toast"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setFormData({
			name: "",
			description: "",
			category: "wedding",
			projectId: "",
		});
		setErrors({});
		onClose();
	};

	const isLoading = projects === undefined;
	const hasError = projects === null;

	const FormContent = () => (
		<div className="space-y-4 md:space-y-6">
			{/* Template Name */}
			<div className="space-y-2">
				<Label htmlFor="template-name" className="text-sm md:text-base">
					{t("template_name_label")} *
				</Label>
				<Input
					id="template-name"
					placeholder={t("template_name_placeholder")}
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					className={`min-h-[48px] ${errors.name ? "border-red-500" : ""}`}
				/>
				{errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor="template-description" className="text-sm md:text-base">
					{t("description_label")} *
				</Label>
				<Textarea
					id="template-description"
					placeholder={t("description_placeholder")}
					value={formData.description}
					onChange={(e) =>
						setFormData({ ...formData, description: e.target.value })
					}
					className={`min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
				/>
				{errors.description && (
					<p className="text-xs text-red-500">{errors.description}</p>
				)}
			</div>

			{/* Category */}
			<div className="space-y-2">
				<Label htmlFor="template-category" className="text-sm md:text-base">
					{t("category_label")}
				</Label>
				<Select
					value={formData.category}
					onValueChange={(value) =>
						setFormData({ ...formData, category: value })
					}
				>
					<SelectTrigger id="template-category" className="min-h-[48px]">
						<SelectValue placeholder={t("select_category_placeholder")} />
					</SelectTrigger>
					<SelectContent>
						{categories.map((category) => (
							<SelectItem key={category} value={category}>
								{t(`category_${category.replace(/-/g, "_")}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Select Project */}
			<div className="space-y-2">
				<Label htmlFor="template-project" className="text-sm md:text-base">
					{t("base_project_label")} *
				</Label>
				{isLoading ? (
					<div className="text-sm text-muted-foreground">
						{t("loading_projects")}
					</div>
				) : hasError || !projects || projects.length === 0 ? (
					<div className="text-sm text-red-500">
						{hasError
							? t("failed_to_load_projects")
							: t("no_projects_available")}
					</div>
				) : (
					<>
						<Select
							value={formData.projectId}
							onValueChange={(value) =>
								setFormData({ ...formData, projectId: value })
							}
						>
							<SelectTrigger
								id="template-project"
								className={`min-h-[48px] ${errors.projectId ? "border-red-500" : ""}`}
							>
								<SelectValue placeholder={t("select_project_placeholder")} />
							</SelectTrigger>
							<SelectContent>
								{projects.map((project: Doc<"projects">) => (
									<SelectItem key={project._id} value={project._id}>
										{project.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.projectId && (
							<p className="text-xs text-red-500">{errors.projectId}</p>
						)}
						<p className="text-xs text-muted-foreground">
							{t("project_config_hint")}
						</p>
					</>
				)}
			</div>

			{/* Action Buttons */}
			<div className="flex flex-col-reverse md:flex-row gap-3 pt-4">
				<Button
					variant="outline"
					onClick={handleClose}
					className={`min-h-[44px] w-full md:w-auto ${isMobile ? "active:scale-98" : "hover:bg-accent"}`}
				>
					{tCommon("cancel")}
				</Button>
				<Button
					onClick={handleSave}
					disabled={isSubmitting}
					className={`min-h-[44px] w-full md:w-auto ${isMobile ? "active:scale-98" : "hover:bg-primary/90"}`}
				>
					{isSubmitting ? t("creating_template") : t("create_template_button")}
				</Button>
			</div>
		</div>
	);

	// Mobile: Drawer
	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
				<DrawerContent className="max-h-[90vh]">
					<DrawerHeader className="border-b border-border">
						<div className="flex items-center justify-between">
							<DrawerTitle className="text-lg">
								{t("create_template_title")}
							</DrawerTitle>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleClose}
								className="min-h-[44px] min-w-[44px]"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					</DrawerHeader>
					<div className="p-4 overflow-y-auto">
						<FormContent />
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	// Desktop: Modal
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-xl">
						{t("create_template_title")}
					</DialogTitle>
				</DialogHeader>
				<FormContent />
			</DialogContent>
		</Dialog>
	);
}

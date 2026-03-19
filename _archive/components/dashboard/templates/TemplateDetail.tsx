"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardBreadcrumb } from "@/contexts/DashboardBreadcrumbContext";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Link, useRouter } from "@/i18n/routing";

interface TemplateDetailProps {
	templateId: string;
}

export function TemplateDetail({ templateId }: TemplateDetailProps) {
	const router = useRouter();
	const { isMobile } = useDevice();
	const breadcrumbContext = useDashboardBreadcrumb();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

	const tErrors = useTranslations("errors");
	const tCommon = useTranslations("common");
	const tOccasions = useTranslations("occasions");
	const tTemplateCard = useTranslations("template_card");
	const tTemplateDetail = useTranslations("template_detail");
	const tVisualStyles = useTranslations("visual_styles");

	// Fetch template from Convex
	const template = useQuery(api.templates.get, {
		templateId: templateId as Id<"templates">,
	});

	// Pass template name to breadcrumb (avoid duplicate query in DashboardNav)
	useEffect(() => {
		if (template?.name) {
			breadcrumbContext?.setTemplateName(template.name);
		}
		return () => {
			breadcrumbContext?.setTemplateName(null);
		};
	}, [template?.name, breadcrumbContext]);

	const isLoading = template === undefined;
	const hasError = template === null;

	const removeTemplate = useMutation(api.templates.remove);

	if (isLoading) {
		return (
			<div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
				<Skeleton className="h-10 w-40" />
				<div className="space-y-3 md:space-y-4">
					<Skeleton className="h-10 w-full max-w-md" />
					<div className="flex gap-2">
						<Skeleton className="h-6 w-20" />
						<Skeleton className="h-6 w-24" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (hasError || !template) {
		return (
			<div className="animate-in fade-in duration-300">
				<ErrorState
					title={tErrors("template_load_failed_title")}
					description={
						hasError
							? tErrors("template_load_error_description")
							: tErrors("template_not_found_description")
					}
					actionLabel={
						hasError ? tCommon("retry") : tCommon("back_to_templates")
					}
					onAction={
						hasError
							? () => window.location.reload()
							: () => router.push("/dashboard/templates")
					}
				/>
			</div>
		);
	}

	// Occasion/category badge color (same as project detail)
	const occasionColors: Record<string, string> = {
		wedding: "bg-pink-500/20 text-pink-300 border-pink-500/30",
		birthday: "bg-purple-500/20 text-purple-300 border-purple-500/30",
		anniversary: "bg-red-500/20 text-red-300 border-red-500/30",
		corporate_event: "bg-blue-500/20 text-blue-300 border-blue-500/30",
		baby_shower: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
		graduation: "bg-green-500/20 text-green-300 border-green-500/30",
		holiday_party: "bg-orange-500/20 text-orange-300 border-orange-500/30",
		engagement: "bg-rose-500/20 text-rose-300 border-rose-500/30",
	};

	const handleDelete = () => {
		setIsDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		setIsDeleteModalOpen(false);
		setIsDeleting(true);
		try {
			await removeTemplate({ templateId: template._id });
			toast.success(tTemplateCard("delete_success_toast"));
			router.push("/dashboard/templates");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: tTemplateCard("delete_failed_toast"),
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const config = template.config as {
		emotionalStory?: string;
		approvedNarrationScript?: string;
		validatedStory?: string;
		suggestedStyles?: string[];
		defaultScenes?: Array<{
			sceneNumber?: number;
			title?: string;
			description?: string;
			startFrameUrl?: string;
			endFrameUrl?: string;
		}>;
		defaultSettings?: {
			narrationTakes?: Array<{ audioUrl?: string }>;
			musicTakes?: Array<{ prompt?: string; audioUrl?: string }>;
			musicPrompt?: string;
			selectedNarrationTake?: number;
			selectedMusicTrack?: number;
		};
	} | null;
	const defaultScenes = config?.defaultScenes ?? [];
	const defaultSettings = config?.defaultSettings;
	const narrationTakes = defaultSettings?.narrationTakes ?? [];
	const musicTakes = defaultSettings?.musicTakes ?? [];
	const selectedNarrationTake = defaultSettings?.selectedNarrationTake ?? 0;
	const selectedMusicTrack = defaultSettings?.selectedMusicTrack ?? 0;
	const narrationTake =
		narrationTakes[selectedNarrationTake] ?? narrationTakes[0];
	const musicTake = musicTakes[selectedMusicTrack] ?? musicTakes[0];

	return (
		<div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
			{/* Page Header */}
			<div className="space-y-4">
				<Button
					variant="ghost"
					onClick={() => router.push("/dashboard/templates")}
					className={`
            text-white min-h-[44px] min-w-[44px]
            ${isMobile ? "active:bg-slate-700" : "hover:bg-slate-700"}
          `}
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					{tCommon("back_to_templates")}
				</Button>

				<div className="space-y-3 md:space-y-4">
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
						{template.name}
					</h1>

					<div className="flex flex-wrap gap-2">
						<Badge
							variant="outline"
							className={
								occasionColors[template.category] ||
								"bg-muted text-muted-foreground border-border"
							}
						>
							{tOccasions(template.category)}
						</Badge>
						<Badge variant={template.isSystem ? "default" : "secondary"}>
							{template.isSystem
								? tTemplateCard("system_badge")
								: tTemplateCard("custom_badge")}
						</Badge>
					</div>

					<div className="flex flex-wrap gap-2 md:gap-3">
						<Link href={`/guided/step-1?templateId=${template._id}`}>
							<Button
								className={`
                  min-h-[44px]
                  ${isMobile ? "active:scale-98" : "hover:scale-105"}
                  transition-transform
                `}
							>
								{tTemplateDetail("use_template_button")}
							</Button>
						</Link>
						{!template.isSystem && (
							<Button
								variant="destructive"
								onClick={handleDelete}
								disabled={isDeleting}
								className={`
                  min-h-[44px] min-w-[44px]
                  ${isMobile ? "active:scale-98" : "hover:scale-105"}
                  transition-transform
                `}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{tTemplateDetail("delete_button")}
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Template content (single scroll, no tabs) */}
			<div className="space-y-6">
				{/* Preview */}
				{template.thumbnail && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{tTemplateDetail("preview")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg bg-muted">
								{template.thumbnail.startsWith("http") ||
								template.thumbnail.includes("convex") ? (
									<video
										src={template.thumbnail}
										controls
										className="h-full w-full object-contain"
									>
										<track kind="captions" />
									</video>
								) : (
									<Image
										src={template.thumbnail}
										alt={template.name}
										width={640}
										height={360}
										className="h-full w-full object-contain"
									/>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Overview: emotionalStory (step 1 personal story); fallback to description; "Not set" when both empty */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{tTemplateDetail("overview")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
						<p>
							{config?.emotionalStory ||
								template.description ||
								tTemplateDetail("not_set")}
						</p>
					</CardContent>
				</Card>

				{/* Visual style: show translated style name (e.g. "Low Key"), not raw key (e.g. "low-key") */}
				{config?.suggestedStyles?.[0] && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{tTemplateDetail("visual_style")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Badge variant="secondary">
								{tVisualStyles(config.suggestedStyles[0])}
							</Badge>
						</CardContent>
					</Card>
				)}

				{/* Story used for the video: the full validated story from step 2 (title + narration + scenes) */}
				{config?.validatedStory && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{tTemplateDetail("story_used_for_video")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
								{config.validatedStory}
							</p>
						</CardContent>
					</Card>
				)}

				{/* Scenes & frames */}
				{defaultScenes.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{tTemplateDetail("scenes_and_frames")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
								{defaultScenes.map((scene, idx) => (
									<Card
										key={`scene-${scene.sceneNumber ?? idx}-${scene.title ?? ""}`}
									>
										<CardHeader className="pb-2">
											<CardTitle className="text-base">
												{scene.title ??
													`Scene ${(scene.sceneNumber ?? idx) + 1}`}
											</CardTitle>
											{scene.description && (
												<p className="text-xs text-muted-foreground line-clamp-2">
													{scene.description}
												</p>
											)}
										</CardHeader>
										<CardContent className="flex gap-2">
											<div className="flex-1 min-w-0 aspect-video bg-muted rounded overflow-hidden">
												{scene.startFrameUrl ? (
													<button
														type="button"
														onClick={() =>
															setPreviewImageUrl(scene.startFrameUrl ?? null)
														}
														className="w-full h-full block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded"
													>
														<Image
															src={scene.startFrameUrl}
															alt="Start frame"
															width={160}
															height={90}
															className="w-full h-full object-cover"
														/>
													</button>
												) : (
													<span className="flex items-center justify-center h-full text-xs text-muted-foreground">
														{tTemplateDetail("no_frame")}
													</span>
												)}
											</div>
											<div className="flex-1 min-w-0 aspect-video bg-muted rounded overflow-hidden">
												{scene.endFrameUrl ? (
													<button
														type="button"
														onClick={() =>
															setPreviewImageUrl(scene.endFrameUrl ?? null)
														}
														className="w-full h-full block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded"
													>
														<Image
															src={scene.endFrameUrl}
															alt="End frame"
															width={160}
															height={90}
															className="w-full h-full object-cover"
														/>
													</button>
												) : (
													<span className="flex items-center justify-center h-full text-xs text-muted-foreground">
														{tTemplateDetail("no_frame")}
													</span>
												)}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Narration */}
				{(config?.approvedNarrationScript || narrationTake?.audioUrl) && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{tTemplateDetail("narration")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{narrationTake?.audioUrl && (
								<audio
									src={narrationTake.audioUrl}
									controls
									className="w-full max-w-md"
								>
									<track kind="captions" />
								</audio>
							)}
						</CardContent>
					</Card>
				)}

				{/* Music */}
				{(defaultSettings?.musicPrompt ||
					musicTake?.prompt ||
					musicTake?.audioUrl) && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{tTemplateDetail("music")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm text-muted-foreground">
								{defaultSettings?.musicPrompt ??
									musicTake?.prompt ??
									tTemplateDetail("not_set")}
							</p>
							{musicTake?.audioUrl && (
								<audio
									src={musicTake.audioUrl}
									controls
									className="w-full max-w-md"
								>
									<track kind="captions" />
								</audio>
							)}
						</CardContent>
					</Card>
				)}

				{/* Actions again at bottom */}
				<div className="flex flex-wrap gap-2 pt-4">
					<Link href={`/guided/step-1?templateId=${template._id}`}>
						<Button className="min-h-[44px]">
							{tTemplateDetail("use_template_button")}
						</Button>
					</Link>
					{!template.isSystem && (
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
							className="min-h-[44px]"
						>
							<Trash2 className="h-4 w-4 mr-2" />
							{tTemplateDetail("delete_button")}
						</Button>
					)}
				</div>
			</div>

			{/* Full-size image preview (like project details / assets) */}
			<Dialog
				open={!!previewImageUrl}
				onOpenChange={(open) => !open && setPreviewImageUrl(null)}
			>
				<DialogContent className="bg-card border-border max-w-4xl p-0 overflow-hidden">
					<DialogHeader className="sr-only">
						<DialogTitle>{tTemplateDetail("image_preview")}</DialogTitle>
					</DialogHeader>
					{previewImageUrl && (
						<div className="relative w-full aspect-video bg-muted">
							<Image
								src={previewImageUrl}
								alt=""
								fill
								className="object-contain"
								sizes="(max-width: 896px) 100vw, 896px"
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
				<AlertDialogContent className="bg-card border-border">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{tTemplateCard("delete_confirm_title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{tTemplateCard("delete_confirm_description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{tTemplateCard("delete_confirm_cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{tTemplateCard("delete_confirm_submit")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

"use client";

import { useQuery } from "convex/react";
import { FolderOpen, Library } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (title: string, projectId: Id<"projects"> | null) => void;
	disabled?: boolean;
	/** When true, confirm button shows loading and is disabled (e.g. mutation in flight). */
	isConfirming?: boolean;
	/** Translation namespace for modal copy (default: voice). Pass "image_generator.project_selector" for image flow. */
	translationNamespace?: string;
	/** Pre-select this project when the modal opens. */
	initialProjectId?: Id<"projects">;
}

export function ProjectSelector({
	open,
	onOpenChange,
	onConfirm,
	disabled = false,
	isConfirming = false,
	translationNamespace = "voice_generator.project_selector",
	initialProjectId,
}: ProjectSelectorProps) {
	const t = useTranslations(translationNamespace);
	const tOccasions = useTranslations("occasions");
	const tStatus = useTranslations("status");
	const projects = useQuery(api.projects.list);
	const [selectedProjectId, setSelectedProjectId] =
		useState<Id<"projects"> | null>(null);
	const [title, setTitle] = useState("");

	// Reset form when modal closes (parent closes on success; user can cancel)
	useEffect(() => {
		if (!open) {
			setTitle("");
			setSelectedProjectId(null);
		}
	}, [open]);

	// Pre-select project when initialProjectId is provided and modal opens
	useEffect(() => {
		if (open && initialProjectId) {
			setSelectedProjectId(initialProjectId);
		}
	}, [open, initialProjectId]);

	const handleConfirm = () => {
		if (!title.trim()) {
			toast.error(t("name_required"));
			return;
		}
		onConfirm(title.trim(), selectedProjectId);
		// Parent closes modal on success; do not close here so isConfirming is visible
	};

	return (
		<AdaptiveModal
			isOpen={open}
			onClose={() => onOpenChange(false)}
			title={t("title")}
			description={t("description")}
		>
			{/* Title Input */}
			<div className="space-y-2">
				<Label htmlFor="recording-title" className="text-sm font-medium">
					{t("name_label")}
				</Label>
				<Input
					id="recording-title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder={t("name_placeholder")}
					disabled={disabled}
					className="min-h-[48px] text-base"
					aria-required="true"
				/>
			</div>

			<ScrollArea className="h-[60vh] max-h-[500px] min-h-[200px] pr-4">
				{/* Loading state */}
				{projects === undefined && (
					<div className="space-y-3">
						<p className="text-sm text-muted-foreground">
							{t("loading_projects")}
						</p>
						<div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton
									// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton loaders don't reorder
									key={`skeleton-${i}`}
									className="h-[140px] rounded-lg"
								/>
							))}
						</div>
					</div>
				)}

				{/* Empty state */}
				{projects?.length === 0 && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-full bg-muted p-6">
							<FolderOpen
								className="size-8 text-muted-foreground"
								aria-hidden="true"
							/>
						</div>
						<h3 className="mb-2 text-lg font-semibold leading-relaxed">
							{t("no_projects")}
						</h3>
						<p className="mb-6 text-sm text-muted-foreground max-w-sm leading-relaxed">
							{t("no_projects_hint")}
						</p>
					</div>
				)}

				{/* Content */}
				{projects && projects.length > 0 && (
					<div className="space-y-4">
						{/* "Save to Library" option */}
						<Button
							variant="outline"
							onClick={() => setSelectedProjectId(null)}
							className={cn(
								"glass-panel w-full min-h-[44px] justify-start px-4",
								selectedProjectId === null && "ring-2 ring-primary",
							)}
							disabled={disabled}
							aria-pressed={selectedProjectId === null}
						>
							<Library className="size-5 mr-2" aria-hidden="true" />
							<div className="flex flex-col items-start">
								<span className="font-medium">{t("save_to_library")}</span>
								<span className="text-xs text-muted-foreground">
									{t("save_to_library_hint")}
								</span>
							</div>
						</Button>

						{/* Projects grid */}
						<div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
							{projects.map((project) => (
								<button
									key={project._id}
									type="button"
									onClick={() => setSelectedProjectId(project._id)}
									disabled={disabled}
									aria-pressed={selectedProjectId === project._id}
									className={cn(
										"glass-panel group relative overflow-hidden rounded-lg transition-all",
										"min-h-[44px] hover:ring-2 hover:ring-primary/50",
										selectedProjectId === project._id && "ring-2 ring-primary",
										disabled && "opacity-50 cursor-not-allowed",
									)}
								>
									{/* Project thumbnail */}
									<div className="relative aspect-video bg-muted overflow-hidden">
										{project.thumbnailUrl ? (
											<Image
												src={project.thumbnailUrl}
												alt={project.name}
												fill
												className="object-cover"
												unoptimized
											/>
										) : (
											<div className="flex items-center justify-center h-full">
												<FolderOpen
													className="size-8 text-muted-foreground"
													aria-hidden="true"
												/>
											</div>
										)}
									</div>

									{/* Project info */}
									<div className="p-3 space-y-2">
										<p className="font-medium text-sm leading-relaxed truncate text-left">
											{project.name}
										</p>
										<div className="flex items-center gap-2 flex-wrap">
											<Badge variant="secondary" className="text-xs">
												{tOccasions(
													project.occasion.replace(/-/g, "_") as never,
												)}
											</Badge>
											<Badge
												variant={
													project.status === "completed" ? "default" : "outline"
												}
												className="text-xs"
											>
												{tStatus(project.status as never)}
											</Badge>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				)}
			</ScrollArea>

			<div className="flex flex-col xs:flex-row gap-2 pt-2">
				<Button
					variant="outline"
					onClick={() => onOpenChange(false)}
					disabled={disabled || isConfirming}
					className="min-h-[44px]"
				>
					{t("cancel")}
				</Button>
				<Button
					onClick={handleConfirm}
					disabled={disabled || isConfirming || !title.trim()}
					className="min-h-[44px]"
				>
					{isConfirming ? t("confirming") : t("confirm")}
				</Button>
			</div>
		</AdaptiveModal>
	);
}

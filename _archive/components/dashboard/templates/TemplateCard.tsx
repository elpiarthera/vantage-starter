"use client";

import { useMutation } from "convex/react";
import { Eye, Loader2, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
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
import { Card } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Link, useRouter } from "@/i18n/routing";

interface TemplateCardProps {
	template: Doc<"templates">;
}

function isVideoUrl(url: string | undefined): boolean {
	if (!url) return false;
	return (
		url.includes("convex") || url.endsWith(".mp4") || url.startsWith("http")
	);
}

export function TemplateCard({ template }: TemplateCardProps) {
	const { isMobile } = useDevice();
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const t = useTranslations("template_card");

	const deleteTemplate = useMutation(api.templates.remove);

	const handleConfirmDelete = async () => {
		setIsDeleting(true);
		setDeleteConfirmOpen(false);
		try {
			await deleteTemplate({ templateId: template._id });
			toast.success(t("delete_success_toast"));
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : t("delete_failed_toast"),
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Card
			className={`
      overflow-hidden transition-all
      min-h-[280px] md:min-h-[320px]
      ${isMobile ? "active:scale-[0.98]" : "hover:shadow-lg"}
    `}
		>
			{/* Thumbnail or video preview */}
			<div className="relative h-[140px] md:h-[160px] bg-muted">
				{isVideoUrl(template.thumbnail) ? (
					<video
						src={template.thumbnail ?? undefined}
						controls
						className="w-full h-full object-cover"
						onClick={(e) => e.stopPropagation()}
					>
						<track kind="captions" />
					</video>
				) : (
					<Image
						src={template.thumbnail || "/placeholder.svg?height=160&width=400"}
						alt={template.name}
						fill
						className="object-cover"
					/>
				)}
				{/* System/Custom Badge */}
				<div className="absolute top-2 right-2">
					<Badge variant={template.isSystem ? "default" : "secondary"}>
						{template.isSystem ? t("system_badge") : t("custom_badge")}
					</Badge>
				</div>
			</div>

			{/* Content */}
			<div className="p-4 space-y-3">
				{/* Title and Category */}
				<div>
					<h3 className="text-base md:text-lg font-semibold text-foreground line-clamp-1">
						{template.name}
					</h3>
					<p className="text-xs md:text-sm text-muted-foreground mt-1">
						{template.category}
					</p>
				</div>

				{/* Description */}
				<p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
					{template.description}
				</p>

				{/* Usage Count */}
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<Play className="h-3 w-3" />
					<span>{t("usage_count", { count: template.usageCount || 0 })}</span>
				</div>

				{/* Actions */}
				<div className="flex gap-2 pt-2">
					<Link
						href={`/guided/step-1?templateId=${template._id}`}
						className="flex-1"
					>
						<Button
							size={isMobile ? "default" : "sm"}
							className={`
                w-full
                min-h-[44px]
                ${isMobile ? "active:scale-95" : "hover:scale-105"}
              `}
						>
							{t("use_template_button")}
						</Button>
					</Link>

					<Button
						type="button"
						variant="outline"
						size={isMobile ? "default" : "sm"}
						className={`
              min-h-[44px] min-w-[44px]
              ${isMobile ? "active:scale-95" : "hover:scale-105"}
            `}
						onClick={() => router.push(`/dashboard/templates/${template._id}`)}
						aria-label={t("view_template_aria")}
					>
						<Eye className="h-4 w-4" />
					</Button>

					{!template.isSystem && (
						<Button
							variant="outline"
							size={isMobile ? "default" : "sm"}
							onClick={() => setDeleteConfirmOpen(true)}
							disabled={isDeleting}
							className={`
                min-h-[44px] min-w-[44px]
                ${isMobile ? "active:scale-95" : "hover:scale-105"}
              `}
						>
							{isDeleting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
						</Button>
					)}
				</div>
			</div>

			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent className="bg-[#182634] border-[#314d68]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-white">
							{t("delete_confirm_title")}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-gray-400">
							{t("delete_confirm_description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-[#314d68] text-gray-300 hover:bg-[#223649]">
							{t("delete_confirm_cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-red-600 text-white hover:bg-red-700"
						>
							{t("delete_confirm_submit")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}

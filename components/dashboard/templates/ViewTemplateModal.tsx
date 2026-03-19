"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { useDevice } from "@/contexts/DeviceContext";
import type { Doc } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/routing";

interface ViewTemplateModalProps {
	template: Doc<"templates"> | null;
	isOpen: boolean;
	onClose: () => void;
	onUseTemplate: () => void;
}

export function ViewTemplateModal({
	template,
	isOpen,
	onClose,
	onUseTemplate,
}: ViewTemplateModalProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("view_template_modal");
	const tCommon = useTranslations("common");

	if (!template) return null;

	const isVideoUrl =
		template.thumbnail &&
		(template.thumbnail.includes("convex") ||
			template.thumbnail.endsWith(".mp4") ||
			template.thumbnail.startsWith("http"));

	const content = (
		<div className="space-y-4 md:space-y-6">
			{/* Preview */}
			<div className="relative aspect-video max-h-[240px] rounded-lg overflow-hidden bg-muted">
				{isVideoUrl ? (
					<video
						src={template.thumbnail ?? undefined}
						controls
						className="w-full h-full object-contain"
					>
						<track kind="captions" />
					</video>
				) : (
					<div className="w-full h-full flex items-center justify-center text-muted-foreground">
						{t("no_preview")}
					</div>
				)}
			</div>

			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">
					{t("template_name_label")}
				</p>
				<p className="text-base font-semibold">{template.name}</p>
			</div>

			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">
					{t("category_label")}
				</p>
				<p className="text-base">{template.category || "—"}</p>
			</div>

			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">
					{t("description_label")}
				</p>
				<p className="text-sm text-muted-foreground">
					{template.description || "—"}
				</p>
			</div>

			<div className="flex flex-col-reverse md:flex-row gap-3 pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
					className="min-h-[44px] w-full md:w-auto"
				>
					{tCommon("cancel")}
				</Button>
				<Link
					href={`/guided/step-1?templateId=${template._id}`}
					className="flex-1"
					onClick={onUseTemplate}
				>
					<Button className="min-h-[44px] w-full md:w-auto">
						{t("use_template_button")}
					</Button>
				</Link>
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DrawerContent className="max-h-[90vh]">
					<DrawerHeader className="border-b border-border">
						<div className="flex items-center justify-between">
							<DrawerTitle className="text-lg">{t("title")}</DrawerTitle>
							<Button
								variant="ghost"
								size="icon"
								onClick={onClose}
								className="min-h-[44px] min-w-[44px]"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					</DrawerHeader>
					<div className="p-4 overflow-y-auto">{content}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-xl">{t("title")}</DialogTitle>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
}

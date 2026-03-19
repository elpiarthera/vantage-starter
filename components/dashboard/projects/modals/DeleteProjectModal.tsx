"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDevice } from "@/contexts/DeviceContext";

interface DeleteProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
	projectName: string;
	projectId: string;
}

export function DeleteProjectModal({
	isOpen,
	onClose,
	projectName,
	projectId,
}: DeleteProjectModalProps) {
	const { isMobile } = useDevice();
	const [confirmText, setConfirmText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);
	const t = useTranslations("delete_project_modal");

	const handleDelete = async () => {
		if (confirmText !== projectName) {
			return;
		}

		setIsDeleting(true);

		// Simulate delete operation
		console.log("[v0] Deleting project:", projectId);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		setIsDeleting(false);
		handleClose();
	};

	const handleClose = () => {
		setConfirmText("");
		onClose();
	};

	const isConfirmValid = confirmText === projectName;

	const FormContent = () => (
		<div className="space-y-4 md:space-y-6">
			{/* Warning */}
			<div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
				<AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
				<div className="space-y-1">
					<p className="text-sm font-medium text-destructive">
						{t("warning_title")}
					</p>
					<p className="text-xs text-muted-foreground">
						{t("warning_description")}
					</p>
				</div>
			</div>

			{/* Confirmation Input */}
			<div className="space-y-2">
				<Label htmlFor="confirm" className="text-sm md:text-base">
					{t("confirmation_label", { projectName: projectName })}
				</Label>
				<Input
					id="confirm"
					value={confirmText}
					onChange={(e) => setConfirmText(e.target.value)}
					placeholder={projectName}
					className="min-h-[48px]"
				/>
			</div>

			{/* Actions */}
			<div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={handleClose}
					disabled={isDeleting}
					className="min-h-[44px] w-full md:w-auto bg-transparent"
				>
					Cancel
				</Button>
				<Button
					type="button"
					variant="destructive"
					onClick={handleDelete}
					disabled={!isConfirmValid || isDeleting}
					className="min-h-[44px] w-full md:flex-1"
				>
					{isDeleting ? t("deleting_button") : t("delete_button")}
				</Button>
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={handleClose}>
				<DrawerContent>
					<DrawerHeader className="text-left">
						<DrawerTitle>{t("delete_project_title")}</DrawerTitle>
						<DrawerDescription>
							{t("delete_project_description")}
						</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-6">
						<FormContent />
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{t("delete_project_title")}</DialogTitle>
					<DialogDescription>
						{t("delete_project_description")}
					</DialogDescription>
				</DialogHeader>
				<FormContent />
			</DialogContent>
		</Dialog>
	);
}

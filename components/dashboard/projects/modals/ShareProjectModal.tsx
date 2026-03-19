"use client";

import { Check, Copy, LinkIcon } from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDevice } from "@/contexts/DeviceContext";

interface ShareProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
	projectName: string;
	projectId: string;
}

export function ShareProjectModal({
	isOpen,
	onClose,
	projectName,
	projectId,
}: ShareProjectModalProps) {
	const { isMobile } = useDevice();
	const [formData, setFormData] = useState({
		accessLevel: "view",
		expiration: "7days",
		requirePassword: false,
		password: "",
	});
	const [shareLink, setShareLink] = useState("");
	const [copied, setCopied] = useState(false);
	const t = useTranslations("share_project_modal");
	const tCommon = useTranslations("common");

	const accessLevels = [
		{ value: "view", label: t("access_level_view_only") },
		{ value: "comment", label: t("access_level_view_comment") },
		{ value: "edit", label: t("access_level_view_edit") },
	];

	const expirationOptions = [
		{ value: "1hour", label: t("expiration_1_hour") },
		{ value: "24hours", label: t("expiration_24_hours") },
		{ value: "7days", label: t("expiration_7_days") },
		{ value: "30days", label: t("expiration_30_days") },
		{ value: "never", label: t("expiration_never") },
	];

	const handleCreateLink = () => {
		// Generate shareable link
		const baseUrl = window.location.origin;
		const linkId = Math.random().toString(36).substring(7);
		const link = `${baseUrl}/shared/${projectId}/${linkId}`;
		setShareLink(link);
		console.log("[v0] Created share link:", { link, settings: formData });
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareLink);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("[v0] Failed to copy link:", err);
		}
	};

	const handleClose = () => {
		setFormData({
			accessLevel: "view",
			expiration: "7days",
			requirePassword: false,
			password: "",
		});
		setShareLink("");
		setCopied(false);
		onClose();
	};

	const FormContent = () => (
		<div className="space-y-4 md:space-y-6">
			{/* Access Level */}
			<div className="space-y-2">
				<Label htmlFor="accessLevel" className="text-sm md:text-base">
					{t("access_level_label")}
				</Label>
				<Select
					value={formData.accessLevel}
					onValueChange={(value) =>
						setFormData({ ...formData, accessLevel: value })
					}
				>
					<SelectTrigger id="accessLevel" className="min-h-[48px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{accessLevels.map((level) => (
							<SelectItem key={level.value} value={level.value}>
								{level.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Expiration */}
			<div className="space-y-2">
				<Label htmlFor="expiration" className="text-sm md:text-base">
					{t("link_expiration_label")}
				</Label>
				<Select
					value={formData.expiration}
					onValueChange={(value) =>
						setFormData({ ...formData, expiration: value })
					}
				>
					<SelectTrigger id="expiration" className="min-h-[48px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{expirationOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Password Protection */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label htmlFor="requirePassword" className="text-sm md:text-base">
						{t("require_password_label")}
					</Label>
					<Switch
						id="requirePassword"
						checked={formData.requirePassword}
						onCheckedChange={(checked) =>
							setFormData({ ...formData, requirePassword: checked })
						}
					/>
				</div>

				{formData.requirePassword && (
					<Input
						type="password"
						value={formData.password}
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
						placeholder={t("enter_password_placeholder")}
						className="min-h-[48px]"
					/>
				)}
			</div>

			{/* Share Link Display */}
			{shareLink && (
				<div className="space-y-2">
					<Label className="text-sm md:text-base">
						{t("shareable_link_label")}
					</Label>
					<div className="flex gap-2">
						<Input value={shareLink} readOnly className="min-h-[48px] flex-1" />
						<Button
							type="button"
							variant="outline"
							onClick={handleCopyLink}
							className="min-h-[48px] min-w-[48px] px-3 bg-transparent"
						>
							{copied ? (
								<Check className="h-4 w-4" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={handleClose}
					className="min-h-[44px] w-full md:w-auto bg-transparent"
				>
					{shareLink ? tCommon("close") : tCommon("cancel")}
				</Button>
				{!shareLink ? (
					<Button
						type="button"
						onClick={handleCreateLink}
						className="min-h-[44px] w-full md:flex-1"
					>
						<LinkIcon className="h-4 w-4 mr-2" />
						{t("create_link_button")}
					</Button>
				) : (
					<Button
						type="button"
						onClick={handleCopyLink}
						className="min-h-[44px] w-full md:flex-1"
					>
						{copied ? (
							<>
								<Check className="h-4 w-4 mr-2" />
								{t("copied_text")}
							</>
						) : (
							<>
								<Copy className="h-4 w-4 mr-2" />
								{t("copy_link_button")}
							</>
						)}
					</Button>
				)}
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={handleClose}>
				<DrawerContent>
					<DrawerHeader className="text-left">
						<DrawerTitle>{t("share_project_title")}</DrawerTitle>
						<DrawerDescription>
							{t("share_project_description", { projectName: projectName })}
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
					<DialogTitle>{t("share_project_title")}</DialogTitle>
					<DialogDescription>
						{t("share_project_description", { projectName: projectName })}
					</DialogDescription>
				</DialogHeader>
				<FormContent />
			</DialogContent>
		</Dialog>
	);
}

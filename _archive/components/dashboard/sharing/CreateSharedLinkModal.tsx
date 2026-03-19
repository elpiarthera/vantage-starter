"use client";

import { useTranslations } from "next-intl";
import type React from "react";
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

interface CreateSharedLinkModalProps {
	projectId: string;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (linkData: {
		accessLevel: "view" | "comment" | "edit";
		expiresAt: number | null;
		password: string | null;
	}) => void;
}

export function CreateSharedLinkModal({
	projectId: _projectId,
	isOpen,
	onClose,
	onConfirm,
}: CreateSharedLinkModalProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("create_shared_link_modal");
	const tShareProjectModal = useTranslations("share_project_modal"); // Reuse keys from ShareProjectModal
	const tCommon = useTranslations("common");
	const [accessLevel, setAccessLevel] = useState<"view" | "comment" | "edit">(
		"view",
	);
	const [hasExpiration, setHasExpiration] = useState(false);
	const [expirationDays, setExpirationDays] = useState("7");
	const [hasPassword, setHasPassword] = useState(false);
	const [password, setPassword] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const expiresAt = hasExpiration
			? Date.now() + Number.parseInt(expirationDays, 10) * 24 * 60 * 60 * 1000
			: null;

		onConfirm({
			accessLevel,
			expiresAt,
			password: hasPassword ? password : null,
		});

		// Reset form
		setAccessLevel("view");
		setHasExpiration(false);
		setExpirationDays("7");
		setHasPassword(false);
		setPassword("");
	};

	const content = (
		<form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
			{/* Access Level */}
			<div className="space-y-2">
				<Label htmlFor="accessLevel" className="text-white">
					{tShareProjectModal("access_level_label")}
				</Label>
				<Select
					value={accessLevel}
					onValueChange={(value: "view" | "comment" | "edit") =>
						setAccessLevel(value)
					}
				>
					<SelectTrigger
						id="accessLevel"
						className="min-h-[48px] bg-slate-800 border-slate-700 text-white"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="view">
							{tShareProjectModal("access_level_view_only")}
						</SelectItem>
						<SelectItem value="comment">
							{tShareProjectModal("access_level_view_comment")}
						</SelectItem>
						<SelectItem value="edit">
							{tShareProjectModal("access_level_view_edit")}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Expiration */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label htmlFor="expiration" className="text-white">
						{tShareProjectModal("link_expiration_label")}
					</Label>
					<Switch
						id="expiration"
						checked={hasExpiration}
						onCheckedChange={setHasExpiration}
					/>
				</div>
				{hasExpiration && (
					<Select value={expirationDays} onValueChange={setExpirationDays}>
						<SelectTrigger className="min-h-[48px] bg-slate-800 border-slate-700 text-white">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1">
								{tShareProjectModal("expiration_1_day")}
							</SelectItem>
							<SelectItem value="7">
								{tShareProjectModal("expiration_7_days")}
							</SelectItem>
							<SelectItem value="30">
								{tShareProjectModal("expiration_30_days")}
							</SelectItem>
							<SelectItem value="90">
								{tShareProjectModal("expiration_90_days")}
							</SelectItem>
						</SelectContent>
					</Select>
				)}
			</div>

			{/* Password Protection */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label htmlFor="password-protection" className="text-white">
						{tShareProjectModal("require_password_label")}
					</Label>
					<Switch
						id="password-protection"
						checked={hasPassword}
						onCheckedChange={setHasPassword}
					/>
				</div>
				{hasPassword && (
					<Input
						type="password"
						placeholder={tShareProjectModal("enter_password_placeholder")}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="min-h-[48px] bg-slate-800 border-slate-700 text-white"
						required={hasPassword}
					/>
				)}
			</div>

			{/* Actions */}
			<div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
					className={`
            min-h-[44px] w-full sm:w-auto
            ${isMobile ? "active:bg-slate-700" : "hover:bg-slate-700"}
          `}
				>
					{tCommon("cancel")}
				</Button>
				<Button
					type="submit"
					className={`
            min-h-[44px] w-full sm:w-auto
            bg-[#0d7ff2] hover:bg-[#0b6fd4] text-white
            ${isMobile ? "active:scale-98" : "hover:scale-105"}
            transition-transform
          `}
				>
					{tShareProjectModal("create_link_button")}
				</Button>
			</div>
		</form>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={onClose}>
				<DrawerContent className="bg-slate-900 border-slate-800">
					<DrawerHeader className="text-left">
						<DrawerTitle className="text-white">
							{tShareProjectModal("share_project_title")}
						</DrawerTitle>
						<DrawerDescription className="text-gray-400">
							{t("configure_access_description")}
						</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-4">{content}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="text-white">
						{tShareProjectModal("share_project_title")}
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						{t("configure_access_description")}
					</DialogDescription>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
}

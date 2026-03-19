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
import { useDevice } from "@/contexts/DeviceContext";
import { useRouter } from "@/i18n/routing";

interface CreateProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateProjectModal({
	isOpen,
	onClose,
}: CreateProjectModalProps) {
	const router = useRouter();
	const { isMobile } = useDevice();
	const t = useTranslations("create_project_modal");
	const tOccasions = useTranslations("occasions");
	const tThemes = useTranslations("themes");
	const [formData, setFormData] = useState({
		name: "",
		occasion: "",
		theme: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const occasions = [
		"wedding",
		"birthday",
		"anniversary",
		"business",
		"baby_shower",
		"other",
	];
	const themes = [
		"romantic_garden",
		"tropical_paradise",
		"modern_professional",
		"elegant_romance",
		"sweet_dreams",
		"vintage_classic",
		"minimalist",
		"bohemian",
	];

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = t("validation.name_required");
		} else if (formData.name.length < 3) {
			newErrors.name = t("validation.name_min_length");
		} else if (formData.name.length > 100) {
			newErrors.name = t("validation.name_max_length");
		}

		if (!formData.occasion) {
			newErrors.occasion = t("validation.occasion_required");
		}

		if (!formData.theme) {
			newErrors.theme = t("validation.theme_required");
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		// Create project and navigate to guided flow
		console.log("[v0] Creating project:", formData);
		router.push(
			`/guided/step-1?name=${encodeURIComponent(formData.name)}&occasion=${encodeURIComponent(formData.occasion)}&theme=${encodeURIComponent(formData.theme)}`,
		);
		onClose();
	};

	const handleClose = () => {
		setFormData({ name: "", occasion: "", theme: "" });
		setErrors({});
		onClose();
	};

	const FormContent = () => (
		<form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
			{/* Project Name */}
			<div className="space-y-2">
				<Label htmlFor="name" className="text-sm md:text-base">
					{t("project_name_label")} *
				</Label>
				<Input
					id="name"
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					placeholder={t("project_name_placeholder")}
					className="min-h-[48px]"
				/>
				{errors.name && (
					<p className="text-xs text-destructive">{errors.name}</p>
				)}
			</div>

			{/* Occasion */}
			<div className="space-y-2">
				<Label htmlFor="occasion" className="text-sm md:text-base">
					{t("occasion_label")} *
				</Label>
				<Select
					value={formData.occasion}
					onValueChange={(value) =>
						setFormData({ ...formData, occasion: value })
					}
				>
					<SelectTrigger id="occasion" className="min-h-[48px]">
						<SelectValue placeholder={t("select_occasion_placeholder")} />
					</SelectTrigger>
					<SelectContent>
						{occasions.map((occasion) => (
							<SelectItem key={occasion} value={occasion}>
								{tOccasions(occasion)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errors.occasion && (
					<p className="text-xs text-destructive">{errors.occasion}</p>
				)}
			</div>

			{/* Theme */}
			<div className="space-y-2">
				<Label htmlFor="theme" className="text-sm md:text-base">
					{t("theme_label")} *
				</Label>
				<Select
					value={formData.theme}
					onValueChange={(value) => setFormData({ ...formData, theme: value })}
				>
					<SelectTrigger id="theme" className="min-h-[48px]">
						<SelectValue placeholder={t("select_theme_placeholder")} />
					</SelectTrigger>
					<SelectContent>
						{themes.map((theme) => (
							<SelectItem key={theme} value={theme}>
								{tThemes(theme)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errors.theme && (
					<p className="text-xs text-destructive">{errors.theme}</p>
				)}
			</div>

			{/* Actions */}
			<div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={handleClose}
					className="min-h-[44px] w-full md:w-auto bg-transparent"
				>
					Cancel
				</Button>
				<Button type="submit" className="min-h-[44px] w-full md:flex-1">
					{t("create_project_button")}
				</Button>
			</div>
		</form>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={handleClose}>
				<DrawerContent>
					<DrawerHeader className="text-left">
						<DrawerTitle>{t("create_new_project_title")}</DrawerTitle>
						<DrawerDescription>
							{t("create_new_project_description")}
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
					<DialogTitle>{t("create_new_project_title")}</DialogTitle>
					<DialogDescription>
						{t("create_new_project_description")}
					</DialogDescription>
				</DialogHeader>
				<FormContent />
			</DialogContent>
		</Dialog>
	);
}

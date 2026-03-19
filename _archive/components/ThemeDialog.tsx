"use client";

import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Doc } from "@/convex/_generated/dataModel";

interface ThemeDialogProps {
	open: boolean;
	theme: Doc<"toolThemes"> | null;
	onClose: () => void;
	onSave: (data: {
		key: string;
		name: string;
		nameTranslationKey: string;
		description?: string;
		descriptionTranslationKey?: string;
		color?: string;
		sortOrder: number;
		imageUrl?: string;
		isActive: boolean;
	}) => void;
}

export function ThemeDialog({
	open,
	theme,
	onClose,
	onSave,
}: ThemeDialogProps) {
	const t = useTranslations("admin.themes.dialog");
	const [formData, setFormData] = useState({
		key: "",
		name: "",
		nameTranslationKey: "",
		description: "",
		descriptionTranslationKey: "",
		color: "",
		imageUrl: "",
		sortOrder: 1,
		isActive: true,
	});

	useEffect(() => {
		if (theme) {
			setFormData({
				key: theme.key,
				name: theme.name,
				nameTranslationKey: theme.nameTranslationKey,
				description: theme.description || "",
				descriptionTranslationKey: theme.descriptionTranslationKey || "",
				color: theme.color || "",
				imageUrl: theme.imageUrl || "",
				sortOrder: theme.sortOrder,
				isActive: theme.isActive,
			});
		} else {
			setFormData({
				key: "",
				name: "",
				nameTranslationKey: "",
				description: "",
				descriptionTranslationKey: "",
				color: "",
				imageUrl: "",
				sortOrder: 1,
				isActive: true,
			});
		}
	}, [theme]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave({
			...formData,
			color: formData.color || undefined,
			imageUrl: formData.imageUrl || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="w-full h-[100dvh] max-w-full top-0 left-0 translate-x-0 translate-y-0 rounded-none border-0 p-0 flex flex-col sm:max-w-full sm:h-[100dvh] sm:top-0 sm:left-0 sm:translate-x-0 sm:translate-y-0 sm:rounded-none sm:border-0 lg:top-[50%] lg:left-[50%] lg:translate-x-[-50%] lg:translate-y-[-50%] lg:h-auto lg:max-w-[720px] lg:max-h-[90vh] lg:rounded-lg lg:border lg:p-6">
				<div className="px-6 pt-6 lg:p-0 flex-shrink-0">
					<DialogHeader>
						<DialogTitle>
							{theme ? t("edit_title") : t("create_title")}
						</DialogTitle>
						<DialogDescription>
							{theme ? t("edit_description") : t("create_description")}
						</DialogDescription>
					</DialogHeader>
				</div>

				<form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
					<div className="space-y-6 py-6 px-6 lg:px-0 flex-1 overflow-y-auto">
						<div className="space-y-2">
							<Label htmlFor="key">{t("fields.key")}</Label>
							<Input
								id="key"
								value={formData.key}
								onChange={(e) =>
									setFormData({ ...formData, key: e.target.value })
								}
								placeholder={t("placeholders.key")}
								disabled={Boolean(theme)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">{t("fields.name")}</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder={t("placeholders.name")}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="nameTranslationKey">
								{t("fields.name_translation_key")}
							</Label>
							<Input
								id="nameTranslationKey"
								value={formData.nameTranslationKey}
								onChange={(e) =>
									setFormData({
										...formData,
										nameTranslationKey: e.target.value,
									})
								}
								placeholder={t("placeholders.name_translation_key")}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">{t("fields.description")}</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder={t("placeholders.description")}
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="descriptionTranslationKey">
								{t("fields.description_translation_key")}
							</Label>
							<Input
								id="descriptionTranslationKey"
								value={formData.descriptionTranslationKey}
								onChange={(e) =>
									setFormData({
										...formData,
										descriptionTranslationKey: e.target.value,
									})
								}
								placeholder={t("placeholders.description_translation_key")}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="color">{t("fields.color")}</Label>
							<Input
								id="color"
								value={formData.color}
								onChange={(e) =>
									setFormData({ ...formData, color: e.target.value })
								}
								placeholder={t("placeholders.color")}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="imageUrl">{t("fields.image_url")}</Label>
							<Input
								id="imageUrl"
								value={formData.imageUrl}
								onChange={(e) =>
									setFormData({ ...formData, imageUrl: e.target.value })
								}
								placeholder={t("placeholders.image_url")}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="sortOrder">{t("fields.sort_order")}</Label>
							<Input
								id="sortOrder"
								type="number"
								min="0"
								value={formData.sortOrder}
								onChange={(e) =>
									setFormData({
										...formData,
										sortOrder: Number.parseInt(e.target.value || "0", 10),
									})
								}
								required
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>{t("fields.active_status")}</Label>
								<p className="text-sm text-muted-foreground">
									{t("fields.active_hint")}
								</p>
							</div>
							<Switch
								checked={formData.isActive}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, isActive: checked })
								}
							/>
						</div>
					</div>

					<DialogFooter className="px-6 pb-6 lg:px-0 lg:pb-0 border-t lg:border-t-0 pt-4 lg:pt-0 flex-shrink-0 bg-background">
						<Button type="button" variant="outline" onClick={onClose}>
							{t("actions.cancel")}
						</Button>
						<Button type="submit">
							{theme ? t("actions.save") : t("actions.create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

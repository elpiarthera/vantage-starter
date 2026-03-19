"use client";

import { Upload } from "lucide-react";
import Image from "next/image";
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
import { MultiWallSelector } from "./multi-wall-selector";

type AdTarget = {
	level: "tool" | "category" | "subcategory";
	contextId?: string;
};

interface Ad {
	id: string;
	title: string;
	baseline: string;
	imageUrl?: string;
	linkUrl?: string;
	targets?: AdTarget[];
	order: number;
	isActive: boolean;
}

interface AdDialogProps {
	open: boolean;
	ad: Ad | null;
	onClose: () => void;
	onSave: (data: {
		title: string;
		baseline: string;
		imageUrl?: string;
		linkUrl?: string;
		targets: AdTarget[];
		order: number;
		isActive: boolean;
	}) => void;
}

export function AdDialog({ open, ad, onClose, onSave }: AdDialogProps) {
	const t = useTranslations("admin.ads");
	const [formData, setFormData] = useState({
		title: "",
		baseline: "",
		imageUrl: "",
		linkUrl: "",
		order: 1,
		isActive: true,
		targets: [] as AdTarget[],
	});

	useEffect(() => {
		if (ad) {
			setFormData({
				title: ad.title,
				baseline: ad.baseline,
				imageUrl: ad.imageUrl || "",
				linkUrl: ad.linkUrl || "",
				order: ad.order,
				isActive: ad.isActive,
				targets: (ad.targets || []) as AdTarget[],
			});
		} else {
			setFormData({
				title: "",
				baseline: "",
				imageUrl: "",
				linkUrl: "",
				order: 1,
				isActive: true,
				targets: [],
			});
		}
	}, [ad]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave({
			title: formData.title,
			baseline: formData.baseline,
			imageUrl: formData.imageUrl || undefined,
			linkUrl: formData.linkUrl || undefined,
			targets: formData.targets,
			order: formData.order,
			isActive: formData.isActive,
		});
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// In production, upload to blob storage
			// For now, use a placeholder
			const mockUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(formData.title || "ad")}`;
			setFormData({ ...formData, imageUrl: mockUrl });
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="w-full h-[100dvh] max-w-full top-0 left-0 translate-x-0 translate-y-0 rounded-none border-0 p-0 flex flex-col sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-auto sm:max-w-[600px] sm:max-h-[90vh] sm:rounded-lg sm:border sm:p-6">
				<div className="px-6 pt-6 sm:p-0 flex-shrink-0">
					<DialogHeader>
						<DialogTitle>
							{ad ? t("dialog.edit_title") : t("dialog.create_title")}
						</DialogTitle>
						<DialogDescription>
							{ad
								? t("dialog.edit_description")
								: t("dialog.create_description")}
						</DialogDescription>
					</DialogHeader>
				</div>

				<form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
					<div className="space-y-6 py-6 px-6 sm:px-0 flex-1 overflow-y-auto">
						{/* Image Upload */}
						<div className="space-y-2">
							<Label>Ad Image</Label>
							{formData.imageUrl ? (
								<div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
									<Image
										src={formData.imageUrl || "/placeholder.svg"}
										alt="Ad"
										fill
										className="object-cover"
									/>
									<button
										type="button"
										onClick={() => setFormData({ ...formData, imageUrl: "" })}
										className="absolute top-2 right-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-sm rounded-lg hover:bg-black/80 transition-colors"
									>
										Change
									</button>
								</div>
							) : (
								<label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
									<Upload className="w-8 h-8 text-muted-foreground mb-2" />
									<span className="text-sm text-muted-foreground">
										Click to upload image
									</span>
									<input
										type="file"
										accept="image/*"
										onChange={handleImageUpload}
										className="hidden"
									/>
								</label>
							)}
						</div>

						{/* Title */}
						<div className="space-y-2">
							<Label htmlFor="title">Ad Title</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								placeholder="e.g., Spring Collection"
								required
							/>
						</div>

						{/* Baseline */}
						<div className="space-y-2">
							<Label htmlFor="baseline">Baseline</Label>
							<Textarea
								id="baseline"
								value={formData.baseline}
								onChange={(e) =>
									setFormData({ ...formData, baseline: e.target.value })
								}
								placeholder="e.g., Discover our new arrivals"
								rows={3}
								required
							/>
						</div>

						{/* Link URL */}
						<div className="space-y-2">
							<Label htmlFor="linkUrl">Link URL (Optional)</Label>
							<Input
								id="linkUrl"
								type="url"
								value={formData.linkUrl}
								onChange={(e) =>
									setFormData({ ...formData, linkUrl: e.target.value })
								}
								placeholder="e.g., /collections/spring-2024"
							/>
							<p className="text-xs text-muted-foreground">
								Where should users go when they click this ad?
							</p>
						</div>

						<MultiWallSelector
							selectedTargets={formData.targets}
							onChange={(targets) => setFormData({ ...formData, targets })}
						/>

						{/* Order */}
						<div className="space-y-2">
							<Label htmlFor="order">Display Order</Label>
							<Input
								id="order"
								type="number"
								min="1"
								value={formData.order}
								onChange={(e) =>
									setFormData({
										...formData,
										order: Number.parseInt(e.target.value, 10),
									})
								}
								required
							/>
						</div>

						{/* Active Toggle */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Active Status</Label>
								<p className="text-sm text-muted-foreground">
									Make this ad visible in the store
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

					<DialogFooter className="px-6 pb-6 sm:px-0 sm:pb-0 border-t sm:border-t-0 pt-4 sm:pt-0 flex-shrink-0 bg-background">
						<Button type="button" variant="outline" onClick={onClose}>
							{t("actions.cancel")}
						</Button>
						<Button type="submit">
							{ad ? t("actions.save") : t("actions.add")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

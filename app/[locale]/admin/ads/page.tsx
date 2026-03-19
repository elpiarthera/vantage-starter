"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdDialog } from "@/components/admin/ad-dialog";
import { AdList } from "@/components/admin/ad-list";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// Adapter type to match the component's expected shape
type AdapterAd = {
	id: string;
	_id: Id<"ads">;
	title: string;
	baseline: string;
	imageUrl?: string;
	linkUrl?: string;
	targets: Array<{
		level: "tool" | "category" | "subcategory";
		contextId?: string;
	}>;
	order: number;
	isActive: boolean;
	createdAt: number;
	updatedAt: number;
};

function toAdapterAd(doc: Doc<"ads">): AdapterAd {
	return {
		id: doc._id,
		_id: doc._id,
		title: doc.title,
		baseline: doc.baseline,
		imageUrl: doc.imageUrl,
		linkUrl: doc.linkUrl,
		targets: doc.targets,
		order: doc.sortOrder,
		isActive: doc.isActive,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
	};
}

export default function AdsPage() {
	const t = useTranslations("admin.ads");
	const adsData = useQuery(api.tools.getAllAds);
	const createAd = useMutation(api.tools.createAd);
	const updateAd = useMutation(api.tools.updateAd);
	const deleteAd = useMutation(api.tools.deleteAd);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingAd, setEditingAd] = useState<AdapterAd | null>(null);

	const ads = (adsData || []).map(toAdapterAd);

	const handleCreate = () => {
		setEditingAd(null);
		setIsDialogOpen(true);
	};

	const handleEdit = (ad: { id: string; [key: string]: unknown }) => {
		// Find the full ad from our ads array
		const fullAd = ads.find((a) => a.id === ad.id);
		if (fullAd) {
			setEditingAd(fullAd);
			setIsDialogOpen(true);
		}
	};

	const handleSave = async (data: {
		title: string;
		baseline: string;
		imageUrl?: string;
		linkUrl?: string;
		targets: Array<{
			level: "tool" | "category" | "subcategory";
			contextId?: string;
		}>;
		order: number;
		isActive: boolean;
	}) => {
		if (editingAd) {
			await updateAd({
				adId: editingAd._id,
				updates: {
					title: data.title,
					baseline: data.baseline,
					imageUrl: data.imageUrl,
					linkUrl: data.linkUrl,
					targets: data.targets,
					sortOrder: data.order,
					isActive: data.isActive,
				},
			});
		} else {
			await createAd({
				title: data.title,
				baseline: data.baseline,
				imageUrl: data.imageUrl,
				linkUrl: data.linkUrl,
				targets: data.targets,
				sortOrder: data.order,
				isActive: data.isActive,
			});
		}
		setIsDialogOpen(false);
		setEditingAd(null);
	};

	const handleDelete = async (id: string) => {
		if (confirm(t("confirm_delete"))) {
			await deleteAd({ adId: id as Id<"ads"> });
		}
	};

	const handleToggleActive = async (id: string, isActive: boolean) => {
		await updateAd({ adId: id as Id<"ads">, updates: { isActive } });
	};

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title={t("title")}
				description={t("description")}
				action={{ label: t("actions.add"), onClick: handleCreate }}
			/>

			<div className="flex-1 overflow-auto">
				<AdList
					ads={ads}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onToggleActive={handleToggleActive}
					onCreate={handleCreate}
				/>
			</div>

			<AdDialog
				open={isDialogOpen}
				ad={editingAd}
				onClose={() => {
					setIsDialogOpen(false);
					setEditingAd(null);
				}}
				onSave={handleSave}
			/>
		</div>
	);
}

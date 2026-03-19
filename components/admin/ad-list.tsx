"use client";

import {
	Edit,
	ExternalLink,
	Eye,
	EyeOff,
	ImageIcon,
	Target,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";

// Generic ad type that works with both mock and Convex data
interface Ad {
	id: string;
	title: string;
	baseline: string;
	imageUrl?: string;
	linkUrl?: string;
	targets?: Array<{ level: string; contextId?: string }>;
	order: number;
	isActive: boolean;
	[key: string]: unknown; // Allow additional properties
}

interface AdListProps {
	ads: Ad[];
	onEdit: (ad: Ad) => void;
	onDelete: (id: string) => void;
	onToggleActive: (id: string, isActive: boolean) => void;
	onCreate?: () => void;
}

export function AdList({
	ads,
	onEdit,
	onDelete,
	onToggleActive,
	onCreate,
}: AdListProps) {
	const t = useTranslations("admin.ads");

	if (ads.length === 0) {
		return (
			<EmptyState
				icon={ImageIcon}
				title={t("empty_title")}
				description={t("empty_description")}
				action={{ label: t("actions.add"), onClick: onCreate ?? (() => {}) }}
			/>
		);
	}

	return (
		<div className="p-8">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{ads.map((ad) => (
					<div
						key={ad.id}
						className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
					>
						{/* Ad Image */}
						<div className="relative aspect-[4/3] bg-muted overflow-hidden">
							<Image
								src={ad.imageUrl || "/placeholder.svg"}
								alt={ad.title}
								fill
								className="object-cover group-hover:scale-105 transition-transform duration-300"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

							{/* Status Badge */}
							<div className="absolute top-3 right-3">
								<Badge
									variant={ad.isActive ? "default" : "secondary"}
									className="backdrop-blur-sm"
								>
									{ad.isActive ? "Active" : "Inactive"}
								</Badge>
							</div>

							{/* Order Badge */}
							<div className="absolute top-3 left-3">
								<Badge
									variant="outline"
									className="backdrop-blur-sm bg-black/40 border-white/20 text-white"
								>
									Order: {ad.order}
								</Badge>
							</div>

							{/* Link Badge */}
							{ad.linkUrl && (
								<div className="absolute bottom-3 right-3">
									<Badge
										variant="outline"
										className="backdrop-blur-sm bg-black/40 border-white/20 text-white gap-1"
									>
										<ExternalLink className="w-3 h-3" />
										Has Link
									</Badge>
								</div>
							)}
						</div>

						{/* Ad Content */}
						<div className="p-4">
							<h3 className="text-lg font-semibold text-foreground mb-1">
								{ad.title}
							</h3>
							<p className="text-sm text-muted-foreground line-clamp-2">
								{ad.baseline}
							</p>
							{ad.linkUrl && (
								<p className="text-xs text-muted-foreground mt-2 truncate">
									<ExternalLink className="w-3 h-3 inline mr-1" />
									{ad.linkUrl}
								</p>
							)}

							<div className="flex items-center gap-1 mt-3">
								<Target className="w-3 h-3 text-muted-foreground" />
								<p className="text-xs text-muted-foreground">
									{ad.targets?.length || 0} wall
									{ad.targets?.length !== 1 ? "s" : ""} targeted
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onToggleActive(ad.id, !ad.isActive)}
									className="flex-1 gap-2"
								>
									{ad.isActive ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
									{ad.isActive ? "Deactivate" : "Activate"}
								</Button>
								<Button variant="ghost" size="sm" onClick={() => onEdit(ad)}>
									<Edit className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDelete(ad.id)}
								>
									<Trash2 className="w-4 h-4 text-destructive" />
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

"use client";

import { Edit, Eye, EyeOff, Palette, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";

interface ThemeListProps {
	themes: Doc<"toolThemes">[];
	onEdit: (theme: Doc<"toolThemes">) => void;
	onDelete: (id: Doc<"toolThemes">["_id"]) => void;
	onToggleActive: (id: Doc<"toolThemes">["_id"], isActive: boolean) => void;
	onCreate?: () => void;
}

export function ThemeList({
	themes,
	onEdit,
	onDelete,
	onToggleActive,
	onCreate,
}: ThemeListProps) {
	const t = useTranslations("admin");

	if (themes.length === 0) {
		return (
			<EmptyState
				icon={Palette}
				title={t("themes.empty_title")}
				description={t("themes.empty_description")}
				action={{
					label: t("themes.empty_action"),
					onClick: onCreate ?? (() => {}),
				}}
			/>
		);
	}

	return (
		<div className="p-8">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{themes.map((theme) => (
					<div
						key={theme._id}
						className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
					>
						<div className="relative aspect-[4/3] bg-muted overflow-hidden">
							<Image
								src={theme.imageUrl || "/placeholder.svg"}
								alt={theme.name}
								fill
								className="object-cover group-hover:scale-105 transition-transform duration-300"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

							<div className="absolute top-3 right-3">
								<Badge
									variant={theme.isActive ? "default" : "secondary"}
									className="backdrop-blur-sm"
								>
									{theme.isActive ? t("status.active") : t("status.inactive")}
								</Badge>
							</div>

							<div className="absolute bottom-3 left-3">
								<Badge
									variant="outline"
									className="backdrop-blur-sm bg-black/40 border-white/20 text-white"
								>
									{t("labels.order", { order: theme.sortOrder })}
								</Badge>
							</div>
						</div>

						<div className="p-4">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold text-foreground mb-1">
									{theme.name}
								</h3>
								{theme.color && (
									<span
										className="inline-flex h-3 w-3 rounded-full border border-border"
										style={{ backgroundColor: theme.color }}
									/>
								)}
							</div>
							<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
								{theme.description || t("labels.no_description")}
							</p>

							<div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onToggleActive(theme._id, !theme.isActive)}
									className="flex-1 gap-2"
								>
									{theme.isActive ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
									{theme.isActive
										? t("actions.deactivate")
										: t("actions.activate")}
								</Button>
								<Button variant="ghost" size="sm" onClick={() => onEdit(theme)}>
									<Edit className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDelete(theme._id)}
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

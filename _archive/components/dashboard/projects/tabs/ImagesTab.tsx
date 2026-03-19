"use client";

import { useQuery } from "convex/react";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/routing";

interface ImagesTabProps {
	projectId: string;
}

export function ImagesTab({ projectId }: ImagesTabProps) {
	const t = useTranslations("images_tab");
	const projectIdTyped = projectId as Id<"projects">;

	const images = useQuery(api.imageToolHistory.getProjectImages, {
		projectId: projectIdTyped,
	});

	const isLoading = images === undefined;

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton
							// biome-ignore lint/suspicious/noArrayIndexKey: static list
							key={i}
							className="aspect-square rounded-lg"
						/>
					))}
				</div>
			</div>
		);
	}

	if (!images || images.length === 0) {
		return (
			<EmptyState
				icon="image"
				title={t("empty_title")}
				description={t("empty_description")}
				actionLabel={t("empty_action_label")}
				actionHref="/tools/image-generator"
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
				{images.map((entry: Doc<"imageToolHistory">) => {
					const imageUrl = entry.imageUrl ?? entry.imageUrls?.[0] ?? null;
					return (
						<Link
							key={entry._id}
							href="/tools/image-generator"
							className="block"
						>
							<Card className="overflow-hidden border border-border bg-card hover:bg-card/80 transition-colors">
								<div className="relative aspect-square bg-muted">
									{imageUrl ? (
										<Image
											src={imageUrl}
											alt={
												entry.title ??
												entry.prompt?.slice(0, 50) ??
												t("image_alt_fallback")
											}
											fill
											className="object-cover"
											unoptimized
											sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
										/>
									) : (
										<div className="flex items-center justify-center h-full">
											<ImageIcon className="h-8 w-8 text-muted-foreground" />
										</div>
									)}
								</div>
								<div className="p-3 space-y-1">
									<p className="font-medium text-sm text-foreground truncate">
										{entry.title ?? t("untitled")}
									</p>
									{entry.prompt && (
										<p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
											{entry.prompt}
										</p>
									)}
								</div>
							</Card>
						</Link>
					);
				})}
			</div>
		</div>
	);
}

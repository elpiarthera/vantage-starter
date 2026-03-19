"use client";

import { useQuery } from "convex/react";
import { ImageIcon, Sparkles, Upload, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssetCard } from "@/components/dashboard/assets/AssetCard";
import { AssetGrid } from "@/components/dashboard/assets/AssetGrid";
import { AssetUploadModal } from "@/components/dashboard/assets/AssetUploadModal";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/routing";

interface AssetsTabProps {
	projectId: string;
}

export function AssetsTab({ projectId }: AssetsTabProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("assets_tab");
	const [isUploadOpen, setIsUploadOpen] = useState(false);

	// Fetch assets from Convex
	const assets = useQuery(api.assets.list, {
		projectId: projectId as Id<"projects">,
	});

	const projectAssets = assets || [];
	const images = projectAssets.filter((asset) => asset.type === "image");
	const videos = projectAssets.filter((asset) => asset.type === "video");

	const hasAssets = projectAssets.length > 0;

	const handleUploadComplete = (_assetIds: Id<"assets">[], _urls: string[]) => {
		// Assets will automatically refresh via Convex reactivity
		setIsUploadOpen(false);
	};

	return (
		<>
			<div className="space-y-6 md:space-y-8">
				{/* Header with Actions */}
				<div className="flex flex-col sm:flex-row gap-3 md:gap-4">
					<Button
						onClick={() => setIsUploadOpen(true)}
						variant="outline"
						className={`
              min-h-[44px] flex-1 sm:flex-none
              bg-[#223649] border-[#314d68] text-white
              ${isMobile ? "active:bg-[#2a4159]" : "hover:bg-[#2a4159]"}
            `}
					>
						<Upload className="h-4 w-4 mr-2" />
						{t("upload_asset")}
					</Button>

					<Link
						href="/guided/step-3"
						className="flex-1 sm:flex-none min-h-[44px]"
					>
						<Button variant="outline" className="w-full h-full">
							<Sparkles className="h-4 w-4 mr-2" />
							{t("generate_with_ai")}
						</Button>
					</Link>
				</div>

				{/* Assets Display */}
				{!hasAssets ? (
					<EmptyState
						icon="image"
						title={t("empty_title")}
						description={t("empty_description")}
						actionLabel={t("upload_asset")}
						onAction={() => setIsUploadOpen(true)}
					/>
				) : (
					<div className="space-y-6 md:space-y-8">
						{/* Images Section */}
						{images.length > 0 && (
							<div>
								<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
									<ImageIcon className="h-5 w-5" />
									{t("images_section")} ({images.length})
								</h3>
								<AssetGrid>
									{images.map((asset) => (
										<AssetCard
											key={asset._id}
											asset={{ ...asset, id: asset._id }}
										/>
									))}
								</AssetGrid>
							</div>
						)}

						{/* Videos Section */}
						{videos.length > 0 && (
							<div>
								<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
									<Video className="h-5 w-5" />
									{t("videos_section")} ({videos.length})
								</h3>
								<AssetGrid>
									{videos.map((asset) => (
										<AssetCard
											key={asset._id}
											asset={{ ...asset, id: asset._id }}
										/>
									))}
								</AssetGrid>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Asset Upload Modal */}
			<AssetUploadModal
				projectId={projectId as Id<"projects">}
				isOpen={isUploadOpen}
				onClose={() => setIsUploadOpen(false)}
				onUploadComplete={handleUploadComplete}
			/>
		</>
	);
}

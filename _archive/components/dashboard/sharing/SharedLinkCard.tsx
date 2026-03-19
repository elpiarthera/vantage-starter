"use client";

import { Calendar, Copy, Edit, Eye, Lock, Shield, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import { useDateFormatter } from "@/hooks/useDateFormatter";

// Shared link interface for display
interface SharedLink {
	url: string;
	accessLevel: string;
	viewCount: number;
	expiresAt: Date | null;
	password?: string;
}

interface SharedLinkCardProps {
	link: SharedLink;
	onCopy: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

export function SharedLinkCard({
	link,
	onCopy,
	onEdit,
	onDelete,
}: SharedLinkCardProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("shared_link_card");
	const tShareProjectModal = useTranslations("share_project_modal"); // Reuse keys from ShareProjectModal
	const { formatShort } = useDateFormatter();

	const formatDate = (date: Date | null) => {
		if (!date) return t("never_expires");
		return formatShort(date);
	};

	const truncateUrl = (url: string) => {
		if (isMobile && url.length > 30) {
			return `${url.substring(0, 30)}...`;
		}
		return url;
	};

	return (
		<Card
			className={`
        bg-[#223649] border-[#314d68] p-4 md:p-5
        min-h-[120px] md:min-h-[140px]
        ${isMobile ? "active:bg-[#2a4159]" : "hover:bg-[#2a4159]"}
        transition-colors
      `}
		>
			<div className="space-y-3 md:space-y-4">
				{/* Link URL */}
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<p className="text-xs md:text-sm text-gray-400 mb-1">
							{t("link_url_label")}
						</p>
						<p className="text-sm md:text-base text-white font-mono truncate">
							{truncateUrl(link.url)}
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={onCopy}
						className={`
              min-h-[44px] min-w-[44px] flex-shrink-0
              text-gray-400 hover:text-white hover:bg-[#314d68]
              ${isMobile ? "active:scale-95" : "hover:scale-105"}
              transition-transform
            `}
					>
						<Copy className="h-4 w-4" />
					</Button>
				</div>

				{/* Link Details */}
				<div className="grid grid-cols-2 gap-2 md:gap-3">
					{/* Access Level */}
					<div className="flex items-center gap-2">
						<Shield className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
						<div>
							<p className="text-xs text-gray-400">{t("access_label")}</p>
							<p className="text-xs md:text-sm text-white capitalize">
								{tShareProjectModal(
									`access_level_${link.accessLevel.replace("-", "_")}`,
								)}
							</p>
						</div>
					</div>

					{/* View Count */}
					<div className="flex items-center gap-2">
						<Eye className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
						<div>
							<p className="text-xs text-gray-400">{t("views_label")}</p>
							<p className="text-xs md:text-sm text-white">{link.viewCount}</p>
						</div>
					</div>

					{/* Expiration */}
					<div className="flex items-center gap-2">
						<Calendar className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
						<div>
							<p className="text-xs text-gray-400">{t("expires_label")}</p>
							<p className="text-xs md:text-sm text-white">
								{formatDate(link.expiresAt)}
							</p>
						</div>
					</div>

					{/* Password Protection */}
					<div className="flex items-center gap-2">
						<Lock className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
						<div>
							<p className="text-xs text-gray-400">{t("password_label")}</p>
							<p className="text-xs md:text-sm text-white">
								{link.password ? t("protected_status") : t("none_status")}
							</p>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 pt-2 border-t border-[#314d68]">
					<Button
						variant="ghost"
						size="sm"
						onClick={onEdit}
						className={`
              flex-1 min-h-[44px]
              text-gray-400 hover:text-white hover:bg-[#314d68]
              ${isMobile ? "active:scale-98" : "hover:scale-105"}
              transition-transform
            `}
					>
						<Edit className="h-4 w-4 mr-2" />
						{tShareProjectModal("edit_button")}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onDelete}
						className={`
              flex-1 min-h-[44px]
              text-red-400 hover:text-red-300 hover:bg-red-950/20
              ${isMobile ? "active:scale-98" : "hover:scale-105"}
              transition-transform
            `}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						{tShareProjectModal("delete_button")}
					</Button>
				</div>
			</div>
		</Card>
	);
}

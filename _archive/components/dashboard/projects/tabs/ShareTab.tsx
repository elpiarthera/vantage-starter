"use client";

import { useQuery } from "convex/react";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ShareTabProps {
	projectId: string;
}

export function ShareTab({ projectId }: ShareTabProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("share_tab");

	// Get project data to check for RSVP link (from Step 6)
	const project = useQuery(api.projects.get, {
		projectId: projectId as Id<"projects">,
	});

	const rsvpLink = project?.eventDetails?.rsvpLink;
	const hasRsvpLink = !!rsvpLink;

	const handleCopyLink = () => {
		if (rsvpLink) {
			navigator.clipboard.writeText(rsvpLink);
		}
	};

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg md:text-xl font-semibold text-white">
						{t("title")}
					</h3>
					<p className="text-sm md:text-base text-gray-400 mt-1">
						{t("description")}
					</p>
				</div>
			</div>

			{/* Content */}
			{!hasRsvpLink ? (
				<EmptyState
					icon="share"
					title={t("empty_title")}
					description={t("empty_description")}
					actionLabel={t("go_to_step_6")}
					actionHref={`/guided/step-6?projectId=${projectId}`}
				/>
			) : (
				<div className="space-y-4">
					<Card className="bg-[#223649] border-[#314d68] p-4 md:p-6">
						<div className="space-y-4">
							<div>
								<h4 className="text-sm font-medium text-gray-400 mb-2">
									{t("rsvp_link")}
								</h4>
								<div className="flex gap-2">
									<input
										type="text"
										value={rsvpLink}
										readOnly
										className="flex-1 px-3 py-2 bg-[#182634] border border-[#314d68] rounded text-white text-sm"
									/>
									<Button
										onClick={handleCopyLink}
										variant="outline"
										className={`
                      min-h-[44px] min-w-[44px]
                      bg-[#0d7ff2] border-[#0d7ff2] text-white
                      ${isMobile ? "active:bg-[#0b6fd4]" : "hover:bg-[#0b6fd4]"}
                    `}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div className="text-xs text-gray-400">
								<p>{t("share_instructions")}</p>
								<ul className="list-disc list-inside mt-2 space-y-1">
									<li>{t("view_invitation")}</li>
									<li>{t("rsvp_to_event")}</li>
									<li>{t("get_event_details")}</li>
								</ul>
							</div>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}

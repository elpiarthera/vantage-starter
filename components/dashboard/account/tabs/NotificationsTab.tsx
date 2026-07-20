"use client";

import type { UserResource } from "@clerk/shared/types";
import { Bell, Info, Mail, Shield, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useDevice } from "@/contexts/DeviceContext";

interface NotificationsTabProps {
	user: UserResource;
}

export function NotificationsTab({ user }: NotificationsTabProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("notifications_tab");

	// Initialize state from persisted Clerk unsafeMetadata, falling back to defaults
	// only when the user has never saved a preference yet.
	const [emailNotifications, setEmailNotifications] = useState(
		(user.unsafeMetadata?.emailNotifications as boolean | undefined) ?? true,
	);
	const [pushNotifications, setPushNotifications] = useState(
		(user.unsafeMetadata?.pushNotifications as boolean | undefined) ?? false,
	);
	const [marketingEmails, setMarketingEmails] = useState(
		(user.unsafeMetadata?.marketingEmails as boolean | undefined) ?? true,
	);
	const [securityAlerts] = useState(true); // Always true, not persistable

	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await user.update({
				unsafeMetadata: {
					...user.unsafeMetadata,
					emailNotifications,
					pushNotifications,
					marketingEmails,
				},
			});
			toast.success(t("save_success_toast"));
		} catch (error) {
			console.error("Failed to save notification preferences:", error);
			toast.error(
				error instanceof Error ? error.message : t("save_failed_toast"),
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-xl md:text-2xl font-semibold">{t("title")}</h2>
				<p className="text-sm md:text-base text-muted-foreground mt-1">
					{t("subtitle")}
				</p>
			</div>

			{/* Notification Settings */}
			<div className="space-y-4">
				{/* Email Notifications */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-start gap-3">
							<div
								className={`
                  rounded-full p-2 bg-primary/10
                  ${isMobile ? "mt-1" : ""}
                `}
							>
								<Mail className="h-4 w-4 md:h-5 md:w-5 text-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<CardTitle className="text-base md:text-lg">
									{t("email_notifications")}
								</CardTitle>
								<CardDescription className="text-xs md:text-sm mt-1">
									{t("email_notifications_desc")}
								</CardDescription>
							</div>
							<Switch
								checked={emailNotifications}
								onCheckedChange={setEmailNotifications}
								className="flex-shrink-0"
								aria-label={t("toggle_email_aria")}
							/>
						</div>
					</CardHeader>
				</Card>

				{/* Push Notifications */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-start gap-3">
							<div
								className={`
                  rounded-full p-2 bg-primary/10
                  ${isMobile ? "mt-1" : ""}
                `}
							>
								<Smartphone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<CardTitle className="text-base md:text-lg">
									{t("push_notifications")}
								</CardTitle>
								<CardDescription className="text-xs md:text-sm mt-1">
									{t("push_notifications_desc")}
								</CardDescription>
							</div>
							<Switch
								checked={pushNotifications}
								onCheckedChange={setPushNotifications}
								className="flex-shrink-0"
								aria-label={t("toggle_push_aria")}
							/>
						</div>
					</CardHeader>
				</Card>

				{/* Marketing Emails */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-start gap-3">
							<div
								className={`
                  rounded-full p-2 bg-primary/10
                  ${isMobile ? "mt-1" : ""}
                `}
							>
								<Bell className="h-4 w-4 md:h-5 md:w-5 text-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<CardTitle className="text-base md:text-lg">
									{t("marketing_emails")}
								</CardTitle>
								<CardDescription className="text-xs md:text-sm mt-1">
									{t("marketing_emails_desc")}
								</CardDescription>
							</div>
							<Switch
								checked={marketingEmails}
								onCheckedChange={setMarketingEmails}
								className="flex-shrink-0"
								aria-label={t("toggle_marketing_aria")}
							/>
						</div>
					</CardHeader>
				</Card>

				{/* Security Alerts (Always On) */}
				<Card className="border-primary/20 bg-primary/5">
					<CardHeader className="pb-3">
						<div className="flex items-start gap-3">
							<div
								className={`
                  rounded-full p-2 bg-primary/10
                  ${isMobile ? "mt-1" : ""}
                `}
							>
								<Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<CardTitle className="text-base md:text-lg">
										{t("security_alerts")}
									</CardTitle>
									<div className="group relative">
										<Info className="h-4 w-4 text-muted-foreground cursor-help" />
										<div
											className={`
                        absolute z-50 w-64 p-2 text-xs
                        bg-popover text-popover-foreground
                        border border-border rounded-md shadow-lg
                        opacity-0 group-hover:opacity-100
                        transition-opacity pointer-events-none
                        ${isMobile ? "bottom-full mb-2 right-0" : "left-full ml-2 top-0"}
                      `}
										>
											{t("security_tooltip")}
										</div>
									</div>
								</div>
								<CardDescription className="text-xs md:text-sm mt-1">
									{t("security_alerts_desc")}
								</CardDescription>
							</div>
							<Switch
								checked={securityAlerts}
								disabled
								className="flex-shrink-0 opacity-50 cursor-not-allowed"
								aria-label={t("security_alerts_aria")}
							/>
						</div>
					</CardHeader>
				</Card>
			</div>

			{/* Save Button */}
			<div className="flex justify-end pt-4">
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className={`
            min-h-[44px] min-w-[120px]
            ${isMobile ? "w-full" : ""}
          `}
				>
					{isSaving ? t("saving") : t("save_preferences")}
				</Button>
			</div>
		</div>
	);
}

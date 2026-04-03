"use client";

import { useClerk } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import { useAction, useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChangePasswordModal } from "@/components/dashboard/account/modals/ChangePasswordModal";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
// biome-ignore lint/correctness/noUnusedImports: Switch used when email notifications preference is uncommented (see Post-MVP-Improvement.md)
import { Switch } from "@/components/ui/switch";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import { usePathname, useRouter } from "@/i18n/routing";

// Inline SVG icons — no icon library
function IconAlertTriangle({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
		</svg>
	);
}

function IconCamera({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
			<circle cx="12" cy="13" r="3" />
		</svg>
	);
}

function IconDownload({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="7 10 12 15 17 10" />
			<line x1="12" y1="15" x2="12" y2="3" />
		</svg>
	);
}

function IconKey({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="7.5" cy="15.5" r="5.5" />
			<path d="m21 2-9.6 9.6" />
			<path d="m15.5 7.5 3 3L22 7l-3-3" />
		</svg>
	);
}

function IconLoader({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</svg>
	);
}

function IconTrash({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M3 6h18" />
			<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
			<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
		</svg>
	);
}

interface ProfileTabProps {
	user: UserResource;
}

// Supported languages (must match i18n/routing.ts)
const SUPPORTED_LANGUAGES = [
	{ code: "en", label: "English", flag: "🇺🇸" },
	{ code: "fr", label: "Français", flag: "🇫🇷" },
	{ code: "de", label: "Deutsch", flag: "🇩🇪" },
	{ code: "it", label: "Italiano", flag: "🇮🇹" },
	{ code: "es", label: "Español", flag: "🇪🇸" },
	{ code: "pt", label: "Português", flag: "🇵🇹🇧🇷" },
	{ code: "ru", label: "Русский", flag: "🇷🇺" },
];

export function ProfileTab({ user }: ProfileTabProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("profile_tab");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const updateLanguagePreference = useMutation(
		api.users.updateLanguagePreference,
	);
	const updatePreferences = useMutation(api.users.updatePreferences);
	const deleteAccount = useAction(api.users.deleteAccount);
	const { signOut } = useClerk();

	const subscription = useQuery(api.subscriptions.getByClerkUserId, {
		clerkUserId: user.id,
	});
	const credits = useQuery(api.credits.getUserCredits, {
		clerkUserId: user.id,
	});

	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Extract user data from Clerk user object
	const fullName =
		user.fullName ||
		`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
		"";
	const email = user.primaryEmailAddress?.emailAddress || "";
	const avatarUrl = user.imageUrl || "";

	const [formData, setFormData] = useState({
		name: fullName,
		email: email,
		theme: ((user.unsafeMetadata?.theme as string) || "dark") as
			| "light"
			| "dark"
			| "system",
		language: locale, // Use current locale instead of Clerk metadata
		notifications: (user.unsafeMetadata?.notifications as boolean) ?? true,
	});

	// Update form data when user or locale changes
	useEffect(() => {
		setFormData({
			name: fullName,
			email: email,
			theme: ((user.unsafeMetadata?.theme as string) || "dark") as
				| "light"
				| "dark"
				| "system",
			language: locale,
			notifications: (user.unsafeMetadata?.notifications as boolean) ?? true,
		});
	}, [user, fullName, email, locale]);

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Handle language change - immediately switch locale and save to Convex
	const handleLanguageChange = async (newLanguage: string) => {
		setFormData((prev) => ({ ...prev, language: newLanguage }));

		// Save to Convex database
		try {
			await updateLanguagePreference({ language: newLanguage });
		} catch (error) {
			console.error("Failed to save language preference:", error);
		}

		// Switch the app locale
		router.replace(pathname, { locale: newLanguage });
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Update name in Clerk
			if (formData.name !== fullName) {
				const nameParts = formData.name.trim().split(" ");
				const firstName = nameParts[0] || "";
				const lastName = nameParts.slice(1).join(" ") || "";

				await user.update({
					firstName,
					lastName,
				});
			}

			// Update email in Clerk if changed
			if (formData.email !== email && formData.email) {
				// Note: Clerk requires email verification, so this creates a new email address
				// The user will need to verify it before it becomes primary
				await user.createEmailAddress({ email: formData.email });
				toast.info(t("email_verification_sent"));
			}

			// Update preferences in Convex (theme, notifications)
			await updatePreferences({
				theme: formData.theme,
				notifications: formData.notifications,
			});

			toast.success(t("save_success_toast"));
		} catch (error) {
			console.error("Failed to save profile:", error);
			toast.error(
				error instanceof Error ? error.message : t("save_failed_toast"),
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleExportData = () => {
		const dataStr = JSON.stringify({ user, formData }, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `profile-data-${Date.now()}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleDeleteAccount = async () => {
		setIsDeleting(true);
		setIsDeleteDialogOpen(false);
		try {
			await deleteAccount();
			toast.success(t("delete_success_toast"));
			await signOut({ redirectUrl: "/sign-in" });
		} catch (error) {
			setIsDeleting(false);
			toast.error(
				error instanceof Error ? error.message : t("delete_failed_toast"),
			);
		}
	};

	const handlePhotoUpload = async () => {
		// Create a file input element
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/jpeg,image/png,image/gif,image/webp";

		input.onchange = async (e: Event) => {
			const target = e.target as HTMLInputElement;
			const file = target.files?.[0];

			if (!file) return;

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast.error(t("photo_too_large"));
				return;
			}

			setIsUploadingPhoto(true);
			try {
				// Use Clerk's setProfileImage method
				await user.setProfileImage({ file });
				await user.reload(); // Reload user data to get updated image URL
				toast.success(t("photo_upload_success"));
			} catch (error) {
				console.error("Failed to upload photo:", error);
				toast.error(
					error instanceof Error ? error.message : t("photo_upload_failed"),
				);
			} finally {
				setIsUploadingPhoto(false);
			}
		};

		// Trigger file picker
		input.click();
	};

	const userInitials = formData.name
		.split(" ")
		.map((n: string) => n[0])
		.join("")
		.toUpperCase();

	return (
		<div className="space-y-8">
			{/* Profile Picture Section */}
			<Card className="rounded-xl border border-border bg-transparent p-4 md:p-6">
				<h3 className="text-base font-medium text-foreground mb-4">
					{t("profile_picture")}
				</h3>
				<div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
					<Avatar className="h-20 w-20 md:h-24 md:w-24">
						<AvatarImage src={avatarUrl} alt={formData.name} />
						<AvatarFallback className="text-xl md:text-2xl">
							{userInitials}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col gap-2 w-full md:w-auto">
						<Button
							variant="outline"
							onClick={handlePhotoUpload}
							disabled={isUploadingPhoto}
							className={`min-h-[44px] ${isMobile ? "w-full" : ""} ${isMobile ? "active:bg-muted" : "hover:bg-muted"}`}
						>
							{isUploadingPhoto ? (
								<>
									<IconLoader className="h-4 w-4 mr-2 animate-spin" />
									{t("uploading")}
								</>
							) : (
								<>
									<IconCamera className="h-4 w-4 mr-2" />
									{t("upload_photo")}
								</>
							)}
						</Button>
						<p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
							{t("photo_requirements")}
						</p>
					</div>
				</div>
			</Card>

			{/* Personal Information */}
			<Card className="rounded-xl border border-border bg-transparent p-4 md:p-6">
				<h3 className="text-base font-medium text-foreground mb-4">
					{t("personal_info")}
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
					<div className="space-y-2">
						<Label
							htmlFor="name"
							className="text-sm font-medium text-muted-foreground"
						>
							{t("full_name")}
						</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className="min-h-[48px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground"
						/>
					</div>
					<div className="space-y-2">
						<Label
							htmlFor="email"
							className="text-sm font-medium text-muted-foreground"
						>
							{t("email_address")}
						</Label>
						<Input
							id="email"
							type="email"
							value={formData.email}
							onChange={(e) => handleInputChange("email", e.target.value)}
							className="min-h-[48px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground"
						/>
					</div>
				</div>
			</Card>

			{/* Organization Settings (if applicable) */}
			{/* TODO: Sprint X - Implement organization support with Clerk Organizations API
      {user.organizationId && (
        <Card className="rounded-xl border border-border p-4 md:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 md:mb-6">Organization</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Organization ID</p>
                <p className="text-sm text-muted-foreground">{user.organizationId}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Role</p>
                <p className="text-sm text-muted-foreground capitalize">{user.role || "Member"}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
      */}

			{/* Preferences - Language only for now; Theme and email notification commented (COMMENT DO NOT DELETE) */}
			<Card className="rounded-xl border border-border bg-transparent p-4 md:p-6">
				<h3 className="text-base font-medium text-foreground mb-4">
					{t("preferences")}
				</h3>
				<div className="space-y-4 md:space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
						{/* COMMENT DO NOT DELETE - Theme: to implement later (see docs/Post MVP Improvement/Post-MVP-Improvement.md)
						<div className="space-y-2">
							<Label htmlFor="theme" className="text-sm font-medium text-muted-foreground">{t("theme")}</Label>
							<Select
								value={formData.theme}
								onValueChange={(value) => handleInputChange("theme", value)}
							>
								<SelectTrigger id="theme" className="min-h-[48px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="light">{t("theme_light")}</SelectItem>
									<SelectItem value="dark">{t("theme_dark")}</SelectItem>
									<SelectItem value="system">{t("theme_system")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						*/}
						<div className="space-y-2">
							<Label
								htmlFor="language"
								className="text-sm font-medium text-muted-foreground"
							>
								{t("language")}
							</Label>
							<Select
								value={formData.language}
								onValueChange={handleLanguageChange}
							>
								<SelectTrigger id="language" className="min-h-[48px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SUPPORTED_LANGUAGES.map((lang) => (
										<SelectItem key={lang.code} value={lang.code}>
											{lang.flag} {lang.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					{/* COMMENT DO NOT DELETE - Email notifications: to implement later (see docs/Post MVP Improvement/Post-MVP-Improvement.md)
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="notifications">{t("email_notifications")}</Label>
							<p className="text-sm text-muted-foreground">
								{t("email_notifications_desc")}
							</p>
						</div>
						<Switch
							id="notifications"
							checked={formData.notifications}
							onCheckedChange={(checked) =>
								handleInputChange("notifications", checked)
							}
						/>
					</div>
					*/}
				</div>
			</Card>

			{/* Security */}
			<Card className="rounded-xl border border-border bg-transparent p-4 md:p-6">
				<h3 className="text-base font-medium text-foreground mb-4">
					{t("security")}
				</h3>
				<Button
					variant="outline"
					onClick={() => setIsPasswordModalOpen(true)}
					className={`min-h-[44px] ${isMobile ? "w-full" : ""} ${isMobile ? "active:bg-muted" : "hover:bg-muted"}`}
				>
					<IconKey className="h-4 w-4 mr-2" />
					{t("change_password")}
				</Button>
			</Card>

			{/* Actions */}
			<div className="flex flex-col md:flex-row gap-3 md:gap-4">
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className={`min-h-[44px] ${isMobile ? "w-full" : ""}`}
				>
					{isSaving ? (
						<>
							<IconLoader className="h-4 w-4 mr-2 animate-spin" />
							{t("saving")}
						</>
					) : (
						t("save_changes")
					)}
				</Button>
				<Button
					variant="outline"
					onClick={handleExportData}
					className={`min-h-[44px] ${isMobile ? "w-full" : ""} ${isMobile ? "active:bg-muted" : "hover:bg-muted"}`}
				>
					<IconDownload className="h-4 w-4 mr-2" />
					{t("export_data")}
				</Button>
			</div>

			{/* Danger Zone */}
			<Card className="rounded-xl border border-destructive bg-transparent p-4 md:p-6">
				<h3 className="text-base font-medium text-destructive mb-2">
					{t("danger_zone")}
				</h3>
				<p className="text-sm text-muted-foreground mb-4">
					{t("danger_zone_desc")}
				</p>
				<Button
					type="button"
					variant="destructive"
					disabled={isDeleting}
					onClick={() => setIsDeleteDialogOpen(true)}
					className={`min-h-[44px] ${isMobile ? "w-full" : ""}`}
				>
					{isDeleting ? (
						<IconLoader className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<IconTrash className="h-4 w-4 mr-2" />
					)}
					{t("delete_account")}
				</Button>
			</Card>

			{/* Change Password Modal */}
			<ChangePasswordModal
				isOpen={isPasswordModalOpen}
				onClose={() => setIsPasswordModalOpen(false)}
			/>

			{/* Delete Account Confirmation Dialog - same styling as asset/template/scene delete modals */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent className="bg-card border-border">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2 text-foreground">
							<IconAlertTriangle className="h-5 w-5 text-destructive" />
							{t("delete_confirm_title")}
						</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="space-y-3">
								<p className="text-muted-foreground">
									{t("delete_confirm_desc")}
								</p>
								{subscription?.status === "active" && (
									<div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
										<IconAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
										<span>
											{t("delete_confirm_active_sub", {
												planName:
													subscription.plan?.name ?? subscription.tierKey,
											})}
										</span>
									</div>
								)}
								{credits && credits.balance > 0 && (
									<div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
										<IconAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
										<span>
											{t("delete_confirm_credits_lost", {
												balance: credits.balance,
											})}
										</span>
									</div>
								)}
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="min-h-[44px] border-border text-muted-foreground hover:bg-muted">
							{t("delete_confirm_cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteAccount}
							disabled={isDeleting}
							className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? (
								<>
									<IconLoader className="h-4 w-4 mr-2 animate-spin" />
									{t("delete_confirm_submit")}
								</>
							) : (
								t("delete_confirm_submit")
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

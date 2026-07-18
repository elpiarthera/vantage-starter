"use client";

import { useUser } from "@clerk/nextjs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDevice } from "@/contexts/DeviceContext";

interface ChangePasswordModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ChangePasswordModal({
	isOpen,
	onClose,
}: ChangePasswordModalProps) {
	const { isMobile } = useDevice();
	const { user } = useUser();
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const t = useTranslations("change_password_modal");
	const tCommon = useTranslations("common");

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.currentPassword) {
			newErrors.currentPassword = t("validation.current_password_required");
		}

		if (!formData.newPassword) {
			newErrors.newPassword = t("validation.new_password_required");
		} else if (formData.newPassword.length < 8) {
			newErrors.newPassword = t("validation.password_min_length");
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = t("validation.confirm_password_required");
		} else if (formData.newPassword !== formData.confirmPassword) {
			newErrors.confirmPassword = t("validation.passwords_do_not_match");
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}
		if (!user) {
			toast.error(t("change_password_failed_toast"));
			return;
		}

		setIsSubmitting(true);
		try {
			await user.updatePassword({
				currentPassword: formData.currentPassword,
				newPassword: formData.newPassword,
				signOutOfOtherSessions: true,
			});
			toast.success(t("change_password_success_toast"));
			onClose();
			setFormData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			setErrors({});
		} catch (error) {
			const clerkError = error as {
				errors?: Array<{
					code?: string;
					message?: string;
					longMessage?: string;
				}>;
			};
			const firstError = clerkError?.errors?.[0];
			const message =
				firstError?.code === "form_password_incorrect"
					? t("validation.current_password_incorrect")
					: (firstError?.longMessage ??
						firstError?.message ??
						t("change_password_failed_toast"));

			setErrors((prev) => ({ ...prev, currentPassword: message }));
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		onClose();
		setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
		setErrors({});
	};

	const content = (
		<div className="space-y-4 md:space-y-6">
			{/* Current Password */}
			<div className="space-y-2">
				<Label htmlFor="currentPassword">{t("current_password_label")}</Label>
				<div className="relative">
					<Input
						id="currentPassword"
						type={showCurrentPassword ? "text" : "password"}
						value={formData.currentPassword}
						onChange={(e) =>
							handleInputChange("currentPassword", e.target.value)
						}
						className="min-h-[48px] pr-10"
					/>
					<button
						type="button"
						onClick={() => setShowCurrentPassword(!showCurrentPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						{showCurrentPassword ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</button>
				</div>
				{errors.currentPassword && (
					<p className="text-sm text-destructive">{errors.currentPassword}</p>
				)}
			</div>

			{/* New Password */}
			<div className="space-y-2">
				<Label htmlFor="newPassword">{t("new_password_label")}</Label>
				<div className="relative">
					<Input
						id="newPassword"
						type={showNewPassword ? "text" : "password"}
						value={formData.newPassword}
						onChange={(e) => handleInputChange("newPassword", e.target.value)}
						className="min-h-[48px] pr-10"
					/>
					<button
						type="button"
						onClick={() => setShowNewPassword(!showNewPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						{showNewPassword ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</button>
				</div>
				{errors.newPassword && (
					<p className="text-sm text-destructive">{errors.newPassword}</p>
				)}
				<p className="text-xs text-muted-foreground">
					{t("password_min_length_hint")}
				</p>
			</div>

			{/* Confirm Password */}
			<div className="space-y-2">
				<Label htmlFor="confirmPassword">
					{t("confirm_new_password_label")}
				</Label>
				<div className="relative">
					<Input
						id="confirmPassword"
						type={showConfirmPassword ? "text" : "password"}
						value={formData.confirmPassword}
						onChange={(e) =>
							handleInputChange("confirmPassword", e.target.value)
						}
						className="min-h-[48px] pr-10"
					/>
					<button
						type="button"
						onClick={() => setShowConfirmPassword(!showConfirmPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						{showConfirmPassword ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</button>
				</div>
				{errors.confirmPassword && (
					<p className="text-sm text-destructive">{errors.confirmPassword}</p>
				)}
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={handleClose}>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>{t("change_password_title")}</DrawerTitle>
						<DrawerDescription>
							{t("change_password_description")}
						</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-4">{content}</div>
					<DrawerFooter>
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting}
							className="min-h-[44px] w-full active:scale-98"
						>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("change_password_button")}
						</Button>
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={isSubmitting}
							className="min-h-[44px] w-full active:bg-accent bg-transparent"
						>
							{tCommon("cancel")}
						</Button>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("change_password_title")}</DialogTitle>
					<DialogDescription>
						{t("change_password_description")}
					</DialogDescription>
				</DialogHeader>
				{content}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isSubmitting}
						className="min-h-[44px] bg-transparent"
					>
						{tCommon("cancel")}
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="min-h-[44px]"
					>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{t("change_password_button")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

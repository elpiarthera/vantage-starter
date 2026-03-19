"use client";

import { useMutation } from "convex/react";
import { Copy, Download, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Link, useRouter } from "@/i18n/routing";

interface SettingsTabProps {
	projectId: string;
	project: Doc<"projects">;
}

export function SettingsTab({ projectId, project }: SettingsTabProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("settings_tab");
	const router = useRouter();
	const rsvpLink = project.eventDetails?.rsvpLink;
	const hasRsvpLink = !!rsvpLink;
	const updateProject = useMutation(api.projects.update);
	const deleteProject = useMutation(api.projects.remove);

	const [formData, setFormData] = useState({
		name: project.name,
		occasion: project.occasion,
		theme: project.theme,
		language: project.language,
		duration: project.duration,
	});

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateProject({
				projectId: projectId as Id<"projects">,
				name: formData.name,
				occasion: formData.occasion,
				theme: formData.theme,
				language: formData.language,
				duration: formData.duration,
			});
			console.log("[Settings] Project updated successfully");
		} catch (error) {
			console.error("[Settings] Failed to update project:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		try {
			await deleteProject({ projectId: projectId as Id<"projects"> });
			console.log("[Settings] Project deleted:", projectId);
			router.push("/dashboard/projects");
		} catch (error) {
			console.error("[Settings] Failed to delete project:", error);
		}
	};

	const handleCopyRsvpLink = () => {
		if (rsvpLink) {
			navigator.clipboard.writeText(rsvpLink);
		}
	};

	const handleExport = () => {
		const exportData = {
			...project,
			settings: formData,
			exportedAt: new Date().toISOString(),
		};
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${formData.name.replace(/\s+/g, "-").toLowerCase()}-export.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6 md:space-y-8">
			{/* Header */}
			<div>
				<h3 className="text-lg md:text-xl font-semibold text-white mb-2">
					{t("title")}
				</h3>
				<p className="text-sm md:text-base text-gray-400">{t("description")}</p>
			</div>

			{/* Settings Form */}
			<div className="space-y-6">
				{/* Project Name */}
				<div className="space-y-2">
					<Label htmlFor="name" className="text-white text-sm md:text-base">
						{t("project_name")}
					</Label>
					<Input
						id="name"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						placeholder={t("project_name_placeholder")}
						className="min-h-[48px] bg-[#223649] border-[#314d68] text-white"
					/>
				</div>

				{/* Two Column Layout on Desktop */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
					{/* Occasion */}
					<div className="space-y-2">
						<Label
							htmlFor="occasion"
							className="text-white text-sm md:text-base"
						>
							{t("occasion")}
						</Label>
						<Select
							value={formData.occasion}
							onValueChange={(value) =>
								setFormData({ ...formData, occasion: value })
							}
						>
							<SelectTrigger
								id="occasion"
								className="min-h-[48px] bg-[#223649] border-[#314d68] text-white"
							>
								<SelectValue placeholder={t("occasion_placeholder")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="wedding">{t("occasion_wedding")}</SelectItem>
								<SelectItem value="birthday">
									{t("occasion_birthday")}
								</SelectItem>
								<SelectItem value="anniversary">
									{t("occasion_anniversary")}
								</SelectItem>
								<SelectItem value="corporate_event">
									{t("occasion_business")}
								</SelectItem>
								<SelectItem value="baby_shower">
									{t("occasion_baby_shower")}
								</SelectItem>
								<SelectItem value="graduation">
									{t("occasion_graduation")}
								</SelectItem>
								<SelectItem value="holiday_party">
									{t("occasion_holiday_party")}
								</SelectItem>
								<SelectItem value="engagement">
									{t("occasion_engagement")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Theme */}
					<div className="space-y-2">
						<Label htmlFor="theme" className="text-white text-sm md:text-base">
							{t("theme")}
						</Label>
						<Input
							id="theme"
							value={formData.theme}
							onChange={(e) =>
								setFormData({ ...formData, theme: e.target.value })
							}
							placeholder={t("theme_placeholder")}
							className="min-h-[48px] bg-[#223649] border-[#314d68] text-white"
						/>
					</div>

					{/* Language */}
					<div className="space-y-2">
						<Label
							htmlFor="language"
							className="text-white text-sm md:text-base"
						>
							{t("language")}
						</Label>
						<Select
							value={formData.language}
							onValueChange={(value) =>
								setFormData({ ...formData, language: value })
							}
						>
							<SelectTrigger
								id="language"
								className="min-h-[48px] bg-[#223649] border-[#314d68] text-white"
							>
								<SelectValue placeholder={t("language_placeholder")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="English">{t("language_english")}</SelectItem>
								<SelectItem value="Spanish">{t("language_spanish")}</SelectItem>
								<SelectItem value="French">{t("language_french")}</SelectItem>
								<SelectItem value="German">{t("language_german")}</SelectItem>
								<SelectItem value="Italian">{t("language_italian")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Duration */}
					<div className="space-y-2">
						<Label
							htmlFor="duration"
							className="text-white text-sm md:text-base"
						>
							{t("duration")}
						</Label>
						<Input
							id="duration"
							type="number"
							value={formData.duration}
							onChange={(e) =>
								setFormData({
									...formData,
									duration: Number.parseInt(e.target.value, 10) || 0,
								})
							}
							placeholder={t("duration_placeholder")}
							min="15"
							max="300"
							className="min-h-[48px] bg-[#223649] border-[#314d68] text-white"
						/>
					</div>
				</div>

				{/* Save Button */}
				<div className="pt-4">
					<Button
						onClick={handleSave}
						disabled={isSaving}
						className={`
              min-h-[48px] w-full md:w-auto md:min-w-[200px]
              bg-[#0d7ff2] hover:bg-[#0b6fd4] text-white
              ${isMobile ? "active:scale-98" : "hover:scale-105"}
              transition-transform
            `}
					>
						<Save className="h-4 w-4 mr-2" />
						{isSaving ? t("saving") : t("save_settings")}
					</Button>
				</div>
			</div>

			{/* RSVP Link: user-set link used in Step 6 when sharing; edit in Step 1 */}
			<div className="space-y-4">
				<h4 className="text-base md:text-lg font-semibold text-white">
					{t("rsvp_link_label")}
				</h4>
				{!hasRsvpLink ? (
					<p className="text-sm text-gray-400">
						{t("rsvp_link_empty")}{" "}
						<Link
							href={`/guided/step-1?projectId=${projectId}`}
							className="text-[#0d7ff2] hover:underline"
						>
							{t("modify_rsvp_link")}
						</Link>
					</p>
				) : (
					<Card className="bg-[#223649] border-[#314d68] p-4 md:p-6">
						<div className="space-y-4">
							<div className="flex gap-2">
								<Input
									type="text"
									value={rsvpLink}
									readOnly
									className="flex-1 bg-[#182634] border-[#314d68] text-white text-sm"
								/>
								<Button
									type="button"
									onClick={handleCopyRsvpLink}
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
							<p className="text-xs text-gray-400">{t("rsvp_link_hint")}</p>
							<Link
								href={`/guided/step-1?projectId=${projectId}`}
								className="text-sm text-[#0d7ff2] hover:underline"
							>
								{t("modify_rsvp_link")}
							</Link>
						</div>
					</Card>
				)}
			</div>

			{/* Divider */}
			<div className="border-t border-[#314d68]" />

			{/* Danger Zone */}
			<div className="space-y-4">
				<div>
					<h4 className="text-base md:text-lg font-semibold text-white mb-2">
						{t("danger_zone")}
					</h4>
					<p className="text-sm text-gray-400">
						{t("danger_zone_description")}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Export Project */}
					<Button
						onClick={handleExport}
						variant="outline"
						className={`
              min-h-[48px] w-full
              bg-[#223649] border-[#314d68] text-white
              ${isMobile ? "active:scale-98" : "hover:bg-[#314d68]"}
              transition-all
            `}
					>
						<Download className="h-4 w-4 mr-2" />
						{t("export_project")}
					</Button>

					{/* Delete Project */}
					<Button
						onClick={() => setShowDeleteDialog(true)}
						variant="destructive"
						className={`
              min-h-[48px] w-full
              ${isMobile ? "active:scale-98" : "hover:scale-105"}
              transition-transform
            `}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						{t("delete_project")}
					</Button>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="bg-[#182634] border-[#314d68]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-white">
							{t("delete_dialog_title")}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-gray-400">
							{t("delete_dialog_description", { projectName: formData.name })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							className={`
                min-h-[44px] bg-[#223649] border-[#314d68] text-white
                ${isMobile ? "active:scale-98" : "hover:bg-[#314d68]"}
              `}
						>
							{t("cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className={`
                min-h-[44px] bg-red-600 hover:bg-red-700 text-white
                ${isMobile ? "active:scale-98" : "hover:scale-105"}
              `}
						>
							{t("delete_project")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

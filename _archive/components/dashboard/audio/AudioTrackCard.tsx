"use client";

import { useMutation } from "convex/react";
import { Loader2, Mic, Music, Trash2, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AudioPlayer } from "./AudioPlayer";

interface AudioTrack {
	id: string;
	projectId: string;
	userId: string;
	type: "music" | "narration" | "sound-effect";
	title: string;
	description: string;
	url?: string;
	duration: number;
	generationConfig: {
		model: string;
		prompt: string;
		parameters: Record<string, unknown>;
	};
	status: "draft" | "generating" | "completed";
	createdAt: number;
	updatedAt: number;
	/** When true, track is from audioTracks table (Voice Generator); delete not supported yet */
	fromVoiceGenerator?: boolean;
}

interface AudioTrackCardProps {
	track: AudioTrack;
}

export function AudioTrackCard({ track }: AudioTrackCardProps) {
	const { isMobile } = useDevice();
	const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const t = useTranslations("audio_track_card");
	const tStatus = useTranslations("status");

	const removeAudioTake = useMutation(api.projects.removeAudioTake);

	const handleConfirmDelete = async () => {
		if (track.type !== "narration" && track.type !== "music") {
			toast.error(t("delete_failed_toast"));
			return;
		}
		setIsDeleting(true);
		setDeleteConfirmOpen(false);
		try {
			await removeAudioTake({
				projectId: track.projectId as Id<"projects">,
				takeId: track.id,
				type: track.type,
			});
			toast.success(t("delete_success_toast"));
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : t("delete_failed_toast"),
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const getTypeIcon = () => {
		switch (track.type) {
			case "music":
				return <Music className="h-4 w-4" />;
			case "narration":
				return <Mic className="h-4 w-4" />;
			case "sound-effect":
				return <Volume2 className="h-4 w-4" />;
		}
	};

	const getStatusColor = () => {
		switch (track.status) {
			case "completed":
				return "bg-green-500/20 text-green-400 border-green-500/30";
			case "generating":
				return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
			case "draft":
				return "bg-gray-500/20 text-gray-400 border-gray-500/30";
		}
	};

	return (
		<>
			<Card
				className={`
        bg-[#223649] border-[#314d68]
        p-4 md:p-5
        min-h-[120px]
        ${isMobile ? "active:bg-[#2a4159]" : "hover:bg-[#2a4159]"}
        transition-colors
      `}
			>
				<div className="flex flex-col gap-3 md:gap-4">
					{/* Header */}
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<span className="text-gray-400">{getTypeIcon()}</span>
								<h3 className="text-base md:text-lg font-semibold text-white truncate">
									{track.title}
								</h3>
							</div>
							<p className="text-xs md:text-sm text-gray-400 line-clamp-2">
								{track.description}
							</p>
						</div>

						<div className="flex items-center gap-2 flex-shrink-0">
							<Badge className={getStatusColor()}>
								{tStatus(track.status)}
							</Badge>
						</div>
					</div>

					{track.url && track.status === "completed" && (
						<div className="space-y-2">
							<AudioPlayer url={track.url} duration={track.duration} />

							{!track.fromVoiceGenerator && (
								<div className="flex justify-end">
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={isDeleting}
										onClick={() => setDeleteConfirmOpen(true)}
										className={`
                  min-h-[44px] min-w-[44px]
                  border-red-500/30 text-red-400
                  ${isMobile ? "active:bg-red-500/20" : "hover:bg-red-500/20"}
                `}
									>
										{isDeleting ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4" />
										)}
									</Button>
								</div>
							)}
						</div>
					)}

					{/* Generating State */}
					{track.status === "generating" && (
						<div className="text-center py-2">
							<p className="text-sm text-gray-400">
								{t("generating_audio_track")}
							</p>
						</div>
					)}

					{/* Draft State */}
					{track.status === "draft" && (
						<div className="text-center py-2">
							<p className="text-sm text-gray-400">
								{t("audio_track_not_generated")}
							</p>
						</div>
					)}

					{/* Metadata */}
					<div className="flex items-center gap-4 text-xs text-gray-500">
						<span>
							{t("model_label")}: {track.generationConfig.model}
						</span>
						<span>
							{t("duration_label")}: {formatDuration(track.duration)}
						</span>
					</div>
				</div>
			</Card>

			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent className="bg-[#182634] border-[#314d68]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-white">
							{t("delete_confirm_title")}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-gray-400">
							{t("delete_confirm_description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-[#314d68] text-gray-300 hover:bg-[#223649]">
							{t("delete_confirm_cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-red-600 text-white hover:bg-red-700"
						>
							{t("delete_confirm_submit")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

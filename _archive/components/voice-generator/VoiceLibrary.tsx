"use client";

import { useQuery } from "convex/react";
import { Download, Loader2, Mic, Pause, Play, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { VoiceHistoryItem } from "./hooks/use-convex-voice-history";

interface VoiceLibraryProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	history: VoiceHistoryItem[];
	isLoading?: boolean;
	hasMore?: boolean;
	onLoadMore?: () => void;
	onUseInProject?: (audioUrl: string) => void;
	onDelete?: (id: string) => Promise<void>;
	className?: string;
}

/** Resolves a storageId to a playable URL and renders a single history card. */
function VoiceHistoryCard({
	item,
	playingId,
	deletingId,
	onTogglePlay,
	onDownload,
	onDelete,
	onUseInProject,
	formatDate,
	t,
}: {
	item: VoiceHistoryItem;
	playingId: string | null;
	deletingId: string | null;
	onTogglePlay: (id: string, audioUrl: string) => void;
	onDownload: (audioUrl: string, name: string) => void;
	onDelete?: (id: string) => void;
	onUseInProject?: (audioUrl: string) => void;
	formatDate: (ts: number) => string;
	t: ReturnType<typeof useTranslations<"voice_generator.library">>;
}) {
	const resolvedUrl = useQuery(
		api.files.getFileUrl,
		item.storageId ? { storageId: item.storageId as Id<"_storage"> } : "skip",
	);
	const audioUrl = resolvedUrl ?? undefined;
	const isRecording = !item.generationConfig;
	const displayName =
		item.generationConfig?.voice ?? item.generationConfig?.model ?? item.title;
	const prompt = item.generationConfig?.prompt ?? "";

	return (
		<div className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-smooth md:p-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="flex-1 min-w-0">
					<h4 className="text-base font-medium truncate leading-relaxed">
						{displayName}
					</h4>
					<p className="text-xs text-muted-foreground leading-relaxed mt-1">
						{formatDate(item.createdAt)} •{" "}
						{t("voice_duration", { duration: item.duration.toFixed(1) })}
						{isRecording && ` • ${t("voice_mode_recorded")}`}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="ghost"
						onClick={() => audioUrl && onTogglePlay(item._id, audioUrl)}
						disabled={!audioUrl}
						className="min-h-[44px] min-w-[44px] active:scale-95 transition-smooth"
						aria-label={
							playingId === item._id ? t("pause_aria") : t("play_aria")
						}
					>
						{playingId === item._id ? (
							<Pause className="size-4" />
						) : (
							<Play className="size-4" />
						)}
					</Button>
					{onDelete && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onDelete(item._id)}
							disabled={deletingId === item._id}
							className="min-h-[44px] min-w-[44px] active:scale-95 transition-smooth"
							aria-label={t("delete_aria")}
						>
							{deletingId === item._id ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Trash2 className="size-4" />
							)}
						</Button>
					)}
				</div>
			</div>

			{/* Prompt */}
			{prompt && (
				<p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
					{prompt}
				</p>
			)}

			{/* Actions */}
			<div className="flex flex-col sm:flex-row gap-2">
				<Button
					size="sm"
					variant="outline"
					onClick={() => audioUrl && onDownload(audioUrl, item.title)}
					disabled={!audioUrl}
					aria-label={t("download_audio")}
					className="flex-1 min-h-[44px] justify-center active:scale-95 transition-smooth"
				>
					<Download className="size-4 sm:mr-2" aria-hidden />
					<span className="hidden sm:inline" aria-hidden>
						{t("download_audio")}
					</span>
				</Button>
				{onUseInProject && (
					<Button
						size="sm"
						variant="default"
						onClick={() => audioUrl && onUseInProject(audioUrl)}
						disabled={!audioUrl}
						aria-label={t("use_in_project")}
						className="flex-1 min-h-[44px] justify-center active:scale-95 transition-smooth"
					>
						<Play className="size-4 sm:mr-2" aria-hidden />
						<span className="hidden sm:inline" aria-hidden>
							{t("use_in_project")}
						</span>
					</Button>
				)}
			</div>
		</div>
	);
}

export function VoiceLibrary({
	open,
	onOpenChange,
	history,
	isLoading = false,
	hasMore = false,
	onLoadMore,
	onUseInProject,
	onDelete,
}: VoiceLibraryProps) {
	const t = useTranslations("voice_generator.library");
	const format = useFormatter();
	const [playingId, setPlayingId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const formatDate = (timestamp: number) =>
		format.dateTime(new Date(timestamp), {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	const togglePlay = (id: string, audioUrl: string) => {
		if (playingId === id) {
			audioRef.current?.pause();
			setPlayingId(null);
		} else {
			if (audioRef.current) {
				audioRef.current.pause();
			}
			audioRef.current = new Audio(audioUrl);
			void audioRef.current.play().catch(() => setPlayingId(null));
			audioRef.current.onended = () => setPlayingId(null);
			setPlayingId(id);
		}
	};

	useEffect(() => {
		return () => {
			audioRef.current?.pause();
		};
	}, []);

	const handleDownload = (audioUrl: string, name: string) => {
		const link = document.createElement("a");
		link.href = audioUrl;
		link.download = `${name}-${Date.now()}.mp3`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleDelete = async (id: string) => {
		if (!onDelete) return;
		setDeletingId(id);
		try {
			await onDelete(id);
		} catch (error) {
			console.error("Failed to delete voice:", error);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<AdaptiveModal
			isOpen={open}
			onClose={() => onOpenChange(false)}
			title={t("title")}
		>
			<div className="flex flex-col gap-4 min-h-0 flex-1 overflow-hidden">
				<div className="min-h-0 flex-1 overflow-y-auto">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2
								className="size-8 animate-spin text-muted-foreground"
								aria-hidden="true"
							/>
						</div>
					) : history.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 rounded-full bg-muted p-6">
								<Mic
									className="size-8 text-muted-foreground"
									aria-hidden="true"
								/>
							</div>
							<h3 className="mb-2 text-lg font-semibold">{t("empty_title")}</h3>
							<p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
								{t("empty_description")}
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:gap-4">
							{history.map((item) => (
								<VoiceHistoryCard
									key={item._id}
									item={item}
									playingId={playingId}
									deletingId={deletingId}
									onTogglePlay={togglePlay}
									onDownload={handleDownload}
									onDelete={onDelete ? handleDelete : undefined}
									onUseInProject={onUseInProject}
									formatDate={formatDate}
									t={t}
								/>
							))}
						</div>
					)}

					{/* Load More */}
					{hasMore && onLoadMore && (
						<div className="flex justify-center mt-4">
							<Button
								variant="outline"
								onClick={onLoadMore}
								disabled={isLoading}
								className="min-h-[44px] active:scale-95 transition-smooth"
							>
								{isLoading ? (
									<Loader2 className="size-4 animate-spin mr-2" />
								) : null}
								{t("load_more")}
							</Button>
						</div>
					)}
				</div>
			</div>
		</AdaptiveModal>
	);
}

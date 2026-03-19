"use client";

import { Pause, Play, Trash2, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";

interface CanvasSectionProps {
	audioUrl?: string | null;
	isLoading?: boolean;
	onDelete?: () => void;
}

export function CanvasSection({
	audioUrl,
	isLoading = false,
	onDelete,
}: CanvasSectionProps) {
	const t = useTranslations("voice_generator");
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const audioRef = useRef<HTMLAudioElement>(null);

	const togglePlayPause = () => {
		if (!audioRef.current) return;
		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current
				.play()
				.then(() => setIsPlaying(true))
				.catch(() => setIsPlaying(false));
		}
	};

	const handleSeek = (value: number[]) => {
		const seekTime = value[0] ?? 0;
		if (audioRef.current) {
			audioRef.current.currentTime = seekTime;
			setCurrentTime(seekTime);
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-6">
					<Skeleton className="size-20 rounded-full" />
					<Skeleton className="h-3 w-64 rounded-full" />
					<Skeleton className="h-3 w-48 rounded-full" />
				</div>
			</div>
		);
	}

	if (!audioUrl) {
		return (
			<div className="flex h-full flex-col items-center justify-center px-4 text-center">
				<Volume2 className="mb-4 size-16 text-muted-foreground/40" />
				<h2 className="mb-2 text-lg font-medium text-foreground md:text-xl">
					{t("canvas_empty_title")}
				</h2>
				<p className="max-w-md text-sm leading-relaxed text-muted-foreground">
					{t("canvas_empty_description")}
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col items-center justify-center px-4">
			{/* biome-ignore lint/a11y/useMediaCaption: TTS audio — no caption track available */}
			<audio
				ref={audioRef}
				src={audioUrl}
				onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
				onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
				onEnded={() => setIsPlaying(false)}
			/>

			<div className="w-full max-w-3xl space-y-6">
				<div className="space-y-2">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
					<Slider
						min={0}
						max={duration || 100}
						value={[currentTime]}
						step={0.1}
						onValueChange={handleSeek}
						aria-label={t("playback_seek_aria")}
					/>
				</div>

				<div className="flex items-center justify-center gap-4">
					<Button
						variant="default"
						size="icon"
						onClick={togglePlayPause}
						className="size-16 rounded-full transition-smooth active:scale-95"
						aria-label={
							isPlaying ? t("playback_pause_aria") : t("playback_play_aria")
						}
					>
						{isPlaying ? (
							<Pause className="size-6" />
						) : (
							<Play className="ml-1 size-6" />
						)}
					</Button>
					{onDelete && (
						<Button
							variant="outline"
							size="icon"
							onClick={onDelete}
							className="min-h-[44px] min-w-[44px] rounded-full transition-smooth active:scale-95"
							aria-label={t("playback_delete_aria")}
						>
							<Trash2 className="size-5" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

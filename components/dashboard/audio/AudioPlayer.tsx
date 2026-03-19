"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useDevice } from "@/contexts/DeviceContext";

interface AudioPlayerProps {
	url: string;
	duration: number;
	className?: string;
}

export function AudioPlayer({
	url,
	duration,
	className = "",
}: AudioPlayerProps) {
	const { isMobile } = useDevice();
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
	}, [volume]);

	const handlePlayPause = () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play();
		}
		setIsPlaying(!isPlaying);
	};

	const handleTimeUpdate = () => {
		if (audioRef.current) {
			setCurrentTime(audioRef.current.currentTime);
		}
	};

	const handleEnded = () => {
		setIsPlaying(false);
		setCurrentTime(0);
	};

	const handleSeek = (value: number[]) => {
		if (audioRef.current) {
			audioRef.current.currentTime = value[0];
			setCurrentTime(value[0]);
		}
	};

	const handleVolumeChange = (value: number[]) => {
		setVolume(value[0]);
		setIsMuted(value[0] === 0);
	};

	const toggleMute = () => {
		if (isMuted) {
			setVolume(1);
			setIsMuted(false);
		} else {
			setVolume(0);
			setIsMuted(true);
		}
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className={`space-y-3 ${className}`}>
			{/* Progress Bar */}
			<div className="space-y-2">
				<Slider
					value={[currentTime]}
					max={duration}
					step={0.1}
					onValueChange={handleSeek}
					className="w-full"
				/>
				<div className="flex items-center justify-between text-xs md:text-sm text-gray-400">
					<span>{formatDuration(currentTime)}</span>
					<span>{formatDuration(duration)}</span>
				</div>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-3">
				{/* Play/Pause Button */}
				<Button
					size="sm"
					onClick={handlePlayPause}
					className={`
            min-h-[44px] min-w-[44px]
            bg-[#0d7ff2] text-white
            ${isMobile ? "active:bg-[#0b6dd4]" : "hover:bg-[#0b6dd4]"}
          `}
				>
					{isPlaying ? (
						<Pause className="h-4 w-4" />
					) : (
						<Play className="h-4 w-4" />
					)}
				</Button>

				{/* Volume Control (Desktop Only) */}
				{!isMobile && (
					<div className="flex items-center gap-2 flex-1 max-w-[200px]">
						<Button
							size="sm"
							variant="ghost"
							onClick={toggleMute}
							className="min-h-[44px] min-w-[44px] text-gray-400 hover:text-white"
						>
							{isMuted ? (
								<VolumeX className="h-4 w-4" />
							) : (
								<Volume2 className="h-4 w-4" />
							)}
						</Button>
						<Slider
							value={[volume]}
							max={1}
							step={0.01}
							onValueChange={handleVolumeChange}
							className="flex-1"
						/>
					</div>
				)}
			</div>

			{/* Hidden Audio Element */}
			<audio
				ref={audioRef}
				src={url}
				onTimeUpdate={handleTimeUpdate}
				onEnded={handleEnded}
			>
				<track kind="captions" />
			</audio>
		</div>
	);
}

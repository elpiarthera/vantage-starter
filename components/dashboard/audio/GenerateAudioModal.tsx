"use client";

import { Mic, Music, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDevice } from "@/contexts/DeviceContext";
import { useRouter } from "@/i18n/routing";

type AudioType = "music" | "narration" | "sound-effect";

interface GenerateAudioModalProps {
	isOpen: boolean;
	onClose: () => void;
	projectId: string;
	defaultType?: AudioType;
}

export function GenerateAudioModal({
	isOpen,
	onClose,
	projectId,
	defaultType = "music",
}: GenerateAudioModalProps) {
	const { isMobile } = useDevice();
	const router = useRouter();
	const [type, setType] = useState<AudioType>(defaultType);
	const [title, setTitle] = useState("");
	const [prompt, setPrompt] = useState("");
	const [duration, setDuration] = useState("60");
	const [style, setStyle] = useState("");
	const [mood, setMood] = useState("");
	const t = useTranslations("generate_audio_modal");
	const tCommon = useTranslations("common");

	const handleGenerate = () => {
		// Navigate to guided workflow with parameters
		const params = new URLSearchParams({
			projectId,
			type,
			title,
			prompt,
			duration,
			style,
			mood,
		});
		router.push(`/guided/step-4?${params.toString()}`);
		onClose();
	};

	const getTypeIcon = () => {
		switch (type) {
			case "music":
				return <Music className="h-5 w-5" />;
			case "narration":
				return <Mic className="h-5 w-5" />;
			case "sound-effect":
				return <Volume2 className="h-5 w-5" />;
		}
	};

	const content = (
		<div className="space-y-4 md:space-y-5">
			{/* Type Selection */}
			<div className="space-y-2">
				<Label htmlFor="type">{t("audio_type_label")}</Label>
				<Select
					value={type}
					onValueChange={(value: AudioType) => setType(value)}
				>
					<SelectTrigger id="type" className="min-h-[48px]">
						<SelectValue placeholder={t("select_audio_type_placeholder")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="music">
							<div className="flex items-center gap-2">
								<Music className="h-4 w-4" />
								<span>{t("audio_type_music")}</span>
							</div>
						</SelectItem>
						<SelectItem value="narration">
							<div className="flex items-center gap-2">
								<Mic className="h-4 w-4" />
								<span>{t("audio_type_narration")}</span>
							</div>
						</SelectItem>
						<SelectItem value="sound-effect">
							<div className="flex items-center gap-2">
								<Volume2 className="h-4 w-4" />
								<span>{t("audio_type_sound_effect")}</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Title */}
			<div className="space-y-2">
				<Label htmlFor="title">{t("title_label")}</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder={t("title_placeholder")}
					className="min-h-[48px]"
				/>
			</div>

			{/* Prompt */}
			<div className="space-y-2">
				<Label htmlFor="prompt">
					{type === "narration" ? t("narration_label") : t("description_label")}
				</Label>
				<Textarea
					id="prompt"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder={
						type === "narration"
							? t("narration_placeholder")
							: t("description_placeholder")
					}
					rows={4}
					className="min-h-[120px] resize-none"
				/>
			</div>

			{/* Parameters Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Duration */}
				<div className="space-y-2">
					<Label htmlFor="duration">{t("duration_label")}</Label>
					<Input
						id="duration"
						type="number"
						value={duration}
						onChange={(e) => setDuration(e.target.value)}
						min="5"
						max="300"
						className="min-h-[48px]"
					/>
				</div>

				{/* Style (Music/Sound Effect only) */}
				{type !== "narration" && (
					<div className="space-y-2">
						<Label htmlFor="style">{t("style_label")}</Label>
						<Input
							id="style"
							value={style}
							onChange={(e) => setStyle(e.target.value)}
							placeholder={t("style_placeholder")}
							className="min-h-[48px]"
						/>
					</div>
				)}

				{/* Mood */}
				<div className="space-y-2">
					<Label htmlFor="mood">{t("mood_label")}</Label>
					<Input
						id="mood"
						value={mood}
						onChange={(e) => setMood(e.target.value)}
						placeholder={t("mood_placeholder")}
						className="min-h-[48px]"
					/>
				</div>
			</div>

			{/* Actions */}
			<div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
				<Button
					variant="outline"
					onClick={onClose}
					className={`
            flex-1 min-h-[44px]
            ${isMobile ? "active:bg-[#223649]" : "hover:bg-[#223649]"}
          `}
				>
					{tCommon("cancel")}
				</Button>
				<Button
					onClick={handleGenerate}
					disabled={!title || !prompt}
					className={`
            flex-1 min-h-[44px]
            bg-[#0d7ff2] text-white
            ${isMobile ? "active:bg-[#0b6dd4]" : "hover:bg-[#0b6dd4]"}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
				>
					{getTypeIcon()}
					<span className="ml-2">{t("generate_audio_button")}</span>
				</Button>
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={onClose}>
				<DrawerContent className="bg-[#182634] border-[#223649]">
					<DrawerHeader className="border-b border-[#223649]">
						<DrawerTitle className="text-white">
							{t("generate_audio_title")}
						</DrawerTitle>
					</DrawerHeader>
					<div className="p-4 overflow-y-auto max-h-[80vh]">{content}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-[#182634] border-[#223649] max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-white">
						{t("generate_audio_title")}
					</DialogTitle>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
}

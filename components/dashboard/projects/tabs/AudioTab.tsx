"use client";

import { useQuery } from "convex/react";
import { Mic, Music } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AudioTrackCard } from "@/components/dashboard/audio/AudioTrackCard";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/routing";

interface AudioTrack {
	id: string;
	type: "music" | "narration";
	title: string;
	description: string;
	url?: string;
	duration: number;
	status: "draft" | "generating" | "completed";
	createdAt: number;
	fromVoiceGenerator?: boolean;
}

interface AudioTabProps {
	projectId: string;
}

export function AudioTab({ projectId }: AudioTabProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("audio_tab");
	const tAudio = useTranslations("project.audio");
	const [activeSection, setActiveSection] = useState<
		"all" | "music" | "narration"
	>("all");

	const projectIdTyped = projectId as Id<"projects">;

	// Fetch project data which contains step4Data with audio
	const project = useQuery(api.projects.get, {
		projectId: projectIdTyped,
	});

	// Voice Generator / Save-to-project narrations (from audioTracks table)
	const projectNarrations = useQuery(api.audioTracks.getProjectNarrations, {
		projectId: projectIdTyped,
	});

	const isLoading = project === undefined;

	// Transform step4Data + getProjectNarrations into audio tracks format
	const audioTracks = useMemo<AudioTrack[]>(() => {
		const tracks: AudioTrack[] = [];

		if (project?.step4Data) {
			// Add music tracks from step4
			if (project.step4Data.musicTakes) {
				for (const take of project.step4Data.musicTakes) {
					tracks.push({
						id: take.id,
						type: "music",
						title: take.name || t("filter_music"),
						description: take.prompt || "",
						url: take.audioUrl,
						duration: 0,
						status: "completed",
						createdAt: project.createdAt,
					});
				}
			}

			// Add narration tracks from step4
			if (project.step4Data.narrationTakes) {
				for (const take of project.step4Data.narrationTakes) {
					tracks.push({
						id: take.id,
						type: "narration",
						title: take.name || t("filter_narrations"),
						description: `${tAudio("voice_label")}: ${take.voice || tAudio("default_voice")}`,
						url: take.audioUrl,
						duration: take.durationMs ? take.durationMs / 1000 : 0,
						status: "completed",
						createdAt: project.createdAt,
					});
				}
			}
		}

		// Add narrations from Voice Generator (audioTracks table)
		if (projectNarrations) {
			for (const track of projectNarrations) {
				tracks.push({
					id: track._id,
					type: "narration",
					title: track.title,
					description:
						track.source === "generated"
							? tAudio("generated")
							: tAudio("recorded"),
					url: track.audioUrl ?? undefined,
					duration: track.duration ?? 0,
					status: "completed",
					createdAt: track._creationTime,
					fromVoiceGenerator: true,
				});
			}
		}

		return tracks;
	}, [project, projectNarrations, t, tAudio]);

	// Filter by type
	const filteredTracks =
		activeSection === "all"
			? audioTracks
			: audioTracks.filter((track) => track.type === activeSection);

	// Group by type for counts
	const musicTracks = audioTracks.filter((track) => track.type === "music");
	const narrationTracks = audioTracks.filter(
		(track) => track.type === "narration",
	);

	if (isLoading) {
		return (
			<div className="space-y-4 md:space-y-6">
				<div className="flex flex-col sm:flex-row gap-3 md:gap-4">
					<Skeleton className="h-[44px] flex-1" />
					<Skeleton className="h-[44px] flex-1" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-[44px] w-[100px]" />
					<Skeleton className="h-[44px] w-[100px]" />
					<Skeleton className="h-[44px] w-[100px]" />
				</div>
				<div className="space-y-3">
					<Skeleton className="h-[120px]" />
					<Skeleton className="h-[120px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-6">
			<div className="flex flex-col sm:flex-row gap-3 md:gap-4">
				<Link href={`/guided/step-4?projectId=${projectId}`} className="flex-1">
					<Button
						className={`
              w-full min-h-[44px]
              bg-[#0d7ff2] text-white
              ${isMobile ? "active:bg-[#0b6dd4]" : "hover:bg-[#0b6dd4]"}
            `}
					>
						<Music className="h-4 w-4 mr-2" />
						{t("generate_music")}
					</Button>
				</Link>

				<Link href={`/guided/step-4?projectId=${projectId}`} className="flex-1">
					<Button
						className={`
              w-full min-h-[44px]
              bg-[#223649] text-white
              ${isMobile ? "active:bg-[#2a4159]" : "hover:bg-[#2a4159]"}
            `}
					>
						<Mic className="h-4 w-4 mr-2" />
						{t("generate_narration")}
					</Button>
				</Link>
			</div>

			{/* Section Filters */}
			<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
				{[
					{
						id: "all",
						label: t("filter_all"),
						count: audioTracks?.length || 0,
					},
					{ id: "music", label: t("filter_music"), count: musicTracks.length },
					{
						id: "narration",
						label: t("filter_narrations"),
						count: narrationTracks.length,
					},
				].map((section) => (
					<Button
						key={section.id}
						variant={activeSection === section.id ? "default" : "outline"}
						onClick={() => setActiveSection(section.id as typeof activeSection)}
						className={`
              min-h-[44px] min-w-[100px] flex-shrink-0
              ${isMobile ? "active:scale-98" : "hover:scale-105"}
              transition-transform
              ${activeSection === section.id ? "bg-[#0d7ff2] text-white" : "bg-[#223649] text-gray-300"}
            `}
					>
						{section.label}
						<span className="ml-2 text-xs opacity-75">({section.count})</span>
					</Button>
				))}
			</div>

			{/* Audio Tracks List */}
			{filteredTracks.length === 0 ? (
				<EmptyState
					icon="music"
					title={t("empty_title")}
					description={t("empty_description")}
					actionLabel={t("generate_audio")}
					onAction={() => {
						window.location.href = `/guided/step-4?projectId=${projectId}`;
					}}
				/>
			) : (
				<div className="space-y-3 md:space-y-4">
					{filteredTracks.map((track) => (
						<AudioTrackCard
							key={track.id}
							track={{
								id: track.id,
								projectId: projectId,
								userId: "",
								type: track.type,
								title: track.title,
								description: track.description,
								url: track.url,
								duration: track.duration,
								generationConfig: {
									model: "fal-ai",
									prompt: track.description,
									parameters: {},
								},
								status: track.status,
								createdAt: track.createdAt,
								updatedAt: track.createdAt,
								fromVoiceGenerator: track.fromVoiceGenerator,
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}

"use client";
import { ArrowLeft, Check, Home, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Id } from "@/convex/_generated/dataModel";
import { useProjectData } from "@/hooks/business-logic/useProjectData";
import { Link } from "@/i18n/routing";

interface StyleOption {
	id: string;
	title: string;
	icon: string;
	descriptor: string;
	preview: string;
}

const visualStyles: StyleOption[] = [
	{
		id: "cinematic",
		title: "Cinematic",
		icon: "🎬",
		descriptor: "Film-like quality",
		preview: "/cinematic-film-style.png",
	},
	{
		id: "vintage",
		title: "Vintage",
		icon: "📼",
		descriptor: "Vintage aesthetic",
		preview: "/vintage-retro-style.png",
	},
	{
		id: "storyboard",
		title: "Storyboard",
		icon: "📋",
		descriptor: "Sketch-like frames",
		preview: "/storyboard-sketch-style.jpg",
	},
	{
		id: "low-key",
		title: "Low Key",
		icon: "🌑",
		descriptor: "Dark, moody lighting",
		preview: "/low-key-dark-moody-lighting.jpg",
	},
	{
		id: "indie",
		title: "Indie",
		icon: "🎭",
		descriptor: "Independent film feel",
		preview: "/indie-film-aesthetic.jpg",
	},
	{
		id: "y2k",
		title: "Y2K",
		icon: "💿",
		descriptor: "Early 2000s digital",
		preview: "/y2k-early-2000s-digital-style.jpg",
	},
	{
		id: "pop",
		title: "Pop",
		icon: "🎨",
		descriptor: "Bright, vibrant colors",
		preview: "/pop-art-bright-vibrant-colors.jpg",
	},
	{
		id: "grunge",
		title: "Grunge",
		icon: "🎸",
		descriptor: "Raw, textured look",
		preview: "/grunge-raw-textured-style.jpg",
	},
	{
		id: "dreamy",
		title: "Dreamy",
		icon: "☁️",
		descriptor: "Soft, ethereal feel",
		preview: "/dreamy-soft-ethereal-style.jpg",
	},
	{
		id: "hand-drawn",
		title: "Hand Drawn",
		icon: "✏️",
		descriptor: "Artistic sketch style",
		preview: "/hand-drawn-artistic-sketch.jpg",
	},
	{
		id: "2d-novel",
		title: "2D Novel",
		icon: "📖",
		descriptor: "Flat illustration style",
		preview: "/2d-novel-flat-illustration.jpg",
	},
	{
		id: "boost",
		title: "Boost",
		icon: "⚡",
		descriptor: "High energy, dynamic",
		preview: "/boost-high-energy-dynamic.jpg",
	},
	{
		id: "scribble",
		title: "Scribble",
		icon: "🖊️",
		descriptor: "Loose, sketchy lines",
		preview: "/scribble-loose-sketchy-lines.jpg",
	},
	{
		id: "film-noir",
		title: "Film Noir",
		icon: "🕵️",
		descriptor: "Classic black & white",
		preview: "/film-noir-black-white-classic.jpg",
	},
	{
		id: "anime",
		title: "Anime",
		icon: "🌸",
		descriptor: "Japanese animation style",
		preview: "/anime-japanese-animation-style.jpg",
	},
	{
		id: "3d-cartoon",
		title: "3D Cartoon",
		icon: "🎪",
		descriptor: "Playful 3D animation",
		preview: "/3d-cartoon-playful-animation.jpg",
	},
	{
		id: "colored",
		title: "Colored",
		icon: "🌈",
		descriptor: "Rich, saturated hues",
		preview: "/colored-rich-saturated-hues.jpg",
	},
];

// Loading component for Suspense
function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#101a23]">
			<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
		</div>
	);
}

function GuidedStep2bContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const t = useTranslations("guided_step2b");
	const tStyles = useTranslations("visual_styles");

	// Get projectId from URL query params
	const projectIdFromUrl = searchParams.get("projectId");
	const projectId = projectIdFromUrl
		? (projectIdFromUrl as Id<"projects">)
		: undefined;

	// ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
	const [selectedStyle, setSelectedStyle] = useState<string>("");

	// Load project data from Convex
	const { project, update } = useProjectData(projectId);

	// Redirect to Step 1 if projectId is missing (graceful handling)
	useEffect(() => {
		if (!projectIdFromUrl) {
			console.warn("Missing projectId in URL - redirecting to Step 1");
			router.replace("/guided/step-1");
		}
	}, [projectIdFromUrl, router]);

	// Load visual style from Convex when project loads
	useEffect(() => {
		console.log("[Step 2b] Project loaded:", project);
		if (project?.visualStyle) {
			console.log(
				"[Step 2b] Loading visualStyle from Convex:",
				project.visualStyle,
			);
			setSelectedStyle(project.visualStyle);
		} else {
			console.log("[Step 2b] No visualStyle found in project");
		}
	}, [project]);

	// Show loading while redirecting or if no projectId
	if (!projectIdFromUrl) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23]">
				<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
			</div>
		);
	}

	const handleStyleSelect = (styleId: string) => {
		console.log("[Step 2b] Style selected:", styleId);
		setSelectedStyle(styleId);

		// Save to Convex
		if (projectId) {
			console.log("[Step 2b] Saving visualStyle to Convex:", {
				projectId,
				visualStyle: styleId,
			});
			update({ visualStyle: styleId });
		} else {
			console.error("[Step 2b] No projectId - cannot save to Convex!");
		}
	};

	const handleContinue = () => {
		if (selectedStyle && projectId) {
			router.push(`/guided/step-3?projectId=${projectId}`);
		}
	};

	return (
		<div
			className="h-screen flex flex-col overflow-hidden"
			style={{ backgroundColor: "#101a23" }}
		>
			<div
				className="shadow-md p-3 md:p-4 fixed top-0 w-full z-50"
				style={{
					backgroundColor: "#182634",
					borderBottom: "1px solid #223649",
				}}
			>
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<Link href={`/guided/step-2?projectId=${projectId}`}>
						<Button
							variant="ghost"
							className="text-white hover:bg-[#223649] p-2 md:px-4"
							aria-label={t("back_aria_label")}
						>
							<ArrowLeft className="h-4 w-4 md:mr-2" />
							<span className="hidden md:inline">{t("back")}</span>
						</Button>
					</Link>

					<div className="flex-1 max-w-md mx-4 md:mx-8">
						<Progress
							value={40}
							className="h-2 mb-2"
							style={{ backgroundColor: "#314d68" }}
						/>
						<div className="flex justify-between text-xs text-gray-400">
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									1
								</div>
							</span>
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									2
								</div>
								<span className="hidden sm:inline">🎨</span>
							</span>
							{[3, 4, 5, 6].map((num) => (
								<span key={num} className="flex items-center gap-1">
									<div
										className="w-5 h-5 md:w-6 md:h-6 rounded-full text-gray-400 flex items-center justify-center text-xs"
										style={{ backgroundColor: "#314d68" }}
									>
										{num}
									</div>
								</span>
							))}
						</div>
					</div>

					<Link href="/">
						<Button
							variant="ghost"
							className="text-white hover:bg-[#223649] p-2 md:px-4"
							aria-label={t("home_aria_label")}
						>
							<Home className="h-4 w-4 md:mr-2" />
							<span className="hidden md:inline">{t("home")}</span>
						</Button>
					</Link>
				</div>
			</div>

			<div className="flex-1 pt-20 md:pt-24 pb-4 overflow-auto">
				<div className="text-center mb-6 md:mb-8 px-4">
					<h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-white">
						{t("title")}
					</h1>
					<p
						className="text-lg md:text-xl italic text-center mb-6 md:mb-8"
						style={{ color: "#0d7ff2" }}
					>
						{t("subtitle")}
					</p>
				</div>

				<div className="max-w-6xl mx-auto px-4">
					<Card style={{ backgroundColor: "#182634", borderColor: "#223649" }}>
						<CardHeader>
							<CardTitle className="text-white text-xl">
								{t("choose_style_title")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{visualStyles.map((style) => (
									<button
										type="button"
										key={style.id}
										className={`cursor-pointer rounded-lg border-2 transition-all hover:scale-105 ${
											selectedStyle === style.id
												? "border-[#0d7ff2] bg-[#0d7ff2]/10"
												: "border-[#314d68] hover:border-[#0d7ff2]/50"
										}`}
										onClick={() => handleStyleSelect(style.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												handleStyleSelect(style.id);
											}
										}}
										aria-label={`Select ${style.title} style`}
									>
										<div className="p-4">
											<div className="aspect-video bg-[#223649] rounded mb-3 overflow-hidden relative">
												<Image
													src={style.preview || "/placeholder.svg"}
													alt={style.title}
													fill
													className="object-cover"
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.src =
															"/placeholder.svg?height=120&width=200&text=" +
															encodeURIComponent(style.title);
													}}
												/>
											</div>
											<div className="text-center">
												<div className="flex items-center justify-center gap-2 mb-1">
													<span className="text-sm font-medium text-white">
														{tStyles(style.id)}
													</span>
													<span className="text-lg hidden md:inline">
														{style.icon}
													</span>
													{selectedStyle === style.id && (
														<Check className="h-4 w-4 text-[#0d7ff2] flex-shrink-0" />
													)}
												</div>
												<p className="text-xs text-gray-400 italic">
													{tStyles(`${style.id}_desc`)}
												</p>
											</div>
										</div>
									</button>
								))}
							</div>
						</CardContent>
					</Card>

					<div className="flex justify-center mt-8">
						<Button
							onClick={handleContinue}
							disabled={!selectedStyle}
							className={`px-8 py-3 text-lg ${
								selectedStyle
									? "bg-[#0d7ff2] hover:bg-blue-600 text-white"
									: "text-white border-[#314d68] hover:bg-[#223649] bg-transparent border"
							}`}
						>
							{t("continue_scenes")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function GuidedStep2b() {
	return (
		<Suspense fallback={<Loading />}>
			<GuidedStep2bContent />
		</Suspense>
	);
}

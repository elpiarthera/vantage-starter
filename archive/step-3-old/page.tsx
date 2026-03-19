"use client";

import {
	ArrowLeft,
	Camera,
	ChevronDown,
	Focus,
	Home,
	Leaf,
	RotateCcw,
	Settings,
	Sparkles,
	Sun,
	Zap,
	ZoomIn,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

interface CinematicRecipe {
	ambiance: string;
	cameraMovement: string;
	colorTone: string;
	visualStyle: string;
	technicalSettings: {
		resolution: string;
		aspect: string;
	};
}

export default function GuidedStep3() {
	const router = useRouter();
	const [cinematicRecipe, setCinematicRecipe] = useState<CinematicRecipe>({
		ambiance: "",
		cameraMovement: "",
		colorTone: "",
		visualStyle: "",
		technicalSettings: {
			resolution: "1080p",
			aspect: "16:9",
		},
	});
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const styleOptions = {
		ambiance: [
			{
				id: "golden-hour",
				name: "Golden-Hour",
				icon: Sun,
				emoji: "☀️",
				desc: "Warm light for joy",
				color: "bg-orange-100 border-orange-300 hover:bg-orange-200",
			},
			{
				id: "dramatic",
				name: "Dramatic",
				icon: Zap,
				emoji: "⚡",
				desc: "Intense for excitement",
				color: "bg-purple-100 border-purple-300 hover:bg-purple-200",
			},
			{
				id: "natural",
				name: "Natural",
				icon: Leaf,
				emoji: "🌿",
				desc: "Calm for nostalgia",
				color: "bg-green-100 border-green-300 hover:bg-green-200",
			},
			{
				id: "soft-glow",
				name: "Soft Glow",
				icon: Sparkles,
				emoji: "✨",
				desc: "Tender for romance",
				color: "bg-pink-100 border-pink-300 hover:bg-pink-200",
			},
		],
		cameraMovement: [
			{
				id: "slow-pan",
				name: "Slow-Pan",
				desc: "Gentle build",
				color: "bg-blue-100 border-blue-300 hover:bg-blue-200",
			},
			{
				id: "dynamic-orbit",
				name: "Dynamic-Orbit",
				icon: RotateCcw,
				desc: "Energetic spin",
				color: "bg-red-100 border-red-300 hover:bg-red-200",
			},
			{
				id: "static",
				name: "Static",
				icon: Focus,
				desc: "Intimate focus",
				color: "bg-gray-100 border-gray-300 hover:bg-gray-200",
			},
			{
				id: "zoom-in",
				name: "Zoom-In",
				icon: ZoomIn,
				desc: "Dramatic reveal",
				color: "bg-yellow-100 border-yellow-300 hover:bg-yellow-200",
			},
		],
		colorTone: [
			{
				id: "warm-colors",
				name: "Warm Colors",
				desc: "Joyful",
				color: "bg-orange-100 border-orange-300 hover:bg-orange-200",
				preview: "#FFA500",
			},
			{
				id: "saturated",
				name: "Saturated",
				desc: "Vibrant excitement",
				color: "bg-red-100 border-red-300 hover:bg-red-200",
				preview: "#FF4500",
			},
			{
				id: "natural",
				name: "Natural",
				desc: "Balanced nostalgia",
				color: "bg-green-100 border-green-300 hover:bg-green-200",
				preview: "#8FBC8F",
			},
			{
				id: "cool-tones",
				name: "Cool Tones",
				desc: "Calm romance",
				color: "bg-blue-100 border-blue-300 hover:bg-blue-200",
				preview: "#4169E1",
			},
		],
		visualStyle: [
			{
				id: "cinematic",
				name: "Cinematic",
				desc: "Epic arcs",
				color: "bg-indigo-100 border-indigo-300 hover:bg-indigo-200",
			},
			{
				id: "retro",
				name: "Retro",
				desc: "Nostalgic filter",
				color: "bg-amber-100 border-amber-300 hover:bg-amber-200",
			},
			{
				id: "modern",
				name: "Modern",
				desc: "Clean lines",
				color: "bg-slate-100 border-slate-300 hover:bg-slate-200",
			},
			{
				id: "artistic",
				name: "Artistic",
				desc: "Abstract emotion",
				color: "bg-purple-100 border-purple-300 hover:bg-purple-200",
			},
		],
	};

	const updateSelection = (
		category: keyof Omit<CinematicRecipe, "technicalSettings">,
		value: string,
	) => {
		setCinematicRecipe((prev) => ({ ...prev, [category]: value }));
	};

	const updateTechnicalSetting = (key: string, value: string) => {
		setCinematicRecipe((prev) => ({
			...prev,
			technicalSettings: { ...prev.technicalSettings, [key]: value },
		}));
	};

	const canContinue =
		cinematicRecipe.ambiance &&
		cinematicRecipe.cameraMovement &&
		cinematicRecipe.colorTone &&
		cinematicRecipe.visualStyle;

	const getPreviewStyle = () => {
		const ambiance = styleOptions.ambiance.find(
			(a) => a.id === cinematicRecipe.ambiance,
		);
		const colorTone = styleOptions.colorTone.find(
			(c) => c.id === cinematicRecipe.colorTone,
		);

		if (ambiance?.id === "golden-hour") {
			return "bg-gradient-radial from-orange-300 via-yellow-200 to-orange-100";
		} else if (ambiance?.id === "dramatic") {
			return "bg-gradient-radial from-purple-400 via-purple-300 to-purple-200";
		} else if (colorTone?.preview) {
			return `bg-gradient-radial from-[${colorTone.preview}] via-opacity-50 to-white`;
		}
		return "bg-gradient-radial from-gray-200 to-gray-100";
	};

	const handleContinue = async () => {
		setIsLoading(true);
		// Simulate saving
		await new Promise((resolve) => setTimeout(resolve, 1000));
		router.push("/guided/step-4");
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<header className="bg-white shadow-md p-4 fixed top-0 w-full z-50">
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<Link href="/guided/step-2">
						<Button variant="ghost" aria-label="Back to step 2">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back
						</Button>
					</Link>

					<div className="flex-1 max-w-md mx-8">
						<div className="flex items-center justify-between mb-2">
							{[1, 2, 3, 4, 5, 6].map((step) => (
								<div
									key={step}
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
										step <= 3
											? "bg-blue-500 text-white"
											: "bg-gray-300 text-gray-600"
									}`}
								>
									{step === 3 ? <Camera className="h-4 w-4" /> : step}
								</div>
							))}
						</div>
						<Progress value={50} className="h-2" />
					</div>

					<Link href="/">
						<Button variant="ghost" aria-label="Home">
							<Home className="h-4 w-4 mr-2" />
							Home
						</Button>
					</Link>
				</div>
			</header>

			<div className="pt-24 p-4 pb-24">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-8 animate-fadeIn">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Director's Chair: Set the Mood
						</h1>
						<p className="text-xl italic text-blue-600 mb-8">
							Choose cinematic styles to enhance emotion
						</p>
					</div>

					<div className="grid lg:grid-cols-2 gap-8">
						{/* Style Selection Cards */}
						<div className="space-y-6">
							{/* Ambiance */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Sun className="h-5 w-5" />
										Ambiance
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-3">
										{styleOptions.ambiance.map((option) => {
											const Icon = option.icon;
											return (
												<button
													key={option.id}
													onClick={() => updateSelection("ambiance", option.id)}
													className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
														cinematicRecipe.ambiance === option.id
															? "border-blue-500 scale-105 shadow-lg"
															: option.color
													}`}
												>
													<div className="text-center">
														<div className="flex items-center justify-center mb-2">
															<Icon className="h-6 w-6" />
															<span className="ml-1 text-lg">
																{option.emoji}
															</span>
														</div>
														<h4 className="font-semibold text-sm">
															{option.name}
														</h4>
														<p className="text-xs text-gray-600 mt-1">
															{option.desc}
														</p>
													</div>
												</button>
											);
										})}
									</div>
								</CardContent>
							</Card>

							{/* Camera Movement */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Camera className="h-5 w-5" />
										Camera Movement
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-3">
										{styleOptions.cameraMovement.map((option) => {
											const Icon = option.icon;
											return (
												<button
													key={option.id}
													onClick={() =>
														updateSelection("cameraMovement", option.id)
													}
													className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
														cinematicRecipe.cameraMovement === option.id
															? "border-blue-500 scale-105 shadow-lg"
															: option.color
													}`}
												>
													<div className="text-center">
														{Icon && <Icon className="h-6 w-6 mx-auto mb-2" />}
														<h4 className="font-semibold text-sm">
															{option.name}
														</h4>
														<p className="text-xs text-gray-600 mt-1">
															{option.desc}
														</p>
													</div>
												</button>
											);
										})}
									</div>
								</CardContent>
							</Card>

							{/* Color Tone */}
							<Card>
								<CardHeader>
									<CardTitle>Color Tone</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-3">
										{styleOptions.colorTone.map((option) => (
											<button
												key={option.id}
												onClick={() => updateSelection("colorTone", option.id)}
												className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
													cinematicRecipe.colorTone === option.id
														? "border-blue-500 scale-105 shadow-lg"
														: option.color
												}`}
											>
												<div className="text-center">
													<div
														className="w-8 h-8 rounded-full mx-auto mb-2 border-2 border-white shadow-sm"
														style={{ backgroundColor: option.preview }}
													/>
													<h4 className="font-semibold text-sm">
														{option.name}
													</h4>
													<p className="text-xs text-gray-600 mt-1">
														{option.desc}
													</p>
												</div>
											</button>
										))}
									</div>
								</CardContent>
							</Card>

							{/* Visual Style */}
							<Card>
								<CardHeader>
									<CardTitle>Visual Style</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-3">
										{styleOptions.visualStyle.map((option) => (
											<button
												key={option.id}
												onClick={() =>
													updateSelection("visualStyle", option.id)
												}
												className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
													cinematicRecipe.visualStyle === option.id
														? "border-blue-500 scale-105 shadow-lg"
														: option.color
												}`}
											>
												<div className="text-center">
													<h4 className="font-semibold text-sm">
														{option.name}
													</h4>
													<p className="text-xs text-gray-600 mt-1">
														{option.desc}
													</p>
												</div>
											</button>
										))}
									</div>
								</CardContent>
							</Card>

							<Collapsible
								open={isAdvancedOpen}
								onOpenChange={setIsAdvancedOpen}
							>
								<CollapsibleTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-between bg-transparent"
									>
										<span className="flex items-center gap-2">
											<Settings className="h-4 w-4" />
											Advanced Settings
										</span>
										<ChevronDown
											className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
										/>
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent className="mt-4">
									<Card>
										<CardContent className="pt-6">
											<div className="space-y-4">
												<div>
													<label className="block text-sm font-medium mb-2">
														Resolution
													</label>
													<select
														value={cinematicRecipe.technicalSettings.resolution}
														onChange={(e) =>
															updateTechnicalSetting(
																"resolution",
																e.target.value,
															)
														}
														className="w-full p-2 border rounded-md"
													>
														<option value="720p">720p</option>
														<option value="1080p">1080p</option>
													</select>
												</div>
												<div>
													<label className="block text-sm font-medium mb-2">
														Aspect Ratio
													</label>
													<div className="flex gap-2">
														{["16:9", "9:16", "1:1"].map((ratio) => (
															<button
																key={ratio}
																onClick={() =>
																	updateTechnicalSetting("aspect", ratio)
																}
																className={`px-3 py-2 rounded-md border ${
																	cinematicRecipe.technicalSettings.aspect ===
																	ratio
																		? "bg-blue-500 text-white"
																		: "bg-white hover:bg-gray-50"
																}`}
															>
																{ratio}
															</button>
														))}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</CollapsibleContent>
							</Collapsible>
						</div>

						<div className="lg:sticky lg:top-24 lg:h-fit">
							<Card>
								<CardHeader>
									<CardTitle>Mood Preview</CardTitle>
								</CardHeader>
								<CardContent>
									<div
										className={`h-64 rounded-lg transition-all duration-200 flex items-center justify-center ${getPreviewStyle()}`}
										aria-live="polite"
									>
										<div className="text-center text-gray-700">
											{canContinue ? (
												<div className="animate-pulse">
													<Sparkles className="h-12 w-12 mx-auto mb-4" />
													<p className="font-medium">
														Your cinematic mood is set! ✨
													</p>
												</div>
											) : (
												<div>
													<Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
													<p className="text-gray-500">
														Select styles to see preview
													</p>
												</div>
											)}
										</div>
									</div>

									{/* Selection Summary */}
									{canContinue && (
										<div className="mt-4 p-4 bg-blue-50 rounded-lg">
											<h4 className="font-semibold text-sm mb-2">
												Your Recipe:
											</h4>
											<div className="text-xs space-y-1 text-gray-600">
												<p>
													•{" "}
													{
														styleOptions.ambiance.find(
															(a) => a.id === cinematicRecipe.ambiance,
														)?.name
													}
												</p>
												<p>
													•{" "}
													{
														styleOptions.cameraMovement.find(
															(c) => c.id === cinematicRecipe.cameraMovement,
														)?.name
													}
												</p>
												<p>
													•{" "}
													{
														styleOptions.colorTone.find(
															(c) => c.id === cinematicRecipe.colorTone,
														)?.name
													}
												</p>
												<p>
													•{" "}
													{
														styleOptions.visualStyle.find(
															(v) => v.id === cinematicRecipe.visualStyle,
														)?.name
													}
												</p>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>

			<div className="fixed bottom-4 left-4 right-4 max-w-6xl mx-auto">
				<Button
					onClick={handleContinue}
					disabled={!canContinue || isLoading}
					className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
					size="lg"
				>
					{isLoading ? (
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Saving Recipe...
						</div>
					) : canContinue ? (
						<>Continue to AI Draft ✨</>
					) : (
						<>Select one per category</>
					)}
				</Button>
			</div>
		</div>
	);
}

"use client";

import {
	Check,
	ChevronRight,
	Edit,
	FileText,
	ImageIcon,
	Key,
	Music,
	Play,
	BookTemplate as Template,
	Trash2,
	Upload,
	Video,
	Volume2,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { TabNavigation } from "@/components/dashboard/shared/TabNavigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { mockAssets } from "@/lib/mock-data/assets";
import { mockAudioTracks } from "@/lib/mock-data/audioTracks";
import { mockVideos } from "@/lib/mock-data/videos";
import { storage } from "@/lib/storage";

interface Asset {
	id: number;
	name: string;
	createdAt: string;
	duration?: string;
}

interface DraftOrTemplate {
	id: string;
	name: string;
	type: "draft" | "template";
	createdAt: string;
	data: any;
}

export default function UserDashboard() {
	const router = useRouter();
	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({});
	const [selectedAssets, setSelectedAssets] = useState<
		Record<string, Set<number>>
	>({
		uploadedAssets: new Set(),
		generatedImages: new Set(),
		videos: new Set(),
		narrations: new Set(),
		musicTracks: new Set(),
	});
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
		null,
	);
	const [draftsAndTemplates, setDraftsAndTemplates] = useState<
		DraftOrTemplate[]
	>([]);
	const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
	const [showDeleteDraftConfirm, setShowDeleteDraftConfirm] = useState(false);
	const [savedVideos, setSavedVideos] = useState<any[]>([]);
	const [activeTab, setActiveTab] = useState("account");

	const toggleSection = (section: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const toggleAssetSelection = (section: string, assetId: number) => {
		setSelectedAssets((prev) => {
			const newSelected = { ...prev };
			const sectionSet = new Set(newSelected[section]);

			if (sectionSet.has(assetId)) {
				sectionSet.delete(assetId);
			} else {
				sectionSet.add(assetId);
			}

			newSelected[section] = sectionSet;
			return newSelected;
		});
	};

	const selectAllInSection = (section: string, assets: Asset[]) => {
		setSelectedAssets((prev) => ({
			...prev,
			[section]: new Set(assets.map((asset) => asset.id)),
		}));
	};

	const deselectAllInSection = (section: string) => {
		setSelectedAssets((prev) => ({
			...prev,
			[section]: new Set(),
		}));
	};

	const deleteSelectedAssets = (section: string) => {
		console.log(
			`Deleting assets from ${section}:`,
			Array.from(selectedAssets[section]),
		);

		setSelectedAssets((prev) => ({
			...prev,
			[section]: new Set(),
		}));
		setShowDeleteConfirm(null);
	};

	const toggleDraftSelection = (draftId: string) => {
		setSelectedDrafts((prev) => {
			const newSelected = new Set(prev);
			if (newSelected.has(draftId)) {
				newSelected.delete(draftId);
			} else {
				newSelected.add(draftId);
			}
			return newSelected;
		});
	};

	const selectAllDrafts = () => {
		setSelectedDrafts(new Set(draftsAndTemplates.map((item) => item.id)));
	};

	const deselectAllDrafts = () => {
		setSelectedDrafts(new Set());
	};

	const deleteSelectedDrafts = () => {
		const remaining = draftsAndTemplates.filter(
			(item) => !selectedDrafts.has(item.id),
		);
		setDraftsAndTemplates(remaining);
		storage.setItem("draftsAndTemplates", JSON.stringify(remaining));
		setSelectedDrafts(new Set());
		setShowDeleteDraftConfirm(false);
	};

	const loadDraft = (draft: DraftOrTemplate) => {
		storage.setItem("movieProject", JSON.stringify(draft.data));
		window.location.href = "/guided/step-2";
	};

	const loadTemplate = (template: DraftOrTemplate) => {
		const newProject = {
			...template.data,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
		};
		storage.setItem("movieProject", JSON.stringify(newProject));
		window.location.href = "/guided/step-1";
	};

	const useTemplate = (template: DraftOrTemplate) => {
		const newProject = {
			...template.data,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
		};
		storage.setItem("movieProject", JSON.stringify(newProject));
		window.location.href = "/guided/step-1";
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 1) return "1 day ago";
		if (diffDays < 30) return `${diffDays} days ago`;
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
		return `${Math.floor(diffDays / 365)} years ago`;
	};

	const convertToAssetFormat = (items: any[], type: string): Asset[] => {
		return items.map((item, index) => ({
			id: index + 1,
			name: item.filename || item.title || `${type} ${index + 1}`,
			createdAt: formatDate(
				new Date(item.uploadedAt || item.createdAt).toISOString(),
			),
			duration: item.duration ? `${item.duration} seconds` : undefined,
		}));
	};

	const mockData = {
		uploadedAssets: convertToAssetFormat(
			mockAssets.filter((a) => a.type === "image").slice(0, 15),
			"Asset",
		),
		generatedImages: convertToAssetFormat(
			mockAssets.filter((a) => a.type === "image").slice(0, 24),
			"Image",
		),
		videos: convertToAssetFormat(mockVideos.slice(0, 8), "Video"),
		narrations: convertToAssetFormat(
			mockAudioTracks.filter((a) => a.type === "narration").slice(0, 12),
			"Narration",
		),
		musicTracks: convertToAssetFormat(
			mockAudioTracks.filter((a) => a.type === "music").slice(0, 6),
			"Track",
		),
	};

	const renderAssetSection = (
		sectionKey: string,
		title: string,
		icon: React.ReactNode,
		description: string,
		assets: Asset[],
		gridCols: string,
		renderAssetCard: (asset: Asset) => React.ReactNode,
	) => {
		const selectedCount = selectedAssets[sectionKey].size;
		const hasSelection = selectedCount > 0;
		const allSelected = selectedCount === assets.length;

		return (
			<Card
				className="bg-slate-800 border-slate-700"
				id={sectionKey === "videos" ? "videos-section" : undefined}
			>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-white flex items-center gap-2">
								{icon}
								{title}
							</CardTitle>
							<CardDescription className="text-gray-400">
								{description} ({assets.length} total)
								{hasSelection && (
									<span className="text-blue-400 ml-2">
										• {selectedCount} selected
									</span>
								)}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							{hasSelection && (
								<>
									{showDeleteConfirm === sectionKey ? (
										<div className="flex gap-1">
											<Button
												onClick={() => deleteSelectedAssets(sectionKey)}
												size="sm"
												className="text-white bg-red-600 hover:bg-red-700 h-8 px-3 text-xs"
											>
												<Check className="h-3 w-3 mr-1" />
												Confirm Delete
											</Button>
											<Button
												onClick={() => setShowDeleteConfirm(null)}
												variant="outline"
												size="sm"
												className="text-white border-slate-600 hover:bg-slate-700 bg-transparent h-8 px-3 text-xs"
											>
												<X className="h-3 w-3 mr-1" />
												Cancel
											</Button>
										</div>
									) : (
										<Button
											onClick={() => setShowDeleteConfirm(sectionKey)}
											variant="outline"
											size="sm"
											className="text-red-400 border-red-600 hover:bg-red-900/20 bg-transparent h-8 px-3 text-xs"
										>
											<Trash2 className="h-3 w-3 mr-1" />
											Delete ({selectedCount})
										</Button>
									)}
								</>
							)}
							{assets.length >
								(sectionKey === "generatedImages"
									? 8
									: sectionKey === "videos" || sectionKey === "musicTracks"
										? 4
										: 6) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleSection(sectionKey)}
									className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
								>
									{expandedSections[sectionKey] ? "Show Less" : "View All"}
									<ChevronRight
										className={`ml-1 h-4 w-4 transition-transform ${expandedSections[sectionKey] ? "rotate-90" : ""}`}
									/>
								</Button>
							)}
						</div>
					</div>
					{assets.length > 0 && (
						<div className="flex items-center gap-4 pt-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									id={`select-all-${sectionKey}`}
									checked={allSelected}
									onCheckedChange={(checked) => {
										if (checked) {
											selectAllInSection(sectionKey, assets);
										} else {
											deselectAllInSection(sectionKey);
										}
									}}
									className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
								/>
								<Label
									htmlFor={`select-all-${sectionKey}`}
									className="text-sm text-gray-400 cursor-pointer"
								>
									Select All
								</Label>
							</div>
							{hasSelection && (
								<Button
									onClick={() => deselectAllInSection(sectionKey)}
									variant="ghost"
									size="sm"
									className="text-gray-400 hover:text-white hover:bg-slate-700 h-6 px-2 text-xs"
								>
									Clear Selection
								</Button>
							)}
						</div>
					)}
				</CardHeader>
				<CardContent>
					<div className={gridCols}>
						{assets
							.slice(
								0,
								expandedSections[sectionKey]
									? assets.length
									: sectionKey === "generatedImages"
										? 8
										: sectionKey === "videos" || sectionKey === "musicTracks"
											? 4
											: 6,
							)
							.map((asset) => (
								<div key={asset.id} className="relative">
									<div className="absolute top-2 left-2 z-10">
										<Checkbox
											checked={selectedAssets[sectionKey].has(asset.id)}
											onCheckedChange={() =>
												toggleAssetSelection(sectionKey, asset.id)
											}
											className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-slate-800/80 backdrop-blur-sm"
										/>
									</div>
									{renderAssetCard(asset)}
								</div>
							))}
					</div>
					{!expandedSections[sectionKey] &&
						assets.length >
							(sectionKey === "generatedImages"
								? 8
								: sectionKey === "videos" || sectionKey === "musicTracks"
									? 4
									: 6) && (
							<div className="mt-4 text-center">
								<p className="text-gray-400 text-sm">
									Showing{" "}
									{sectionKey === "generatedImages"
										? 8
										: sectionKey === "videos" || sectionKey === "musicTracks"
											? 4
											: 6}{" "}
									of {assets.length} {title.toLowerCase()}
								</p>
							</div>
						)}
				</CardContent>
			</Card>
		);
	};

	useEffect(() => {
		const saved = storage.getItem("draftsAndTemplates");
		if (saved) {
			try {
				setDraftsAndTemplates(JSON.parse(saved));
			} catch (error) {
				console.error("Failed to load drafts and templates:", error);
			}
		}

		const savedVideosData = storage.getItem("savedVideos");
		if (savedVideosData) {
			try {
				setSavedVideos(JSON.parse(savedVideosData));
			} catch (error) {
				console.error("Failed to load saved videos:", error);
			}
		}

		const urlParams = new URLSearchParams(window.location.search);
		const tabParam = urlParams.get("tab");
		if (
			tabParam &&
			["account", "assets", "drafts", "notifications"].includes(tabParam)
		) {
			setActiveTab(tabParam);
		}

		const sectionParam = urlParams.get("section");
		if (tabParam === "assets" && sectionParam === "videos") {
			setTimeout(() => {
				const videosSection = document.getElementById("videos-section");
				if (videosSection) {
					videosSection.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}, 100);
		}
	}, []);

	const handleVideoClick = (video: any) => {
		try {
			storage.setItem("movieProject", JSON.stringify(video.projectData));
			router.push("/guided/step-6");
		} catch (error) {
			console.error("[v0] Failed to load video project:", error);
		}
	};

	const tabs = [
		{ value: "account", label: "Account" },
		{ value: "assets", label: "Assets" },
		{
			value: "drafts",
			label: "Drafts & Templates",
			count: draftsAndTemplates.length,
		},
		{ value: "notifications", label: "Notifications" },
	];

	return (
		<div className="min-h-screen" style={{ backgroundColor: "#101a23" }}>
			<div className="container mx-auto space-y-4 md:space-y-6 px-4 md:px-6 py-6 md:py-10">
				<div className="text-center mb-6 md:mb-8">
					<h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
						User Dashboard
					</h1>
					<p className="text-sm md:text-base text-gray-400">
						Manage your account and creative assets
					</p>
				</div>

				<TabNavigation
					tabs={tabs}
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>

				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="space-y-4 md:space-y-6"
				>
					<TabsContent value="account" className="space-y-4 md:space-y-6">
						<Card className="bg-slate-800 border-slate-700">
							<CardHeader>
								<CardTitle className="text-white text-lg md:text-xl">
									Account Settings
								</CardTitle>
								<CardDescription className="text-gray-400 text-sm md:text-base">
									Manage your account preferences and security.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 md:space-y-6">
								<div className="space-y-2">
									<Label
										htmlFor="email"
										className="text-white text-sm md:text-base"
									>
										Email
									</Label>
									<Input
										id="email"
										type="email"
										defaultValue="john.doe@example.com"
										className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 min-h-[48px]"
									/>
								</div>

								<Separator className="bg-slate-600" />

								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
									<div className="space-y-1">
										<Label className="text-base text-white">
											Subscription Plan
										</Label>
										<p className="text-gray-400 text-sm">
											Pro Plan - $29/month
										</p>
									</div>
									<Button
										variant="outline"
										className="border-slate-600 text-white hover:bg-slate-700 bg-transparent min-h-[44px] w-full md:w-auto"
									>
										Manage Subscription
									</Button>
								</div>

								<Separator className="bg-slate-600" />

								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
									<div className="space-y-1">
										<Label className="text-base text-white">Password</Label>
										<p className="text-gray-400 text-sm">
											Last changed 3 months ago
										</p>
									</div>
									<Button
										variant="outline"
										className="border-slate-600 text-white hover:bg-slate-700 bg-transparent min-h-[44px] w-full md:w-auto"
									>
										<Key className="mr-2 h-4 w-4" />
										Change Password
									</Button>
								</div>

								<Separator className="bg-slate-600" />

								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
									<div className="space-y-1">
										<Label className="text-base text-white">Data Export</Label>
										<p className="text-gray-400 text-sm">
											Download a copy of your data
										</p>
									</div>
									<Button
										variant="outline"
										className="border-slate-600 text-white hover:bg-slate-700 bg-transparent min-h-[44px] w-full md:w-auto"
									>
										Export Data
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="assets" className="space-y-6">
						{renderAssetSection(
							"uploadedAssets",
							"Uploaded Assets",
							<Upload className="h-5 w-5" />,
							"Files you've uploaded to your projects",
							mockData.uploadedAssets,
							"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
							(asset) => (
								<Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer">
									<CardContent className="p-4">
										<div className="aspect-video bg-slate-600 rounded-lg mb-3 flex items-center justify-center">
											<Upload className="h-8 w-8 text-gray-400" />
										</div>
										<p className="text-white text-sm font-medium">
											{asset.name}
										</p>
										<p className="text-gray-400 text-xs">
											Uploaded {asset.createdAt}
										</p>
									</CardContent>
								</Card>
							),
						)}

						{renderAssetSection(
							"generatedImages",
							"Generated Images",
							<ImageIcon className="h-5 w-5" />,
							"AI-generated images from your projects",
							mockData.generatedImages,
							"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
							(asset) => (
								<Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer">
									<CardContent className="p-3">
										<div className="aspect-square bg-slate-600 rounded-lg mb-2 flex items-center justify-center">
											<ImageIcon className="h-6 w-6 text-gray-400" />
										</div>
										<p className="text-white text-xs truncate">{asset.name}</p>
										<p className="text-gray-400 text-xs">{asset.createdAt}</p>
									</CardContent>
								</Card>
							),
						)}

						{renderAssetSection(
							"videos",
							"Videos",
							<Video className="h-5 w-5" />,
							"Your rendered video invitations",
							mockData.videos.map((video, index) => ({
								id: video.id || index + 1, // Ensure ID exists
								name: video.name,
								createdAt: video.createdAt,
								duration: video.duration,
								projectData:
									mockVideos.find((v) => v.filename === video.name)
										?.projectData || {}, // Assuming projectData is in mockVideos
							})),
							"grid grid-cols-1 md:grid-cols-2 gap-4",
							(asset) => {
								// Find the original mock video to get projectData
								const originalVideo = mockVideos.find(
									(v) => v.filename === asset.name,
								);

								return (
									<Card
										className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer"
										onClick={() =>
											originalVideo && handleVideoClick(originalVideo)
										}
									>
										<CardContent className="p-4">
											<div className="aspect-video bg-slate-600 rounded-lg mb-3 flex items-center justify-center">
												<Video className="h-8 w-8 text-gray-400" />
											</div>
											<p className="text-white text-sm font-medium">
												{asset.name}
											</p>
											<p className="text-gray-400 text-xs">
												{asset.duration} • Created {asset.createdAt}
											</p>
										</CardContent>
									</Card>
								);
							},
						)}

						{renderAssetSection(
							"narrations",
							"Narrations",
							<Volume2 className="h-5 w-5" />,
							"AI-generated voice narrations",
							mockData.narrations,
							"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
							(asset) => (
								<Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer">
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
												<Volume2 className="h-6 w-6 text-gray-400" />
											</div>
											<div className="flex-1">
												<p className="text-white text-sm font-medium">
													{asset.name}
												</p>
												<p className="text-gray-400 text-xs">
													{asset.duration} • Created {asset.createdAt}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							),
						)}

						{renderAssetSection(
							"musicTracks",
							"Music Tracks",
							<Music className="h-5 w-5" />,
							"AI-generated background music",
							mockData.musicTracks,
							"grid grid-cols-1 md:grid-cols-2 gap-4",
							(asset) => (
								<Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer">
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
												<Music className="h-6 w-6 text-gray-400" />
											</div>
											<div className="flex-1">
												<p className="text-white text-sm font-medium">
													{asset.name}
												</p>
												<p className="text-gray-400 text-xs">
													{asset.duration} • Uplifting • {asset.createdAt}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							),
						)}
					</TabsContent>

					<TabsContent value="drafts" className="space-y-6">
						<Card className="bg-slate-800 border-slate-700">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-white flex items-center gap-2">
											<FileText className="h-5 w-5" />
											Drafts & Templates
										</CardTitle>
										<CardDescription className="text-gray-400">
											Saved drafts and templates for your video projects (
											{draftsAndTemplates.length} total)
											{selectedDrafts.size > 0 && (
												<span className="text-blue-400 ml-2">
													• {selectedDrafts.size} selected
												</span>
											)}
										</CardDescription>
									</div>
									{selectedDrafts.size > 0 && (
										<div className="flex items-center gap-2">
											{showDeleteDraftConfirm ? (
												<div className="flex gap-1">
													<Button
														onClick={deleteSelectedDrafts}
														size="sm"
														className="text-white bg-red-600 hover:bg-red-700 h-8 px-3 text-xs"
													>
														<Check className="h-3 w-3 mr-1" />
														Confirm Delete
													</Button>
													<Button
														onClick={() => setShowDeleteDraftConfirm(false)}
														variant="outline"
														size="sm"
														className="text-white border-slate-600 hover:bg-slate-700 bg-transparent h-8 px-3 text-xs"
													>
														<X className="h-3 w-3 mr-1" />
														Cancel
													</Button>
												</div>
											) : (
												<Button
													onClick={() => setShowDeleteDraftConfirm(true)}
													variant="outline"
													size="sm"
													className="text-red-400 border-red-600 hover:bg-red-900/20 bg-transparent h-8 px-3 text-xs"
												>
													<Trash2 className="h-3 w-3 mr-1" />
													Delete ({selectedDrafts.size})
												</Button>
											)}
										</div>
									)}
								</div>
								{draftsAndTemplates.length > 0 && (
									<div className="flex items-center gap-4 pt-2">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="select-all-drafts"
												checked={
													selectedDrafts.size === draftsAndTemplates.length &&
													draftsAndTemplates.length > 0
												}
												onCheckedChange={(checked) => {
													if (checked) {
														selectAllDrafts();
													} else {
														deselectAllDrafts();
													}
												}}
												className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
											/>
											<Label
												htmlFor="select-all-drafts"
												className="text-sm text-gray-400 cursor-pointer"
											>
												Select All
											</Label>
										</div>
										{selectedDrafts.size > 0 && (
											<Button
												onClick={deselectAllDrafts}
												variant="ghost"
												size="sm"
												className="text-gray-400 hover:text-white hover:bg-slate-700 h-6 px-2 text-xs"
											>
												Clear Selection
											</Button>
										)}
									</div>
								)}
							</CardHeader>
							<CardContent>
								{draftsAndTemplates.length === 0 ? (
									<EmptyState
										icon={<FileText className="h-12 w-12 text-gray-500" />}
										title="No drafts or templates yet"
										description="Save drafts from step 2 to see them here"
									/>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{draftsAndTemplates.map((item) => (
											<div key={item.id} className="relative">
												<div className="absolute top-2 left-2 z-10">
													<Checkbox
														checked={selectedDrafts.has(item.id)}
														onCheckedChange={() =>
															toggleDraftSelection(item.id)
														}
														className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-slate-800/80 backdrop-blur-sm"
													/>
												</div>
												<Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">
													<CardContent className="p-4">
														<div className="flex items-start gap-3 mb-3">
															<div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
																{item.type === "draft" ? (
																	<FileText className="h-5 w-5 text-gray-400" />
																) : (
																	<Template className="h-5 w-5 text-gray-400" />
																)}
															</div>
															<div className="flex-1 min-w-0">
																<p className="text-white text-sm font-medium truncate">
																	{item.name}
																</p>
																<p className="text-gray-400 text-xs capitalize">
																	{item.type}
																</p>
																<p className="text-gray-500 text-xs">
																	{formatDate(item.createdAt)}
																</p>
															</div>
														</div>
														<div className="flex gap-2">
															{item.type === "draft" ? (
																<Button
																	size="sm"
																	className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
																	onClick={() => loadDraft(item)}
																>
																	<Edit className="h-3 w-3 mr-1" />
																	Edit Draft
																</Button>
															) : (
																<Button
																	size="sm"
																	className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
																	onClick={() => loadTemplate(item)}
																>
																	<Play className="h-3 w-3 mr-1" />
																	Use Template
																</Button>
															)}
														</div>
													</CardContent>
												</Card>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="notifications" className="space-y-6">
						<Card className="bg-slate-800 border-slate-700">
							<CardHeader>
								<CardTitle className="text-white">
									Notification Preferences
								</CardTitle>
								<CardDescription className="text-gray-400">
									Choose what notifications you want to receive.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<Label className="text-base text-white">
												Email Notifications
											</Label>
											<p className="text-gray-400 text-sm">
												Receive notifications via email
											</p>
										</div>
										<Switch defaultChecked />
									</div>
									<Separator className="bg-slate-600" />
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<Label className="text-base text-white">
												Push Notifications
											</Label>
											<p className="text-gray-400 text-sm">
												Receive push notifications in your browser
											</p>
										</div>
										<Switch />
									</div>
									<Separator className="bg-slate-600" />
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<Label className="text-base text-white">
												Marketing Emails
											</Label>
											<p className="text-gray-400 text-sm">
												Receive emails about new features and updates
											</p>
										</div>
										<Switch defaultChecked />
									</div>
									<Separator className="bg-slate-600" />
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<Label className="text-base text-white">
												Security Alerts
											</Label>
											<p className="text-gray-400 text-sm">
												Important security notifications (always enabled)
											</p>
										</div>
										<Switch checked disabled />
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

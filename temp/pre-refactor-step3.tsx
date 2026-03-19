"use client";

import {
	ArrowLeft,
	Check,
	ChevronDown,
	ChevronUp,
	Home,
	LucideComponent as ImageIconComponent,
	Gavel as Label,
	Plus,
	Sparkles,
	Upload,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Conversation,
	ConversationContent,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { storage } from "@/lib/storage";

interface Scene {
	id: string;
	title: string;
	description: string;
	duration: 5 | 10;
	startFrameImage?: string;
	endFrameImage?: string;
	cinematicStyles: {
		ambiance: string;
		cameraMovement: string;
		colorTone: string;
		visualStyle: string;
	};
	mockupPreview?: string;
}

interface StyleCard {
	id: string;
	title: string;
	icon: string;
	descriptor: string;
	preview: string;
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	isApproved?: boolean;
}

const styleOptions = {
	ambiance: [
		{
			id: "golden-hour",
			title: "Golden-Hour",
			icon: "☀️",
			descriptor: "Warm, romantic lighting",
			preview: "/golden-hour-lighting.jpg",
		},
		{
			id: "dramatic",
			title: "Dramatic",
			icon: "🌟",
			descriptor: "High contrast shadows",
			preview: "/dramatic-lighting.jpg",
		},
		{
			id: "natural",
			title: "Natural",
			icon: "🌿",
			descriptor: "Soft, organic feel",
			preview: "/natural-lighting.jpg",
		},
		{
			id: "soft-glow",
			title: "Soft Glow",
			icon: "✨",
			descriptor: "Gentle, dreamy atmosphere",
			preview: "/soft-glow-lighting.jpg",
		},
	],
	cameraMovement: [
		{
			id: "slow-pan",
			title: "Slow-Pan",
			icon: "📹",
			descriptor: "Smooth horizontal movement",
			preview: "/slow-pan-camera.jpg",
		},
		{
			id: "dynamic-orbit",
			title: "Dynamic-Orbit",
			icon: "🔄",
			descriptor: "Circular motion around subject",
			preview: "/orbit-camera-movement.jpg",
		},
		{
			id: "static",
			title: "Static",
			icon: "📷",
			descriptor: "Fixed, stable composition",
			preview: "/static-camera.jpg",
		},
		{
			id: "zoom-in",
			title: "Zoom-In",
			icon: "🔍",
			descriptor: "Gradual focus on details",
			preview: "/zoom-in-camera.jpg",
		},
	],
	colorTone: [
		{
			id: "warm-colors",
			title: "Warm Colors",
			icon: "🧡",
			descriptor: "Cozy, inviting palette",
			preview: "/warm-color-tone.jpg",
		},
		{
			id: "saturated",
			title: "Saturated",
			icon: "🌈",
			descriptor: "Vibrant, bold colors",
			preview: "/saturated-colors.jpg",
		},
		{
			id: "natural",
			title: "Natural",
			icon: "🍃",
			descriptor: "Realistic color balance",
			preview: "/natural-colors.jpg",
		},
		{
			id: "cool-tones",
			title: "Cool Tones",
			icon: "💙",
			descriptor: "Calm, serene palette",
			preview: "/cool-color-tone.jpg",
		},
	],
	visualStyle: [
		{
			id: "cinematic",
			title: "Cinematic",
			icon: "🎬",
			descriptor: "Film-like quality",
			preview: "/cinematic-style.jpg",
		},
		{
			id: "retro",
			title: "Retro",
			icon: "📼",
			descriptor: "Vintage aesthetic",
			preview: "/retro-style.png",
		},
		{
			id: "modern",
			title: "Modern",
			icon: "🔲",
			descriptor: "Clean, contemporary look",
			preview: "/modern-style.png",
		},
		{
			id: "artistic",
			title: "Artistic",
			icon: "🎨",
			descriptor: "Creative, expressive feel",
			preview: "/abstract-expressionism.png",
		},
	],
};

export default function GuidedStep3() {
	const router = useRouter();

	const [scenes, setScenes] = useState<Scene[]>([]);
	const [activeTab, setActiveTab] = useState("");
	const [videoGenerationStates, setVideoGenerationStates] = useState<{
		[sceneId: string]: "idle" | "generating" | "completed";
	}>({});
	const [generatedVideos, setGeneratedVideos] = useState<{
		[sceneId: string]: string;
	}>({});

	const [generativeModalOpen, setGenerativeModalOpen] = useState(false);
	const [currentFrameType, setCurrentFrameType] = useState<"start" | "end">(
		"start",
	);
	const [currentSceneId, setCurrentSceneId] = useState("");
	const [uploadTab, setUploadTab] = useState<"upload" | "project">("upload");
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedImages, setGeneratedImages] = useState<string[]>([]);
	const [editPrompt, setEditPrompt] = useState("");
	const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
	const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
	const [uploadedImages, setUploadedImages] = useState<string[]>([]);
	const [mobileAccordionOpen, setMobileAccordionOpen] = useState<string | null>(
		null,
	);
	const [activeAssetTab, setActiveAssetTab] = useState<"upload" | "project">(
		"upload",
	);

	const [regenerationChatStates, setRegenerationChatStates] = useState<{
		[sceneId: string]: {
			isOpen: boolean;
			messages: ChatMessage[];
			input: string;
			status: "idle" | "streaming" | "submitted";
			approvedMessageId: string | null;
			showApproval?: boolean;
			approved?: boolean;
		};
	}>({});
	const [regenerationCounts, setRegenerationCounts] = useState<{
		[sceneId: string]: number;
	}>({});

	const [videoValidationStates, setVideoValidationStates] = useState<
		Record<string, boolean>
	>({});

	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(["scene-1"]),
	);

	const projectAssets = [
		{ name: "Asset 1", url: "/romantic-couple.png" },
		{ name: "Asset 2", url: "/elegant-wedding-sunset.png" },
		{ name: "Asset 3", url: "/wedding-rings-macro.png" },
		{ name: "Asset 4", url: "/happy-wedding-party.png" },
	];

	useEffect(() => {
		const savedProject = storage.getItem("movieProject");
		console.log("[v0] Raw storage data:", savedProject); // Debug log

		if (savedProject) {
			try {
				const projectData = JSON.parse(savedProject);
				console.log("[v0] Parsed project data:", projectData); // Debug log

				if (
					projectData.scenes &&
					Array.isArray(projectData.scenes) &&
					projectData.scenes.length > 0
				) {
					console.log("[v0] Found scenes in storage:", projectData.scenes); // Debug log

					// Convert step-2 scenes to step-3 scene format with cinematicStyles
					const convertedScenes = projectData.scenes.map(
						(scene: any, index: number) => ({
							id: scene.id || `scene-${index + 1}`,
							title: scene.title || `Scene ${index + 1}`,
							description:
								scene.description || scene.content || "Scene description",
							duration: scene.duration || 10,
							startFrameImage: scene.startFrameImage,
							endFrameImage: scene.endFrameImage,
							cinematicStyles: scene.cinematicStyles || {
								ambiance: "",
								cameraMovement: "",
								colorTone: "",
								visualStyle: "",
							},
							mockupPreview: scene.mockupPreview,
						}),
					);

					console.log("[v0] Converted scenes:", convertedScenes); // Debug log
					setScenes(convertedScenes);

					const activeSceneId = localStorage.getItem("activeSceneId");
					if (
						activeSceneId &&
						convertedScenes.find((scene) => scene.id === activeSceneId)
					) {
						setActiveTab(activeSceneId);
						console.log(
							"[v0] Set active tab from localStorage:",
							activeSceneId,
						); // Debug log
						// Clear the localStorage value after using it
						localStorage.removeItem("activeSceneId");
					} else if (convertedScenes.length > 0) {
						const firstSceneId = convertedScenes[0].id;
						setActiveTab(firstSceneId);
						console.log("[v0] Set active tab to:", firstSceneId); // Debug log
					}
				} else {
					console.log(
						"[v0] No scenes found in project data - using default scenes",
					);
					// Use default scenes if no scenes found
					const defaultScenes = [
						{
							id: "scene-1",
							title: "Opening Welcome",
							description: "A warm, intimate greeting featuring couple's names",
							duration: 10,
							cinematicStyles: {
								ambiance: "",
								cameraMovement: "",
								colorTone: "",
								visualStyle: "",
							},
						},
						{
							id: "scene-2",
							title: "Event Details",
							description: "Essential information with elegant typography",
							duration: 10,
							cinematicStyles: {
								ambiance: "",
								cameraMovement: "",
								colorTone: "",
								visualStyle: "",
							},
						},
						{
							id: "scene-3",
							title: "Call to Action",
							description: "Heartfelt invitation with RSVP request",
							duration: 10,
							cinematicStyles: {
								ambiance: "",
								cameraMovement: "",
								colorTone: "",
								visualStyle: "",
							},
						},
					];
					setScenes(defaultScenes);

					const activeSceneId = localStorage.getItem("activeSceneId");
					if (
						activeSceneId &&
						defaultScenes.find((scene) => scene.id === activeSceneId)
					) {
						setActiveTab(activeSceneId);
						localStorage.removeItem("activeSceneId");
					} else {
						setActiveTab("scene-1");
					}
				}
			} catch (error) {
				console.error("[v0] Error parsing storage data:", error);
				// Use default scenes on error
				const defaultScenes = [
					{
						id: "scene-1",
						title: "Opening Welcome",
						description: "A warm, intimate greeting featuring couple's names",
						duration: 10,
						cinematicStyles: {
							ambiance: "",
							cameraMovement: "",
							colorTone: "",
							visualStyle: "",
						},
					},
					{
						id: "scene-2",
						title: "Event Details",
						description: "Essential information with elegant typography",
						duration: 10,
						cinematicStyles: {
							ambiance: "",
							cameraMovement: "",
							colorTone: "",
							visualStyle: "",
						},
					},
					{
						id: "scene-3",
						title: "Call to Action",
						description: "Heartfelt invitation with RSVP request",
						duration: 10,
						cinematicStyles: {
							ambiance: "",
							cameraMovement: "",
							colorTone: "",
							visualStyle: "",
						},
					},
				];
				setScenes(defaultScenes);

				const activeSceneId = localStorage.getItem("activeSceneId");
				if (
					activeSceneId &&
					defaultScenes.find((scene) => scene.id === activeSceneId)
				) {
					setActiveTab(activeSceneId);
					localStorage.removeItem("activeSceneId");
				} else {
					setActiveTab("scene-1");
				}
			}
		} else {
			console.log("[v0] No storage data found - using default scenes");
			// Use default scenes if no data found
			const defaultScenes = [
				{
					id: "scene-1",
					title: "Opening Welcome",
					description: "A warm, intimate greeting featuring couple's names",
					duration: 10,
					cinematicStyles: {
						ambiance: "",
						cameraMovement: "",
						colorTone: "",
						visualStyle: "",
					},
				},
				{
					id: "scene-2",
					title: "Event Details",
					description: "Essential information with elegant typography",
					duration: 10,
					cinematicStyles: {
						ambiance: "",
						cameraMovement: "",
						colorTone: "",
						visualStyle: "",
					},
				},
				{
					id: "scene-3",
					title: "Call to Action",
					description: "Heartfelt invitation with RSVP request",
					duration: 10,
					cinematicStyles: {
						ambiance: "",
						cameraMovement: "",
						colorTone: "",
						visualStyle: "",
					},
				},
			];
			setScenes(defaultScenes);

			const activeSceneId = localStorage.getItem("activeSceneId");
			if (
				activeSceneId &&
				defaultScenes.find((scene) => scene.id === activeSceneId)
			) {
				setActiveTab(activeSceneId);
				localStorage.removeItem("activeSceneId");
			} else {
				setActiveTab("scene-1");
			}
		}
	}, []);

	useEffect(() => {
		const savedProject = storage.getItem("movieProject");
		if (savedProject) {
			try {
				const projectData = JSON.parse(savedProject);
				const updatedProject = {
					...projectData,
					scenes: scenes,
				};
				storage.setItem("movieProject", JSON.stringify(updatedProject));
			} catch (error) {
				console.error("Failed to save scenes to storage:", error);
			}
		}
	}, [scenes]);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files) {
			const newImages: string[] = [];
			for (let i = 0; i < files.length; i++) {
				newImages.push(URL.createObjectURL(files[i]));
			}
			setUploadedImages((prev) => [...prev, ...newImages]);
		}
	};

	const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
	const maxDuration = 30;

	const openGenerativeModal = (sceneId: string, frameType: "start" | "end") => {
		setCurrentSceneId(sceneId);
		setCurrentFrameType(frameType);
		const scene = scenes.find((s) => s.id === sceneId);
		setEditPrompt(scene?.description || "");
		setGenerativeModalOpen(true);
		setSelectedAssets([]);
		setGeneratedImages([]);
	};

	const generateImages = async () => {
		setIsGenerating(true);
		// Simulate AI generation
		await new Promise((resolve) => setTimeout(resolve, 3000));

		const mockImages = [
			"/abstract-geometric-shapes.png",
			"/abstract-geometric-shapes.png",
			"/abstract-geometric-shapes.png",
			"/abstract-geometric-shapes.png",
		];
		setGeneratedImages(mockImages);
		setIsGenerating(false);
	};

	const applyAsFrame = (imageUrl: string) => {
		setScenes((prev) =>
			prev.map((scene) =>
				scene.id === currentSceneId
					? {
							...scene,
							[currentFrameType === "start"
								? "startFrameImage"
								: "endFrameImage"]: imageUrl,
						}
					: scene,
			),
		);
		setGenerativeModalOpen(false);
		setGeneratedImages([]);
		setSelectedAssets([]);
	};

	const updateSceneStyle = (
		sceneId: string,
		category: keyof Scene["cinematicStyles"],
		styleId: string,
	) => {
		setScenes((prev) =>
			prev.map((scene) =>
				scene.id === sceneId
					? {
							...scene,
							cinematicStyles: {
								...scene.cinematicStyles,
								[category]: styleId,
							},
						}
					: scene,
			),
		);
		generateMockupPreview(sceneId);
	};

	const updateSceneDuration = (sceneId: string, duration: 5 | 10) => {
		setScenes((prev) =>
			prev.map((scene) =>
				scene.id === sceneId ? { ...scene, duration } : scene,
			),
		);
	};

	const generateMockupPreview = async (sceneId: string) => {
		setIsGeneratingMockup(true);
		await new Promise((resolve) => setTimeout(resolve, 2000));

		setScenes((prev) =>
			prev.map((scene) =>
				scene.id === sceneId
					? {
							...scene,
							mockupPreview: `/placeholder.svg?height=200&width=300&query=scene mockup preview`,
						}
					: scene,
			),
		);
		setIsGeneratingMockup(false);
	};

	const canContinue = () => {
		return (
			scenes.every((scene) => scene.startFrameImage && scene.endFrameImage) &&
			totalDuration <= maxDuration
		);
	};

	const validateVideo = (sceneId: string) => {
		setVideoValidationStates((prev) => ({
			...prev,
			[sceneId]: true,
		}));
	};

	const handleGenerateVideoClick = (sceneId: string) => {
		console.log(`[v0] Starting video generation for scene: ${sceneId}`);
		setVideoGenerationStates((prev) => ({
			...prev,
			[sceneId]: "generating",
		}));

		// Simulate video generation process
		setTimeout(() => {
			console.log(`[v0] Video generation completed for scene: ${sceneId}`);
			setVideoGenerationStates((prev) => ({
				...prev,
				[sceneId]: "completed",
			}));

			// Generate a mock video URL
			setGeneratedVideos((prev) => ({
				...prev,
				[sceneId]: "/placeholder-video.mp4",
			}));
		}, 3000);
	};

	const getNextAction = () => {
		console.log("[v0] Video generation states:", videoGenerationStates);
		console.log("[v0] Video validation states:", videoValidationStates);
		console.log("[v0] Active tab:", activeTab);

		const currentScene = scenes.find((s) => s.id === activeTab);
		const currentSceneIndex = scenes.findIndex((s) => s.id === activeTab);

		if (!currentScene) {
			return {
				text: "Generate Scene Video",
				disabled: true,
				action: () => {},
			};
		}

		const isCurrentSceneGenerated =
			videoGenerationStates[currentScene.id] === "completed";
		const isCurrentSceneValidated =
			videoValidationStates[currentScene.id] === true;

		console.log(
			`[v0] Current scene ${currentScene.id}: generated=${isCurrentSceneGenerated}, validated=${isCurrentSceneValidated}`,
		);

		// Check if ALL scenes are validated
		const allScenesValidated = scenes.every(
			(scene) =>
				videoGenerationStates[scene.id] === "completed" &&
				videoValidationStates[scene.id] === true,
		);

		console.log("[v0] All scenes validated:", allScenesValidated);

		const setActiveScene = (sceneId: string) => {
			setActiveTab(sceneId);
		};

		// If all scenes are validated, enable continue button
		if (allScenesValidated) {
			return {
				text: "Continue to Step 4",
				disabled: false,
				action: () => {
					router.push("/guided/step-4");
				},
			};
		}

		// If current scene has generated video but not validated
		if (isCurrentSceneGenerated && !isCurrentSceneValidated) {
			return {
				text: "Validate video to continue",
				disabled: true,
				action: () => {},
			};
		}

		// If current scene is not generated yet
		if (!isCurrentSceneGenerated) {
			return {
				text: `Generate Scene ${currentSceneIndex + 1} Video`,
				disabled: true,
				action: () => {},
			};
		}

		const nextUnvalidatedScene = scenes.find(
			(scene) =>
				videoGenerationStates[scene.id] !== "completed" ||
				videoValidationStates[scene.id] !== true,
		);

		if (nextUnvalidatedScene) {
			return {
				text: `Go to ${nextUnvalidatedScene.title}`,
				disabled: false,
				action: () => {
					setActiveScene(nextUnvalidatedScene.id);
					setExpandedSections(
						(prev) => new Set([...prev, nextUnvalidatedScene.id]),
					);
					setTimeout(() => {
						console.log(
							"[v0] Scrolling to element:",
							`accordion-${nextUnvalidatedScene.id}`,
						);
						const element = document.getElementById(
							`accordion-${nextUnvalidatedScene.id}`,
						);
						console.log("[v0] Element found:", element);
						if (element) {
							element.scrollIntoView({ behavior: "smooth", block: "start" });
							console.log("[v0] Scroll initiated");
						} else {
							console.log("[v0] Element not found");
						}
					}, 100);
				},
			};
		}

		return {
			text: "Continue to Step 4",
			disabled: false,
			action: () => {
				router.push("/guided/step-4");
			},
		};
	};

	useEffect(() => {
		console.log("[v0] Video generation states changed:", videoGenerationStates);
		console.log("[v0] Video validation states changed:", videoValidationStates);
		// Force re-render of button state when validation changes
		const action = getNextAction();
		console.log(
			"[v0] Next action updated:",
			action.text,
			"disabled:",
			action.disabled,
		);
	}, [videoGenerationStates, videoValidationStates, activeTab]);

	const handleContinue = () => {
		const nextAction = getNextAction();
		console.log("[v0] Next action:", nextAction);
		if (
			nextAction.action &&
			typeof nextAction.action === "function" &&
			!nextAction.disabled
		) {
			nextAction.action();
		}
	};

	const handleUseAsFrame = (imageUrl: string) => {
		applyAsFrame(imageUrl);
	};

	const applySelectedAssets = (imageUrl: string) => {
		applyAsFrame(imageUrl);
		setSelectedAssets([]);
	};

	const removeSelectedAsset = (imageUrl: string) => {
		setSelectedAssets((prev) => prev.filter((url) => url !== imageUrl));
	};

	// Define options for each cinematic style
	const ambianceOptions = styleOptions.ambiance;
	const cameraMovementOptions = styleOptions.cameraMovement;
	const colorToneOptions = styleOptions.colorTone;
	const visualStyleOptions = styleOptions.visualStyle;

	// Function to update cinematic style
	const updateCinematicStyle = (
		sceneId: string,
		category: keyof Scene["cinematicStyles"],
		styleId: string,
	) => {
		setScenes((prev) =>
			prev.map((scene) =>
				scene.id === sceneId
					? {
							...scene,
							cinematicStyles: {
								...scene.cinematicStyles,
								[category]: styleId,
							},
						}
					: scene,
			),
		);
		generateMockupPreview(sceneId);
	};

	const toggleAssetSelection = (imageUrl: string) => {
		console.log("[v0] Toggling asset selection for:", imageUrl);
		console.log("[v0] Current selected assets:", selectedAssets);

		setSelectedAssets((prev) => {
			if (prev.includes(imageUrl)) {
				const newSelection = prev.filter((url) => url !== imageUrl);
				console.log("[v0] Removing asset, new selection:", newSelection);
				return newSelection;
			} else {
				const newSelection = [...prev, imageUrl];
				console.log("[v0] Adding asset, new selection:", newSelection);
				return newSelection;
			}
		});
	};

	const handleGenerateImages = async () => {
		setIsGenerating(true);
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const mockImages = [
			"/abstract-geometric-shapes.png?v=1",
			"/romantic-couple.png?v=2",
			"/elegant-wedding-sunset.png?v=3",
			"/wedding-rings-macro.png?v=4",
		];
		setGeneratedImages(mockImages);
		setIsGenerating(false);
	};

	const deleteFrame = (sceneId: string, frameType: "start" | "end") => {
		setScenes((prev) =>
			prev.map((scene) =>
				scene.id === sceneId
					? {
							...scene,
							[frameType === "start" ? "startFrameImage" : "endFrameImage"]:
								null,
						}
					: scene,
			),
		);
	};

	const handleRegenerateVideoClick = (sceneId: string) => {
		const currentCount = regenerationCounts[sceneId] || 0;
		if (currentCount >= 2) {
			alert("Maximum regeneration limit reached (3 total generations)");
			return;
		}

		setRegenerationChatStates((prev) => ({
			...prev,
			[sceneId]: {
				isOpen: true,
				messages: [
					{
						id: "initial",
						role: "assistant",
						content: `I'll help you refine this scene. What would you like to change about the current video?

**Current Scene:** ${scenes.find((s) => s.id === sceneId)?.title}
${scenes.find((s) => s.id === sceneId)?.description}

Please describe what you'd like to improve or change in the video generation.`,
						isApproved: false,
					},
				],
				input: "",
				status: "idle",
				approvedMessageId: null,
				showApproval: false,
				approved: false,
			},
		}));

		setTimeout(() => {
			setRegenerationChatStates((prev) => ({
				...prev,
				[sceneId]: {
					...prev[sceneId],
					status: "streaming",
					showApproval: false,
					approved: false,
				},
			}));

			const aiResponses = [
				`**Updated Scene Direction:** Based on your feedback, here's a refined approach.

**Enhanced ${scenes.find((s) => s.id === sceneId)?.title}**
I've incorporated your suggestions to create a more compelling visual narrative. The new version will feature improved pacing, better visual transitions, and enhanced emotional impact.

**Key Improvements:**
- More dynamic camera movements
- Enhanced lighting and color grading
- Improved timing and rhythm
- Better integration of your visual elements

This refined direction will create a more engaging and polished scene that better captures your vision.`,

				`**Revised Concept:** Here's a fresh take on your scene.

**Reimagined ${scenes.find((s) => s.id === sceneId)?.title}**
Taking your feedback into account, I've developed a new creative direction that addresses your concerns while maintaining the core message.

**New Approach:**
- Different visual style and mood
- Alternative pacing and structure  
- Enhanced storytelling elements
- Improved visual flow and composition

This new direction will give your scene a completely different feel while staying true to your overall vision.`,
			];

			const randomResponse =
				aiResponses[Math.floor(Math.random() * aiResponses.length)];

			const aiMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: randomResponse,
				isApproved: false,
			};

			setRegenerationChatStates((prev) => ({
				...prev,
				[sceneId]: {
					...prev[sceneId],
					messages: [...prev[sceneId].messages, aiMessage],
					status: "idle",
					showApproval: true,
				},
			}));
		}, 1500);
	};

	const handleChatSubmit = (sceneId: string, e: React.FormEvent) => {
		e.preventDefault();
		const chatState = regenerationChatStates[sceneId];
		if (!chatState?.input.trim()) return;

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			role: "user",
			content: chatState.input,
		};

		setRegenerationChatStates((prev) => ({
			...prev,
			[sceneId]: {
				...prev[sceneId],
				messages: [...prev[sceneId].messages, userMessage],
				input: "",
				status: "submitted",
				showApproval: false,
				approved: false,
			},
		}));

		setTimeout(() => {
			setRegenerationChatStates((prev) => ({
				...prev,
				[sceneId]: {
					...prev[sceneId],
					status: "streaming",
					showApproval: false,
					approved: false,
				},
			}));

			const aiResponses = [
				`**Updated Scene Direction:** Based on your feedback, here's a refined approach.

**Enhanced ${scenes.find((s) => s.id === sceneId)?.title}**
I've incorporated your suggestions to create a more compelling visual narrative. The new version will feature improved pacing, better visual transitions, and enhanced emotional impact.

**Key Improvements:**
- More dynamic camera movements
- Enhanced lighting and color grading
- Improved timing and rhythm
- Better integration of your visual elements

This refined direction will create a more engaging and polished scene that better captures your vision.`,

				`**Revised Concept:** Here's a fresh take on your scene.

**Reimagined ${scenes.find((s) => s.id === sceneId)?.title}**
Taking your feedback into account, I've developed a new creative direction that addresses your concerns while maintaining the core message.

**New Approach:**
- Different visual style and mood
- Alternative pacing and structure  
- Enhanced storytelling elements
- Improved visual flow and composition

This new direction will give your scene a completely different feel while staying true to your overall vision.`,
			];

			const randomResponse =
				aiResponses[Math.floor(Math.random() * aiResponses.length)];

			const aiMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: randomResponse,
				isApproved: false,
			};

			setRegenerationChatStates((prev) => ({
				...prev,
				[sceneId]: {
					...prev[sceneId],
					messages: [...prev[sceneId].messages, aiMessage],
					status: "idle",
					showApproval: true,
					approved: false,
				},
			}));
		}, 1500);
	};

	const approveChatMessage = (sceneId: string, messageId: string) => {
		setRegenerationChatStates((prev) => ({
			...prev,
			[sceneId]: {
				...prev[sceneId],
				messages: prev[sceneId].messages.map((msg) => ({
					...msg,
					isApproved: msg.id === messageId ? true : false,
				})),
				approvedMessageId: messageId,
				showApproval: false,
				approved: true,
			},
		}));
	};

	const handleRegenerateApprovedVideo = async (sceneId: string) => {
		const currentCount = regenerationCounts[sceneId] || 0;
		setRegenerationCounts((prev) => ({
			...prev,
			[sceneId]: currentCount + 1,
		}));

		// Close chatbot
		setRegenerationChatStates((prev) => ({
			...prev,
			[sceneId]: {
				...prev[sceneId],
				isOpen: false,
				showApproval: false,
				approved: false,
			},
		}));

		// Start video generation
		await handleGenerateVideo(sceneId);
	};

	const handleGenerateVideo = async (sceneId: string) => {
		console.log(`[v0] Starting video generation for scene: ${sceneId}`);

		setVideoGenerationStates((prev) => ({
			...prev,
			[sceneId]: "generating",
		}));

		try {
			// Simulate video generation with a delay
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Mock generated video URL - replace with actual API call
			const mockVideoUrl = "/placeholder-video.mp4";

			setGeneratedVideos((prev) => ({
				...prev,
				[sceneId]: mockVideoUrl,
			}));

			setVideoGenerationStates((prev) => ({
				...prev,
				[sceneId]: "completed",
			}));

			console.log(`[v0] Video generation completed for scene: ${sceneId}`);

			setTimeout(() => {
				const nextUnvalidatedScene = scenes.find(
					(scene) =>
						scene.id !== sceneId &&
						(videoGenerationStates[scene.id] !== "completed" ||
							videoValidationStates[scene.id] !== true),
				);

				if (nextUnvalidatedScene) {
					console.log(
						`[v0] Auto-advancing to next scene: ${nextUnvalidatedScene.id}`,
					);
					setActiveTab(nextUnvalidatedScene.id);
					setExpandedSections(
						(prev) => new Set([...prev, nextUnvalidatedScene.id]),
					);

					// Scroll to the next scene
					setTimeout(() => {
						const element = document.getElementById(
							`accordion-${nextUnvalidatedScene.id}`,
						);
						if (element) {
							element.scrollIntoView({ behavior: "smooth", block: "start" });
						}
					}, 100);
				}
			}, 500);
		} catch (error) {
			console.error(
				`[v0] Video generation failed for scene: ${sceneId}`,
				error,
			);
			setVideoGenerationStates((prev) => ({
				...prev,
				[sceneId]: "idle",
			}));
		}
	};

	const toggleSection = (sectionId: string) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sectionId)) {
				newSet.delete(sectionId);
			} else {
				newSet.add(sectionId);
			}
			return newSet;
		});
	};

	const nextAction = getNextAction();

	const applySelectedAsset = (imageUrl: string) => {
		setScenes((prevScenes) =>
			prevScenes.map((scene) =>
				scene.id === currentSceneId
					? {
							...scene,
							[currentFrameType === "start"
								? "startFrameImage"
								: "endFrameImage"]: imageUrl,
						}
					: scene,
			),
		);
		setGenerativeModalOpen(false);
	};

	// <ADD> New functions for chat modal
	const handleCloseChatModal = (sceneId: string) => {
		setRegenerationChatStates((prev) => ({
			...prev,
			[sceneId]: {
				...prev[sceneId],
				isOpen: false,
			},
		}));
	};

	const updateChatInput = (sceneId: string, input: string) => {
		setRegenerationChatStates((prev) => ({
			...prev,
			[sceneId]: {
				...prev[sceneId],
				input: input,
			},
		}));
	};

	const handleApproveDirection = (sceneId: string) => {
		setRegenerationChatStates((prev) => {
			const currentState = prev[sceneId];
			if (!currentState || !currentState.messages.length) return prev;

			const lastMessageIndex = currentState.messages.length - 1;
			const updatedMessages = currentState.messages.map((msg, index) => ({
				...msg,
				isApproved: index === lastMessageIndex ? true : false,
			}));

			return {
				...prev,
				[sceneId]: {
					...currentState,
					approved: true,
					messages: updatedMessages,
					approvedMessageId: currentState.messages[lastMessageIndex]?.id,
				},
			};
		});
	};

	const handleFinalRegenerate = (sceneId: string) => {
		// Placeholder for final regenerate logic
		console.log(`Final regenerate for scene ${sceneId} initiated!`);
	};

	return (
		<div className="min-h-screen" style={{ backgroundColor: "#101a23" }}>
			{/* Navigation Header */}
			<div className="fixed top-0 left-0 right-0 z-40 bg-[#101a23] border-b border-[#314d68]">
				<div className="flex items-center justify-between px-4 py-4">
					{/* Back Button */}
					<button
						onClick={() => router.push("/guided/step-2b")}
						className="flex items-center gap-2 text-white hover:bg-[#223649] px-3 py-2 rounded-lg transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="hidden md:inline">Back</span>
					</button>

					{/* Progress Component */}
					<div className="flex-1 max-w-md mx-4 md:mx-8">
						<Progress
							value={50}
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
							</span>
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									3
								</div>
								<span className="hidden sm:inline">🎨</span>
							</span>
							{[4, 5, 6].map((num) => (
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

					{/* Home Button */}
					<Link href="/">
						<button className="flex items-center gap-2 text-white hover:bg-[#223649] px-3 py-2 rounded-lg transition-colors">
							<Home className="h-4 w-4" />
							<span className="hidden md:inline">Home</span>
						</button>
					</Link>
				</div>
			</div>

			{/* Title Section */}
			<div className="text-center mb-8 pt-24 md:pt-28">
				<h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
					Step 3/5: Visual Design 🎨
				</h1>
				<p className="text-blue-400 text-lg italic">
					Create compelling visuals for each scene ({totalDuration}s /{" "}
					{maxDuration}s limit)
				</p>
			</div>

			<div className="pt-4 md:pt-8 pb-20">
				<div className="max-w-7xl mx-auto px-4">
					{/* Desktop title - hidden on mobile */}
					<div className="hidden md:block text-center mb-8"></div>

					{/* Mobile Layout */}
					<div className="md:hidden space-y-4">
						{scenes.map((scene) => (
							<div
								key={scene.id}
								id={`accordion-${scene.id}`}
								className="border border-gray-600 rounded-lg overflow-hidden"
							>
								<button
									className="w-full text-left p-4 flex items-center justify-between"
									onClick={() => toggleSection(scene.id)}
								>
									<div className="flex items-center gap-3">
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
												true
													? "bg-green-500 text-white"
													: "bg-[#314d68] text-gray-300"
											}`}
										>
											{true ? <Check className="h-4 w-4" /> : 1}
										</div>
										<div>
											<CardTitle className="text-white text-base">
												{scene.title}
											</CardTitle>
											<p className="text-xs text-gray-400 mt-1">
												{true ? "Complete" : `0/3 items done`}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span
											className="text-xs px-2 py-1 rounded"
											style={{
												backgroundColor:
													scene.duration === 5 ? "#0d7ff2" : "#314d68",
												color: "white",
											}}
										>
											{scene.duration}s
										</span>
										{expandedSections.has(scene.id) ? (
											<ChevronUp className="h-5 w-5 text-gray-400" />
										) : (
											<ChevronDown className="h-5 w-5 text-gray-400" />
										)}
									</div>
								</button>

								{expandedSections.has(scene.id) && (
									<div className="p-4">
										{/* Scene description */}
										<div className="bg-[#223649] p-3 rounded-lg mb-4">
											<p className="text-gray-300 text-sm">
												{scene.description}
											</p>
										</div>

										{/* Progress checklist */}
										<div className="space-y-3">
											<h3 className="text-white font-medium text-sm">
												Complete these steps:
											</h3>

											{/* Start Frame Task */}
											<div
												className={`flex items-center gap-3 p-3 rounded-lg border ${
													true
														? "bg-green-500/10 border-green-500/30"
														: "bg-[#223649] border-[#314d68]"
												}`}
											>
												<div
													className={`w-6 h-6 rounded-full flex items-center justify-center ${
														true
															? "bg-green-500 text-white"
															: "bg-[#314d68] text-gray-400"
													}`}
												>
													{true ? <Check className="h-3 w-3" /> : "1"}
												</div>
												<div className="flex-1">
													<p className="text-white text-sm font-medium">
														Add Start Frame
													</p>
													<p className="text-gray-400 text-xs">
														This will be the first frame that appears in this
														scene
													</p>
												</div>
												<Button
													size="sm"
													variant={true ? "outline" : "default"}
													onClick={() => openGenerativeModal(scene.id, "start")}
													className={
														true
															? "border-green-500 text-green-400 hover:bg-green-500/10"
															: "bg-[#0d7ff2] hover:bg-blue-600"
													}
												>
													{true ? "Change" : "Add"}
												</Button>
											</div>

											{/* End Frame Task */}
											<div
												className={`flex items-center gap-3 p-3 rounded-lg border ${
													true
														? "bg-green-500/10 border-green-500/30"
														: "bg-[#223649] border-[#314d68]"
												}`}
											>
												<div
													className={`w-6 h-6 rounded-full flex items-center justify-center ${
														true
															? "bg-green-500 text-white"
															: "bg-[#314d68] text-gray-400"
													}`}
												>
													{true ? <Check className="h-3 w-3" /> : "2"}
												</div>
												<div className="flex-1">
													<p className="text-white text-sm font-medium">
														Add End Frame
													</p>
													<p className="text-gray-400 text-xs">
														Choose or create closing visual
													</p>
												</div>
												<Button
													size="sm"
													variant={true ? "outline" : "default"}
													onClick={() => openGenerativeModal(scene.id, "end")}
													className={
														true
															? "border-green-500 text-green-400 hover:bg-green-500/10"
															: "bg-[#0d7ff2] hover:bg-blue-600"
													}
												>
													{true ? "Change" : "Add"}
												</Button>
											</div>
										</div>

										{/* Mobile Generate Scene Video Button */}
										{(!videoGenerationStates[scene.id] ||
											videoGenerationStates[scene.id] === "idle") &&
											true &&
											true && (
												<div className="mt-6">
													<Button
														onClick={() => {
															console.log(
																`[v0] Mobile generate button clicked for scene: ${scene.id}`,
															);
															console.log(
																`[v0] Current generation state:`,
																videoGenerationStates[scene.id],
															);
															console.log(`[v0] Has start frame:`, true);
															console.log(`[v0] Has end frame:`, true);
															handleGenerateVideoClick(scene.id);
														}}
														className="w-full bg-[#0d7ff2] hover:bg-blue-600 text-white py-3"
														disabled={
															videoGenerationStates[scene.id] === "generating"
														}
													>
														{videoGenerationStates[scene.id] === "generating"
															? "Generating Video..."
															: `Generate Scene 1 Video`}
													</Button>
												</div>
											)}

										{videoGenerationStates[scene.id] === "generating" && (
											<div className="mt-6">
												<div className="bg-gray-800 rounded-lg p-6 text-center">
													<div className="flex flex-col items-center space-y-4">
														<div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
															<svg
																className="w-6 h-6 text-white animate-spin"
																fill="none"
																viewBox="0 0 24 24"
															>
																<circle
																	className="opacity-25"
																	cx="12"
																	cy="12"
																	r="10"
																	stroke="currentColor"
																	strokeWidth="4"
																></circle>
																<path
																	className="opacity-75"
																	fill="currentColor"
																	d="M4 12a8 8 0 108-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																></path>
															</svg>
														</div>
														<div>
															<p className="text-white font-medium mb-2">
																Generating Scene Video...
															</p>
															<p className="text-sm text-gray-400">
																Creating your 10s video
															</p>
														</div>
													</div>
												</div>
											</div>
										)}

										{videoGenerationStates[scene.id] === "completed" && (
											<div className="mt-6 space-y-4">
												{/* Video Preview */}
												<div className="bg-gray-800 rounded-lg p-4">
													<div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center mb-4">
														<div className="text-center">
															<div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
																<svg
																	className="w-8 h-8 text-white"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path
																		fillRule="evenodd"
																		d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
																		clipRule="evenodd"
																	/>
																</svg>
															</div>
															<p className="text-white text-sm">
																Scene 1 Video Generated
															</p>
														</div>
													</div>

													{/* Action Buttons */}
													<div className="flex gap-2">
														<Button
															onClick={() => {
																console.log(
																	`[v0] Mobile regenerate clicked for scene: ${scene.id}`,
																);
																handleRegenerateVideoClick(scene.id);
															}}
															variant="outline"
															className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
														>
															Regenerate
														</Button>
														<Button
															onClick={() => {
																console.log(
																	`[v0] Mobile validate clicked for scene: ${scene.id}`,
																);
																setVideoValidationStates((prev) => ({
																	...prev,
																	[scene.id]: true,
																}));
															}}
															className="flex-1 bg-green-600 hover:bg-green-700 text-white"
															disabled={
																videoValidationStates[scene.id] === true
															}
														>
															{videoValidationStates[scene.id] === true
																? "Validated ✓"
																: "Validate"}
														</Button>
													</div>
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>

					<div className="hidden md:block">
						<Tabs value={activeTab} onValueChange={setActiveTab}>
							<TabsList
								className="grid w-full mb-8"
								style={{
									backgroundColor: "#182634",
									gridTemplateColumns: `repeat(${scenes.length}, 1fr)`,
								}}
							>
								{scenes.map((scene) => (
									<TabsTrigger
										key={scene.id}
										value={scene.id}
										className="data-[state=active]:bg-[#0d7ff2] data-[state=active]:text-white"
									>
										{scene.title}
									</TabsTrigger>
								))}
							</TabsList>

							{scenes.map((scene) => (
								<TabsContent
									key={scene.id}
									value={scene.id}
									className="space-y-8"
								>
									<Card
										style={{
											backgroundColor: "#182634",
											borderColor: "#223649",
										}}
									>
										<CardHeader>
											<CardTitle className="text-white">
												{scene.title}
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-gray-300">{scene.description}</p>
										</CardContent>
									</Card>

									<Card
										style={{
											backgroundColor: "#182634",
											borderColor: "#223649",
										}}
									>
										<CardHeader>
											<CardTitle className="text-white flex items-center gap-2">
												<ImageIconComponent className="h-5 w-5" />
												Frame Assignment
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="flex flex-col gap-6">
												{/* Start Frame Slot - Always visible */}
												<div className="space-y-3">
													<div className="space-y-2">
														<h3 className="text-lg font-semibold text-white">
															Start Frame
														</h3>
														<p className="text-sm text-gray-400">
															This will be the first frame that appears in this
															scene
														</p>
													</div>
													<Label className="text-white font-medium">
														Start Frame
													</Label>
													<div
														className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-[#223649] transition-colors min-h-[200px] flex flex-col items-center justify-center relative"
														style={{ borderColor: "#314d68" }}
														onClick={() =>
															openGenerativeModal(scene.id, "start")
														}
													>
														{scene.startFrameImage ? (
															<>
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		deleteFrame(scene.id, "start");
																	}}
																	className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
																	title="Delete image"
																>
																	×
																</button>
																<img
																	src={
																		scene.startFrameImage || "/placeholder.svg"
																	}
																	alt="Start frame"
																	className="w-48 h-48 object-cover rounded mb-3"
																/>
																<p className="text-gray-300 font-medium">
																	Start Frame Created
																</p>
																<p className="text-sm text-gray-500">
																	Click to regenerate start frame
																</p>
															</>
														) : (
															<>
																<Plus className="h-12 w-12 mb-3 text-gray-400" />
																<p className="text-gray-300 font-medium">
																	Create Visual
																</p>
																<p className="text-sm text-gray-500">
																	Click to generate start frame
																</p>
															</>
														)}
													</div>
												</div>

												{/* End Frame Slot - Only visible after start frame is created */}
												{scene.startFrameImage && (
													<div className="space-y-3">
														<div className="space-y-2">
															<h3 className="text-lg font-semibold text-white">
																End Frame
															</h3>
															<p className="text-sm text-gray-400">
																This will be the last frame that appears in this
																scene
															</p>
														</div>
														<Label className="text-white font-medium">
															End Frame
														</Label>
														<div
															className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-[#223649] transition-colors min-h-[200px] flex flex-col items-center justify-center relative"
															style={{ borderColor: "#314d68" }}
															onClick={() =>
																openGenerativeModal(scene.id, "end")
															}
														>
															{scene.endFrameImage ? (
																<>
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			deleteFrame(scene.id, "end");
																		}}
																		className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
																		title="Delete image"
																	>
																		×
																	</button>
																	<img
																		src={
																			scene.endFrameImage || "/placeholder.svg"
																		}
																		alt="End frame"
																		className="w-48 h-48 object-cover rounded mb-3"
																	/>
																	<p className="text-gray-300 font-medium">
																		End Frame Created
																	</p>
																	<p className="text-sm text-gray-500">
																		Click to regenerate end frame
																	</p>
																</>
															) : (
																<>
																	<Plus className="h-12 w-12 mb-3 text-gray-400" />
																	<p className="text-gray-300 font-medium">
																		Create Visual
																	</p>
																	<p className="text-sm text-gray-500">
																		Click to generate end frame
																	</p>
																</>
															)}
														</div>
													</div>
												)}

												{/* Scene Video Generation Component */}
												{scene.startFrameImage && scene.endFrameImage && (
													<div className="space-y-3">
														<div className="space-y-2">
															<h3 className="text-lg font-semibold text-white">
																Scene Video
															</h3>
															<p className="text-sm text-gray-400">
																Generate a video for this scene using your start
																and end frames
															</p>
														</div>

														{videoGenerationStates[scene.id] !== "generating" &&
															videoGenerationStates[scene.id] !==
																"completed" && (
																<Button
																	onClick={() => handleGenerateVideo(scene.id)}
																	className="w-full h-12 bg-[#0d7ff2] hover:bg-blue-600 text-white font-medium"
																>
																	Generate Scene{" "}
																	{scenes.findIndex((s) => s.id === scene.id) +
																		1}{" "}
																	Video
																</Button>
															)}

														{videoGenerationStates[scene.id] ===
														"generating" ? (
															// Loading Animation Component
															<div
																className="border-2 border-solid rounded-lg p-8 text-center bg-[#223649]/30"
																style={{ borderColor: "#0d7ff2" }}
															>
																<div className="flex flex-col items-center justify-center space-y-4">
																	<div className="relative">
																		<div className="w-16 h-16 bg-[#0d7ff2] rounded-full flex items-center justify-center animate-pulse">
																			<svg
																				className="w-8 h-8 text-white animate-spin"
																				fill="none"
																				viewBox="0 0 24 24"
																			>
																				<circle
																					className="opacity-25"
																					cx="12"
																					cy="12"
																					r="10"
																					stroke="currentColor"
																					strokeWidth="4"
																				></circle>
																				<path
																					className="opacity-75"
																					fill="currentColor"
																					d="M4 12a8 8 0 108-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																				></path>
																			</svg>
																		</div>
																		<div className="absolute -inset-2 border-2 border-[#0d7ff2] rounded-full animate-ping opacity-20"></div>
																	</div>
																	<div>
																		<p className="text-white font-medium mb-2">
																			Generating Scene Video...
																		</p>
																		<p className="text-sm text-gray-400">
																			Creating your {scene.duration}s video,
																			this may take a moment
																		</p>
																		<div className="mt-4 w-48 bg-gray-700 rounded-full h-2">
																			<div
																				className="bg-[#0d7ff2] h-2 rounded-full animate-pulse"
																				style={{ width: "60%" }}
																			></div>
																		</div>
																	</div>
																</div>
															</div>
														) : videoGenerationStates[scene.id] ===
															"completed" ? (
															<div className="space-y-4">
																{regenerationChatStates[scene.id]?.isOpen ? (
																	// Chatbot Interface
																	<div
																		className="border-2 border-solid rounded-lg p-6 bg-[#223649]/30"
																		style={{ borderColor: "#0d7ff2" }}
																	>
																		<div className="space-y-4">
																			<div className="flex items-center justify-between">
																				<h4 className="text-lg font-semibold text-white">
																					Refine Scene Video
																				</h4>
																				<Button
																					onClick={() =>
																						setRegenerationChatStates(
																							(prev) => ({
																								...prev,
																								[scene.id]: {
																									...prev[scene.id],
																									isOpen: false,
																								},
																							}),
																						)
																					}
																					variant="ghost"
																					size="sm"
																					className="text-gray-400 hover:text-white"
																				>
																					✕
																				</Button>
																			</div>

																			<div className="max-h-64 overflow-y-auto">
																				<Conversation className="w-full">
																					<ConversationContent>
																						{regenerationChatStates[
																							scene.id
																						]?.messages.map((message) => (
																							<div key={message.id}>
																								<Message from={message.role}>
																									<MessageContent>
																										<Response>
																											{message.content}
																										</Response>
																									</MessageContent>
																								</Message>
																							</div>
																						))}
																						{regenerationChatStates[scene.id]
																							?.status === "submitted" && (
																							<Loader />
																						)}
																					</ConversationContent>
																				</Conversation>
																			</div>

																			<PromptInput
																				onSubmit={(e) =>
																					handleChatSubmit(scene.id, e)
																				}
																				className="w-full"
																			>
																				<PromptInputTextarea
																					onChange={(e) =>
																						setRegenerationChatStates(
																							(prev) => ({
																								...prev,
																								[scene.id]: {
																									...prev[scene.id],
																									input: e.target.value,
																								},
																							}),
																						)
																					}
																					value={
																						regenerationChatStates[scene.id]
																							?.input || ""
																					}
																					placeholder="Describe what you'd like to change..."
																				/>
																				<PromptInputToolbar>
																					<PromptInputTools />
																					<PromptInputSubmit
																						disabled={
																							!regenerationChatStates[scene.id]
																								?.input
																						}
																						status={
																							regenerationChatStates[scene.id]
																								?.status || "idle"
																						}
																					/>
																				</PromptInputToolbar>
																			</PromptInput>

																			{regenerationChatStates[scene.id]
																				?.messages.length > 1 &&
																				regenerationChatStates[scene.id]
																					?.messages[
																					regenerationChatStates[scene.id]
																						?.messages.length - 1
																				]?.role === "assistant" && (
																					<div className="flex flex-col items-center gap-3">
																						<Button
																							onClick={() =>
																								approveChatMessage(
																									scene.id,
																									regenerationChatStates[
																										scene.id
																									]?.messages[
																										regenerationChatStates[
																											scene.id
																										]?.messages.length - 1
																									]?.id,
																								)
																							}
																							size="default"
																							variant={
																								regenerationChatStates[scene.id]
																									?.messages[
																									regenerationChatStates[
																										scene.id
																									]?.messages.length - 1
																								]?.isApproved
																									? "default"
																									: "outline"
																							}
																							className={`h-10 px-6 text-sm font-medium ${
																								regenerationChatStates[scene.id]
																									?.messages[
																									regenerationChatStates[
																										scene.id
																									]?.messages.length - 1
																								]?.isApproved
																									? "bg-green-600 hover:bg-green-700 text-white"
																									: "text-white border-[#314d68] hover:bg-[#223649] bg-transparent"
																							}`}
																						>
																							{regenerationChatStates[scene.id]
																								?.messages[
																								regenerationChatStates[scene.id]
																									?.messages.length - 1
																							]?.isApproved
																								? "✓ Approved"
																								: "✓ Approve this Direction"}
																						</Button>

																						{regenerationChatStates[scene.id] &&
																							regenerationChatStates[scene.id]
																								.approved && (
																								<Button
																									onClick={() =>
																										handleRegenerateApprovedVideo(
																											scene.id,
																										)
																									}
																									className="h-10 px-6 text-sm font-medium bg-[#0d7ff2] hover:bg-blue-600 text-white"
																								>
																									Regenerate Scene Video ✨
																								</Button>
																							)}
																					</div>
																				)}
																		</div>
																	</div>
																) : (
																	// Generated Video Display Component
																	<div
																		className="border-2 border-solid rounded-lg p-6 bg-[#223649]/30"
																		style={{ borderColor: "#22c55e" }}
																	>
																		<div className="space-y-4">
																			<div className="flex items-center space-x-2">
																				<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
																					<svg
																						className="w-4 h-4 text-white"
																						fill="currentColor"
																						viewBox="0 0 20 20"
																					>
																						<path
																							fillRule="evenodd"
																							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																							clipRule="evenodd"
																						/>
																					</svg>
																				</div>
																				<p className="text-green-400 font-medium">
																					Scene Video Generated Successfully!
																				</p>
																				<span className="text-sm text-gray-400">
																					(1/3 generations)
																				</span>
																			</div>

																			<div className="aspect-video bg-black rounded-lg overflow-hidden">
																				<video
																					className="w-full h-full object-cover"
																					controls
																					poster={"/placeholder.svg"}
																				>
																					<source
																						src={"/placeholder-video.mp4"}
																						type="video/mp4"
																					/>
																					Your browser does not support the
																					video tag.
																				</video>
																			</div>

																			<div className="flex space-x-3">
																				<Button
																					onClick={() =>
																						handleRegenerateVideoClick(scene.id)
																					}
																					variant="outline"
																					className="text-white border-gray-600 hover:bg-gray-700"
																					disabled={false}
																				>
																					Regenerate Video
																				</Button>
																				<Button
																					onClick={() => {
																						console.log(
																							`[v0] Downloading video for scene: ${scene.id}`,
																						);
																					}}
																					variant="outline"
																					className="text-white border-gray-600 hover:bg-gray-700"
																				>
																					Download Video
																				</Button>
																				<Button
																					onClick={() =>
																						validateVideo(scene.id)
																					}
																					className={`px-6 py-2 text-sm font-medium ${
																						videoValidationStates[scene.id] ===
																						true
																							? "bg-green-600 hover:bg-green-700 text-white"
																							: "bg-[#0d7ff2] hover:bg-blue-600 text-white"
																					}`}
																					disabled={
																						videoValidationStates[scene.id] ===
																						true
																					}
																				>
																					{videoValidationStates[scene.id] ===
																					true
																						? "✓ Video Validated"
																						: "Validate Video"}
																				</Button>
																			</div>
																		</div>
																	</div>
																)}
															</div>
														) : (
															// Initial Generate Button Component
															<div
																className="border-2 border-solid rounded-lg p-8 text-center bg-[#223649]/30"
																style={{ borderColor: "#0d7ff2" }}
															>
																<div className="flex flex-col items-center justify-center space-y-4">
																	<div className="w-16 h-16 bg-[#0d7ff2] rounded-full flex items-center justify-center">
																		<svg
																			className="w-8 h-8 text-white"
																			fill="currentColor"
																			viewBox="0 0 20 20"
																		>
																			<path
																				fillRule="evenodd"
																				d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
																				clipRule="evenodd"
																			/>
																		</svg>
																	</div>
																	<div>
																		<p className="text-white font-medium mb-2">
																			Ready to Generate Scene Video
																		</p>
																		<p className="text-sm text-gray-400 mb-4">
																			Create a 10s video transitioning from
																			start to end frame
																		</p>
																		<Button
																			onClick={() =>
																				handleGenerateVideo(scene.id)
																			}
																			className="bg-[#0d7ff2] hover:bg-blue-600 text-white px-6 py-2"
																		>
																			Generate Scene Video
																		</Button>
																	</div>
																</div>
															</div>
														)}
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								</TabsContent>
							))}
						</Tabs>
					</div>
				</div>
			</div>

			{generativeModalOpen && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-[#182634] rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
						<div className="flex items-center justify-between p-6 border-b border-[#223649]">
							<h2 className="text-xl font-bold text-white">
								Generative Asset Studio
							</h2>
							<button
								onClick={() => setGenerativeModalOpen(false)}
								className="text-gray-400 hover:text-white"
							>
								<X className="h-6 w-6" />
							</button>
						</div>

						<div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
							<div className="grid lg:grid-cols-3 gap-6">
								{/* Left Panel - Tabs */}
								<div className="lg:col-span-2">
									<div className="flex gap-2 mb-6">
										<button
											onClick={() => setActiveAssetTab("upload")}
											className={`px-4 py-2 rounded-lg font-medium ${
												activeAssetTab === "upload"
													? "bg-[#0d7ff2] text-white"
													: "bg-[#223649] text-gray-300 hover:bg-[#314d68]"
											}`}
										>
											Upload New
										</button>
										<button
											onClick={() => setActiveAssetTab("project")}
											className={`px-4 py-2 rounded-lg font-medium ${
												activeAssetTab === "project"
													? "bg-[#0d7ff2] text-white"
													: "bg-[#223649] text-gray-300 hover:bg-[#314d68]"
											}`}
										>
											Use Project Asset
										</button>
									</div>

									{activeAssetTab === "upload" && (
										<div className="space-y-4">
											<div className="border-2 border-dashed border-[#314d68] rounded-lg p-8 text-center">
												<input
													type="file"
													multiple
													accept="image/*"
													onChange={handleFileUpload}
													className="hidden"
													id="file-upload"
												/>
												<label htmlFor="file-upload" className="cursor-pointer">
													<Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
													<p className="text-white font-medium mb-2">
														Upload Images
													</p>
													<p className="text-gray-400 text-sm">
														Click to select files or drag and drop
													</p>
												</label>
											</div>

											{uploadedImages.length > 0 && (
												<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
													{uploadedImages.map((image, index) => (
														<div
															key={`uploaded-${index}-${image}`}
															className={`relative cursor-pointer rounded-lg border-2 transition-all ${
																selectedAssets.includes(image)
																	? "border-[#0d7ff2] bg-[#0d7ff2]/10"
																	: "border-[#314d68] hover:border-[#0d7ff2]/50"
															}`}
															onClick={() => {
																if (selectedAssets.includes(image)) {
																	setSelectedAssets(
																		selectedAssets.filter(
																			(asset) => asset !== image,
																		),
																	);
																} else {
																	setSelectedAssets([image]); // Only allow one selection for frame assignment
																}
															}}
														>
															<img
																src={image || "/placeholder.svg"}
																alt={`Uploaded ${index + 1}`}
																className="w-full h-32 object-cover rounded"
															/>
															{selectedAssets.includes(image) && (
																<div className="absolute top-2 right-2 bg-[#0d7ff2] rounded-full p-1">
																	<Check className="h-4 w-4 text-white" />
																</div>
															)}
														</div>
													))}
												</div>
											)}
										</div>
									)}

									{activeAssetTab === "project" && (
										<div className="space-y-4">
											<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
												{/* Sample project assets */}
												{[
													"/romantic-couple.png",
													"/elegant-wedding-sunset.png",
													"/wedding-rings-macro.png",
													"/happy-wedding-party.png",
													"/elegant-wedding-invitation.png",
													"/fun-birthday-invitation.png",
												].map((asset, index) => (
													<div
														key={`project-${index}-${asset}`}
														className={`relative cursor-pointer rounded-lg border-2 transition-all ${
															selectedAssets.includes(asset)
																? "border-[#0d7ff2] bg-[#0d7ff2]/10"
																: "border-[#314d68] hover:border-[#0d7ff2]/50"
														}`}
														onClick={() => {
															if (selectedAssets.includes(asset)) {
																setSelectedAssets(
																	selectedAssets.filter((a) => a !== asset),
																);
															} else {
																setSelectedAssets([asset]); // Only allow one selection for frame assignment
															}
														}}
													>
														<img
															src={asset || "/placeholder.svg"}
															alt={`Project asset ${index + 1}`}
															className="w-full h-32 object-cover rounded"
														/>
														{selectedAssets.includes(asset) && (
															<div className="absolute top-2 right-2 bg-[#0d7ff2] rounded-full p-1">
																<Check className="h-4 w-4 text-white" />
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}

									{selectedAssets.length > 0 && (
										<div className="mt-6 flex justify-end">
											<button
												onClick={() => applySelectedAsset(selectedAssets[0])}
												className="px-6 py-2 bg-[#0d7ff2] text-white rounded-lg hover:bg-[#0b6fd1] transition-colors"
											>
												Apply to{" "}
												{currentFrameType === "start" ? "Start" : "End"} Frame
											</button>
										</div>
									)}
								</div>

								{/* Right Panel - Generated Results */}
								<div className="space-y-4">
									<h3 className="text-white font-medium">Generated Results</h3>

									{false && (
										<div className="space-y-4">
											<div className="bg-[#223649] rounded-lg p-4">
												<h4 className="text-white font-medium mb-3">
													Selected Assets (0)
												</h4>
												<div className="grid grid-cols-2 gap-2">
													{[].map((asset, index) => (
														<div key={index} className="relative">
															<img
																src={"/placeholder.svg"}
																alt={`Selected 1`}
																className="w-full h-16 object-cover rounded"
															/>
															<button
																onClick={() => {}}
																className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
															>
																<X className="h-3 w-3 text-white" />
															</button>
														</div>
													))}
												</div>
											</div>

											<button
												onClick={() => {}}
												className="w-full bg-[#0d7ff2] hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
												disabled={true}
											>
												<Plus className="h-4 w-4" />
												Use Selected as Start Frame
											</button>
										</div>
									)}

									<div className="space-y-3">
										<h4 className="text-white font-medium">Edit Prompt</h4>
										<textarea
											value={editPrompt}
											onChange={(e) => setEditPrompt(e.target.value)}
											className="w-full h-24 bg-[#223649] border border-[#314d68] rounded-lg p-3 text-white resize-none"
											placeholder="Describe the visual you want to generate..."
										/>
										<button
											onClick={handleGenerateImages}
											disabled={isGenerating}
											className="w-full bg-[#0d7ff2] hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
										>
											{isGenerating ? (
												<>
													<Sparkles className="h-4 w-4 animate-pulse" />
													Generating...
												</>
											) : (
												<>
													<Sparkles className="h-4 w-4" />
													Generate 4 Images
												</>
											)}
										</button>
									</div>

									{generatedImages.length > 0 && (
										<div className="space-y-3">
											<h4 className="text-white font-medium">
												Generated Images
											</h4>
											<div className="grid grid-cols-2 gap-2">
												{generatedImages.map((image, index) => (
													<div
														key={`generated-${image}-${index}`}
														className={`relative cursor-pointer rounded-lg border-2 transition-all ${
															selectedAssets.includes(image)
																? "border-[#0d7ff2] bg-[#0d7ff2]/10"
																: "border-[#314d68] hover:border-[#0d7ff2]/50"
														}`}
														onClick={() => {
															if (selectedAssets.includes(image)) {
																setSelectedAssets(
																	selectedAssets.filter(
																		(asset) => asset !== image,
																	),
																);
															} else {
																setSelectedAssets([...selectedAssets, image]);
															}
														}}
													>
														<img
															src={image || "/placeholder.svg"}
															alt={`Generated ${index + 1}`}
															className="w-full h-20 object-cover rounded"
														/>
														{selectedAssets.includes(image) && (
															<div className="absolute top-1 right-1 bg-[#0d7ff2] rounded-full p-1">
																<Check className="h-2 w-2 text-white" />
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Mobile Regeneration Chat Interface */}
			{scenes.map((scene) => {
				const chatState = regenerationChatStates[scene.id];
				if (!chatState?.isOpen) return null;

				return (
					<div
						key={`mobile-chat-${scene.id}`}
						className="md:hidden fixed inset-0 bg-[#1a2332] z-50 flex flex-col"
					>
						<div className="flex-1 flex flex-col h-full">
							<div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
								<h4 className="text-lg font-semibold text-white">
									Refine Scene Video
								</h4>
								<Button
									onClick={() => handleCloseChatModal(scene.id)}
									variant="ghost"
									size="sm"
									className="text-gray-400 hover:text-white"
								>
									✕
								</Button>
							</div>

							<div className="flex-1 p-4 overflow-y-auto">
								<Conversation className="w-full h-full">
									<ConversationContent>
										{(chatState.messages || []).map((message) => (
											<div key={message.id}>
												<Message from={message.role}>
													<MessageContent>
														<Response>{message.content}</Response>
													</MessageContent>
												</Message>
											</div>
										))}
										{chatState.status === "processing" && <Loader />}
									</ConversationContent>
								</Conversation>
							</div>

							<div className="p-4 border-t border-gray-700 flex-shrink-0">
								<PromptInput
									onSubmit={(input) => handleChatSubmit(scene.id, input)}
									className="w-full"
								>
									<PromptInputTextarea
										onChange={(e) => updateChatInput(scene.id, e.target.value)}
										value={chatState.input || ""}
										placeholder="Describe what you'd like to change..."
									/>
									<PromptInputToolbar>
										<PromptInputTools />
										<PromptInputSubmit
											disabled={chatState.status === "processing"}
											status={chatState.status || "idle"}
										/>
									</PromptInputToolbar>
								</PromptInput>

								{chatState.showApproval && (
									<div className="flex flex-col items-center gap-3 mt-4">
										<Button
											onClick={() => handleApproveDirection(scene.id)}
											size="default"
											variant={"outline"}
											className={`h-10 px-6 text-sm font-medium ${
												chatState.approved
													? "bg-green-600 hover:bg-green-700 text-white"
													: "text-white border-[#314d68] hover:bg-[#223649] bg-transparent"
											}`}
										>
											✓ Approve this Direction
										</Button>

										{chatState.approved && (
											<Button
												onClick={() => {
													console.log(
														`[v0] Mobile regenerate approved video clicked for scene: ${scene.id}`,
													);
													handleRegenerateApprovedVideo(scene.id);
												}}
												className="h-10 px-6 text-sm font-medium bg-[#0d7ff2] hover:bg-blue-600 text-white"
											>
												Regenerate Scene Video ✨
											</Button>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				);
			})}

			{/* Continue Button */}
			<div className="fixed bottom-0 left-0 right-0 bg-[#101a23] border-t border-[#314d68] p-4 z-30">
				<div className="max-w-7xl mx-auto flex justify-end">
					<Button
						onClick={handleContinue}
						disabled={nextAction.disabled}
						className={`px-8 py-3 text-lg font-medium ${
							nextAction.disabled
								? "bg-gray-600 text-gray-400 cursor-not-allowed"
								: "bg-[#0d7ff2] hover:bg-blue-600 text-white"
						}`}
					>
						{nextAction.text}
					</Button>
				</div>
			</div>
		</div>
	);
}

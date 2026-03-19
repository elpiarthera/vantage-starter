"use client";

import { useCallback, useEffect, useState } from "react";

// COMMENTED OUT: Hook dependencies - not available in MyShortReel
// import { useToast } from "@workspace/ui/hooks/use-toast";
// import { usePromptEnhancer } from "@workspace/ui/hooks/use-prompt-enhancer";
// import { useImagePromptGenerator } from "@workspace/ui/hooks/use-image-prompt-generator";

// Import our modular components
import {
	ChooseCategoriesSection,
	ClearAllDialog,
	CustomInputSection,
	GeneratedPromptSection,
	OptionsCarouselSection,
	PageHeader,
	SuccessDialog,
} from "@/components/prompt-generator";

import promptData from "@/public/data/prompt-generator/prompts.json";

// Transform JSON data into promptBank format
const promptBank = Object.entries(promptData.prompt_details).reduce(
	(acc, [key, category]) => {
		acc[key] = category.values.map((item: any, index) => ({
			type: item.value,
			prompt: item.prompt || `${item.value} - professional cinematic style`,
			flux_prompt:
				item.prompt || `${item.value} - professional cinematic style`,
			cover_image:
				item.thumbnail?.url || `/prompts/placeholder-${key}-${index}.jpg`,
			category: key,
			hasVideo: item.example?.type === "video",
			videoUrl: item.example?.type === "video" ? item.example.url : null,
		}));
		return acc;
	},
	{} as Record<
		string,
		Array<{
			type: string;
			prompt: string;
			flux_prompt: string;
			cover_image: string;
			category: string;
			hasVideo: boolean;
			videoUrl: string | null;
		}>
	>,
);

type PromptSelections = {
	[key: string]: string;
};

export default function PromptGeneratorPage() {
	const [selections, setSelections] = useState<PromptSelections>({});
	const [finalPrompt, setFinalPrompt] = useState("");
	const [promptSegments, setPromptSegments] = useState<
		Array<{ category: string; text: string; color: string }>
	>([]);
	const [selectedTopic, setSelectedTopic] = useState<string>(
		Object.keys(promptBank)[0] || "lighting",
	);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [successMessage, _setSuccessMessage] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState("");
	const [customText, setCustomText] = useState("");
	const [isPromptEnhanced, setIsPromptEnhanced] = useState(false);
	const [isGeneratingPrompt, _setIsGeneratingPrompt] = useState(false);
	const [originalPrompt, setOriginalPrompt] = useState("");
	const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

	// COMMENTED OUT: useToast hook not available
	// const { toast } = useToast();

	// Mock toast function for demo
	const toast = (config: {
		title?: string;
		description?: string;
		variant?: string;
		duration?: number;
	}) => {
		console.log("Toast:", config);
	};

	// COMMENTED OUT: Prompt enhancement hooks - not available in demo
	// const {
	//   enhancePrompt,
	//   isLoading: isEnhancing,
	//   error: enhanceError
	// } = usePromptEnhancer({...});

	// const {
	//   generateDetailedPrompt,
	//   generateVideoPrompt,
	//   isLoading: isGeneratingFromImage,
	//   error: imageError
	// } = useImagePromptGenerator({...});

	// Utility function to properly capitalize option names
	const formatOptionName = (name: string) => {
		return name
			.replace(/[_‑-]/g, " ") // Replace underscores, hyphens and special dashes with spaces
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(" ");
	};

	const generatePrompt = useCallback(() => {
		// Color mapping for different categories
		const categoryColors: { [key: string]: string } = {
			lighting: "orange",
			camera_shot: "green",
			camera_movement: "red",
			mood: "purple",
			style: "blue",
			subject: "cyan",
			environment: "yellow",
			time_of_day: "orange",
			weather: "cyan",
			color_grade: "green",
			composition: "yellow",
			lens: "purple",
			frame_rate_motion: "red",
			sound_direction: "beta",
			vfx: "blue",
			action_blocking: "green",
			transitions_editing: "purple",
			style_family: "blue",
			motion_logic: "red",
			focus_control: "cyan",
			historical_period: "yellow",
			culture_context: "orange",
		};

		// Check if we have any valid selections (non-empty values)
		const hasValidSelections = Object.values(selections).some(
			(value) => value && value.trim() !== "",
		);

		// If no valid selections and no custom text, clear everything
		if (!hasValidSelections && !customText.trim()) {
			setFinalPrompt("");
			setPromptSegments([]);
			setIsPromptEnhanced(false);
			setOriginalPrompt("");
			return;
		}

		const selectedPrompts: { [key: string]: { type: string; prompt: string } } =
			{};
		const segments: Array<{ category: string; text: string; color: string }> =
			[];

		// Collect selected prompts and build segments
		Object.entries(selections).forEach(([category, selectedType]) => {
			const categoryOptions = promptBank[category as keyof typeof promptBank];
			const selectedOption = categoryOptions?.find(
				(option) => option.type === selectedType,
			);
			if (selectedOption && selectedType) {
				selectedPrompts[category] = selectedOption;
				segments.push({
					category: category,
					text: selectedOption.prompt,
					color: categoryColors[category] || "default",
				});
			}
		});

		// If no selected prompts and no custom text, clear everything
		if (Object.keys(selectedPrompts).length === 0 && !customText.trim()) {
			setFinalPrompt("");
			setPromptSegments([]);
			setIsPromptEnhanced(false);
			setOriginalPrompt("");
			return;
		}

		// Add custom text segment if provided
		if (customText.trim()) {
			segments.unshift({
				category: "custom_text",
				text: customText.trim(),
				color: "purple",
			});
		}

		// Store segments for badge display
		setPromptSegments(segments);

		// Create final prompt by joining all prompts (custom text first)
		const allPrompts = [];
		if (customText.trim()) {
			allPrompts.push(customText.trim());
		}
		allPrompts.push(
			...Object.values(selectedPrompts).map((item) => item.prompt),
		);
		const finalText = allPrompts.join(", ");

		setFinalPrompt(finalText);
		setIsPromptEnhanced(false);
	}, [selections, customText]);

	// Enable automatic prompt generation when selections change
	useEffect(() => {
		generatePrompt();
	}, [generatePrompt]);

	const handleSelection = (category: string, type: string) => {
		setSelections((prev) => ({
			...prev,
			[category]: prev[category] === type ? "" : type,
		}));
	};

	const clearAllSelections = () => {
		setSelections({});
		setCustomText("");
		setIsPromptEnhanced(false);
		setOriginalPrompt("");
		toast({
			title: "All selections cleared",
			description: "Start fresh with new selections",
			variant: "default",
			duration: 2000,
		});
	};

	// Clear all with confirmation
	const handleClearAllWithConfirmation = () => {
		const hasValidSelections = Object.values(selections).some(
			(value) => value && value.trim() !== "",
		);
		const hasContent = hasValidSelections || customText.trim() || finalPrompt;

		if (hasContent) {
			setIsClearAllDialogOpen(true);
		}
	};

	// Confirm clear all action
	const confirmClearAll = () => {
		clearAllSelections();
		setCustomText("");
		setImageUrl("");
		setImageFile(null);
		setIsClearAllDialogOpen(false);
	};

	// Remove image function
	const handleRemoveImage = () => {
		if (imageUrl.startsWith("blob:")) {
			URL.revokeObjectURL(imageUrl);
		}
		setImageUrl("");
		setImageFile(null);
		toast({
			title: "Image removed",
			description: "Reference image has been removed from the prompt",
			variant: "default",
			duration: 2000,
		});
	};

	// Undo enhancement function
	const handleUndoEnhancement = () => {
		if (originalPrompt) {
			setFinalPrompt(originalPrompt);
			setIsPromptEnhanced(false);
			setOriginalPrompt("");
			toast({
				title: "Enhancement undone",
				description: "Reverted to the original generated prompt",
				variant: "default",
				duration: 2000,
			});
		}
	};

	// Handle removing a segment and deselecting the category
	const handleRemoveSegment = (category: string) => {
		// Remove from selections
		setSelections((prev) => ({
			...prev,
			[category]: "",
		}));

		// Also clear custom text if it's a custom_text segment
		if (category === "custom_text") {
			setCustomText("");
		}

		toast({
			title: "Segment removed",
			description: `${category.replace("_", " ")} has been removed from your prompt`,
			variant: "default",
			duration: 2000,
		});
	};

	// COMMENTED OUT: Handle prompt generation/enhancement - API calls not available in demo
	// This is a non-functional demo UI
	const handleGeneratePrompt = async () => {
		console.log("🚀 Enhance button clicked!");
		console.log("Current state:", {
			finalPrompt,
			selections,
			customText,
			imageFile,
			imageUrl,
		});

		// DEMO MODE: Show toast that feature is not available
		toast({
			title: "Demo Mode",
			description: "Enhancement feature is not available in this demo version",
			variant: "default",
		});

		// COMMENTED OUT: Actual enhancement logic
		// Check if we have any content to work with
		// const hasSelections = Object.values(selections).some(value => value && value.trim() !== "");
		// const hasCustomText = customText.trim() !== "";
		// const hasImage = imageFile || imageUrl;
		// ... rest of enhancement logic
	};

	return (
		<>
			<div className="">
				{/* Header */}
				<PageHeader onClearAll={handleClearAllWithConfirmation} />

				{/* Choose Categories Section */}
				<ChooseCategoriesSection
					promptBank={promptBank}
					selectedTopic={selectedTopic}
					selections={selections}
					onTopicChange={setSelectedTopic}
					formatOptionName={formatOptionName}
				/>

				{/* Options Carousel Section */}
				<OptionsCarouselSection
					selectedTopic={selectedTopic}
					promptBank={promptBank}
					selections={selections}
					onSelectionChange={handleSelection}
					formatOptionName={formatOptionName}
				/>

				{/* Custom Input Section */}
				<CustomInputSection
					customText={customText}
					imageFile={imageFile}
					imageUrl={imageUrl}
					onCustomTextChange={setCustomText}
					onImageFileChange={setImageFile}
					onImageUrlChange={setImageUrl}
				/>

				{/* Generated Prompt Section */}
				<GeneratedPromptSection
					finalPrompt={finalPrompt}
					promptSegments={promptSegments}
					isGeneratingPrompt={isGeneratingPrompt}
					isPromptEnhanced={isPromptEnhanced}
					originalPrompt={originalPrompt}
					imageFile={imageFile}
					imageUrl={imageUrl}
					onGeneratePrompt={handleGeneratePrompt}
					onUndo={handleUndoEnhancement}
					onRemoveImage={handleRemoveImage}
					onRemoveSegment={handleRemoveSegment}
				/>
			</div>

			{/* Success Dialog */}
			<SuccessDialog
				isOpen={showSuccessDialog}
				message={successMessage}
				onOpenChange={setShowSuccessDialog}
			/>

			{/* Clear All Confirmation Dialog */}
			<ClearAllDialog
				isOpen={isClearAllDialogOpen}
				onOpenChange={setIsClearAllDialogOpen}
				onConfirm={confirmClearAll}
			/>
		</>
	);
}

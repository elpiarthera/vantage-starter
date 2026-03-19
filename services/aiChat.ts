import type { ChatMessage } from "@/components/types";
import { trackEvent } from "@/lib/monitoring/analytics";

const MOCK_RESPONSES = [
	"I can help you refine this scene. What specific aspect would you like to improve?",
	"Let me suggest some adjustments to enhance the visual appeal of your scene.",
	"Based on your feedback, I'll generate a new version with those improvements.",
	"Great idea! I'll incorporate that change into the scene design.",
	"I understand your vision. Let me create something that better matches your requirements.",
	"That's an excellent point. I'll adjust the composition and styling accordingly.",
];

export async function generateChatResponse(
	input: string,
	sceneId: string,
	_context?: any,
): Promise<ChatMessage> {
	trackEvent("ai_chat_request", { sceneId, inputLength: input.length });

	try {
		// Simulate AI processing time
		await new Promise((resolve) =>
			setTimeout(resolve, 1500 + Math.random() * 1000),
		);

		// Select a mock response
		const responseContent =
			MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

		const response: ChatMessage = {
			id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			role: "assistant",
			content: responseContent,
			timestamp: Date.now(),
		};

		trackEvent("ai_chat_response", {
			sceneId,
			responseLength: response.content.length,
			success: true,
		});

		return response;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		trackEvent("ai_chat_error", { sceneId, error: errorMessage });

		// Return error message as assistant response
		return {
			id: `error-${Date.now()}`,
			role: "assistant",
			content:
				"I'm sorry, I encountered an error processing your request. Please try again.",
			timestamp: Date.now(),
		};
	}
}

export async function generateImagePrompt(
	description: string,
	frameType: "start" | "end",
	cinematicStyles?: any,
): Promise<string> {
	trackEvent("image_prompt_generation", {
		frameType,
		hasStyles: !!cinematicStyles,
	});

	try {
		// Simulate prompt generation
		await new Promise((resolve) => setTimeout(resolve, 500));

		// In demo mode, return enhanced description
		let prompt = `${description}, ${frameType} frame`;

		if (cinematicStyles) {
			const { ambiance, cameraMovement, colorTone, visualStyle } =
				cinematicStyles;
			if (ambiance) prompt += `, ${ambiance} ambiance`;
			if (cameraMovement) prompt += `, ${cameraMovement} camera movement`;
			if (colorTone) prompt += `, ${colorTone} color tone`;
			if (visualStyle) prompt += `, ${visualStyle} visual style`;
		}

		prompt += ", high quality, cinematic, professional";

		trackEvent("image_prompt_generated", {
			frameType,
			promptLength: prompt.length,
			success: true,
		});

		return prompt;
	} catch (error) {
		console.error("[AIChat] Failed to generate image prompt:", error);
		return description; // Fallback to original description
	}
}

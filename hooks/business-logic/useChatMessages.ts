"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Message data type from Convex schema
export interface ChatMessage {
	_id: Id<"chatMessages">;
	projectId: Id<"projects">;
	userId: string;
	role: "user" | "assistant" | "system";
	content: string;
	step: number;
	metadata?: {
		model?: string;
		tokens?: number;
		latency?: number;
		context?: unknown;
	};
	createdAt: number;
	updatedAt: number;
}

/**
 * Custom hook for managing chat messages with Convex
 * Provides CRUD operations for chat messages in Steps 2 and 3b
 *
 * @param projectId - The project ID to fetch messages for
 * @param step - The step number (2 for Story Development, 3 for Scene Breakdown)
 */
export function useChatMessages(
	projectId: Id<"projects"> | undefined,
	step: number,
) {
	// Convex mutations and queries
	const createMessage = useMutation(api.chatMessages.create);
	const removeMessage = useMutation(api.chatMessages.remove);
	const updateMessageContent = useMutation(api.chatMessages.updateContent);
	const clearMessages = useMutation(api.chatMessages.clearByProjectAndStep);

	// Query messages for this project and step
	const messages = useQuery(
		api.chatMessages.list,
		projectId ? { projectId, step } : "skip",
	);

	// Local state for optimistic updates and UI state
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Add a new message to the chat
	 */
	const addMessage = useCallback(
		async (
			role: "user" | "assistant" | "system",
			content: string,
			metadata?: {
				model?: string;
				tokens?: number;
				latency?: number;
				context?: unknown;
			},
		) => {
			if (!projectId) {
				throw new Error("Project ID is required to add a message");
			}

			try {
				setIsSending(true);
				setError(null);

				const messageId = await createMessage({
					projectId,
					role,
					content,
					step,
					metadata,
				});

				return messageId;
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "Failed to add message";
				setError(errorMsg);
				console.error("[useChatMessages] Failed to add message:", err);
				throw err;
			} finally {
				setIsSending(false);
			}
		},
		[projectId, step, createMessage],
	);

	/**
	 * Delete a specific message
	 */
	const deleteMessage = useCallback(
		async (messageId: Id<"chatMessages">) => {
			try {
				setError(null);
				await removeMessage({ messageId });
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "Failed to delete message";
				setError(errorMsg);
				console.error("[useChatMessages] Failed to delete message:", err);
				throw err;
			}
		},
		[removeMessage],
	);

	/**
	 * Clear all messages for this project and step
	 */
	const clearAllMessages = useCallback(async () => {
		if (!projectId) {
			throw new Error("Project ID is required to clear messages");
		}

		try {
			setError(null);
			await clearMessages({ projectId, step });
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : "Failed to clear messages";
			setError(errorMsg);
			console.error("[useChatMessages] Failed to clear messages:", err);
			throw err;
		}
	}, [projectId, step, clearMessages]);

	/**
	 * Utility: Add user message
	 */
	const addUserMessage = useCallback(
		async (content: string) => {
			return addMessage("user", content);
		},
		[addMessage],
	);

	/**
	 * Utility: Add assistant message
	 */
	const addAssistantMessage = useCallback(
		async (
			content: string,
			metadata?: { model?: string; tokens?: number; latency?: number },
		) => {
			return addMessage("assistant", content, metadata);
		},
		[addMessage],
	);

	/**
	 * Utility: Update the last assistant message content (for editing)
	 */
	const updateLastAssistantMessage = useCallback(
		async (content: string) => {
			if (!messages || messages.length === 0) {
				throw new Error("No messages to update");
			}

			// Find the last assistant message
			const assistantMessages = messages.filter((m) => m.role === "assistant");
			if (assistantMessages.length === 0) {
				throw new Error("No assistant message found to update");
			}

			const lastAssistantMessage =
				assistantMessages[assistantMessages.length - 1];

			try {
				setError(null);
				await updateMessageContent({
					messageId: lastAssistantMessage._id,
					content,
				});
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "Failed to update message";
				setError(errorMsg);
				console.error("[useChatMessages] Failed to update message:", err);
				throw err;
			}
		},
		[messages, updateMessageContent],
	);

	return {
		// Data
		messages: messages || [],
		isLoading: messages === undefined,
		hasError: messages === null,

		// State
		isSending,
		error,

		// Actions
		addMessage,
		addUserMessage,
		addAssistantMessage,
		updateLastAssistantMessage,
		deleteMessage,
		clearAllMessages,
	};
}

/**
 * Common types for all prompts
 *
 * This file defines the base types and interfaces for the modular prompts system.
 * Each prompt file should extend these types to ensure consistency.
 *
 * @module prompt-types
 * @version 1.0
 * @since Sprint 6
 */

export interface PromptMetadata {
	version: string;
	model?: string | string[];
	temperature?: number;
	maxTokens?: number;
	updatedAt: string;
	author: string;
	notes?: string;
}

export interface BasePrompt {
	system: string;
	metadata: PromptMetadata;
}

export interface PromptBuilder<TContext = unknown, TOutput = string> {
	buildPrompt: (context: TContext) => TOutput;
	metadata: PromptMetadata;
}

export type PromptWithContext<TContext = unknown> = BasePrompt & {
	getPrompt: (context?: TContext) => string;
};

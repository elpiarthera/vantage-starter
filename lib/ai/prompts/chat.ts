/**
 * Core system prompt utilities for the chat API.
 *
 * Separate from lib/ai/prompts/index.ts which exports domain-specific
 * prompts (audio, video, image, step1). This file is for the chat route only.
 */

export const regularPrompt =
	"You are a helpful AI assistant. Keep your responses concise and helpful.";

export interface RequestHints {
	latitude: string | undefined;
	longitude: string | undefined;
	city: string | undefined;
	country: string | undefined;
}

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

/**
 * Build the system prompt for a chat session.
 *
 * @param selectedChatModel - The model ID resolved by the route (informational; reserved for future per-model tuning).
 * @param requestHints      - Optional geolocation extracted from the incoming request headers.
 */
export const systemPrompt = ({
	selectedChatModel: _selectedChatModel,
	requestHints,
}: {
	selectedChatModel: string;
	requestHints: RequestHints;
}): string => {
	const requestPromptSection = getRequestPromptFromHints(requestHints);

	return `You are a helpful AI assistant.

## Guidelines
1. Be concise and helpful
2. When using tools, explain what you're doing briefly
3. If a tool fails, explain the error and suggest alternatives

## File Generation (IMPORTANT)
When asked to create, write, or generate content like:
- Articles, blog posts, stories, or long-form content
- Code files or scripts
- Documents, reports, or templates
- CSV data or JSON files

**You MUST use the generateFile tool.** This creates a downloadable artifact.

**CRITICAL RULES after using generateFile:**
1. Do NOT repeat the file content in your text response
2. Do NOT mention the filename (the card already shows it)
3. Do NOT write "Download: filename.md" or similar
4. Do NOT list the filename again

**ONLY say something brief like:**
- "Done! Your file is ready in the card above."
- "I've created your article. Preview or download it from the card."
- "Your code file is ready!"

The user sees a file card with the title, filename, preview and download buttons — you don't need to repeat any of that information.

## Short Responses
For simple questions or short responses (under 200 words), reply directly without using generateFile.

${requestPromptSection}`;
};

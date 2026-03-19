export interface Scene {
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

export interface StyleOption {
	id: string;
	label: string;
	value: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp?: number;
}

export interface VideoGenerationState {
	status: "idle" | "generating" | "completed";
	progress?: number;
	error?: string;
}

export interface RegenerationChatState {
	isOpen: boolean;
	messages: ChatMessage[];
	input: string;
	status: "idle" | "streaming" | "submitted";
	approvedMessageId: string | null;
	showApproval?: boolean;
	approved?: boolean;
}

export interface AssetItem {
	id: string;
	name: string;
	url: string;
	type: "uploaded" | "project";
}

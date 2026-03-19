import type { Metadata } from "next";
import { ChatPage } from "@/components/chat/ChatPage";

export const metadata: Metadata = {
	title: "AI Chat — VantageStarter",
	description:
		"Chat with the AI agent. Uses ToolLoopAgent with tool call visibility and streaming UI.",
};

export default function ChatRoute() {
	return <ChatPage />;
}

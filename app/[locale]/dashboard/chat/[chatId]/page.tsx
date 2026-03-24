import { ChatPage } from "@/components/chat/ChatPage";

export const metadata = {
	title: "Chat — VantageStarter",
};

// Next.js 15: params is a Promise — must be awaited
type Props = {
	params: Promise<{ chatId: string; locale: string }>;
};

export default async function ChatSessionPage({ params }: Props) {
	const { chatId } = await params;

	return <ChatPage chatId={chatId} />;
}

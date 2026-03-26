/**
 * Consultant Onboarding — Discovery Chat Page
 *
 * Server Component wrapper that reads the projectId param and delegates
 * rendering to the OnboardingChat client component.
 *
 * Next.js 15: params is a Promise — must be awaited.
 */

import { OnboardingChat } from "./_components/onboarding-chat";

interface PageProps {
	params: Promise<{ projectId: string; locale: string }>;
}

export default async function OnboardingChatPage({ params }: PageProps) {
	const { projectId } = await params;

	return <OnboardingChat projectId={projectId} />;
}

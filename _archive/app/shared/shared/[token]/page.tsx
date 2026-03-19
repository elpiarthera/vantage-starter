import { fetchQuery } from "convex/nextjs";
import { notFound, redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";

interface SharedLinkPageProps {
	params: {
		token: string;
		locale: string;
	};
}

export default async function SharedLinkPage({ params }: SharedLinkPageProps) {
	const { token, locale } = params;

	// Look up the shared link by token
	const link = await fetchQuery(api.sharedLinks.getByToken, { token });

	if (!link) {
		notFound();
	}

	// Look up the video to get the projectId
	const videoData = await fetchQuery(api.videos.getProjectIdByVideoId, {
		videoId: link.videoId,
	});

	if (!videoData?.projectId) {
		notFound();
	}

	// Redirect to the public watch page
	redirect(`/${locale}/watch/${videoData.projectId}`);
}

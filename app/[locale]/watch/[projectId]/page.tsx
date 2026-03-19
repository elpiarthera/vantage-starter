import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PublicWatchClient } from "./PublicWatchClient";

interface PublicWatchPageProps {
	params: {
		projectId: string;
		locale: string;
	};
}

// Generate metadata for Open Graph previews
export async function generateMetadata({
	params,
}: PublicWatchPageProps): Promise<Metadata> {
	const t = await getTranslations({
		locale: params.locale,
		namespace: "watch_page",
	});

	const projectId = params.projectId as Id<"projects">;

	// Fetch project data server-side to get thumbnail
	const project = await fetchQuery(api.projects.getPublic, { projectId });

	const title = project
		? t("page_title", { title: project.eventDetails.eventTitle })
		: t("page_title", { title: "Video" });
	const description =
		project?.eventDetails.description || t("meta_description");

	// Get the current URL from headers
	const headersList = await headers();
	const host = headersList.get("host") || "localhost:3000";
	const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
	const baseUrl = `${protocol}://${host}`;
	const url = `${baseUrl}/${params.locale}/watch/${projectId}`;

	// Get thumbnail URL (Scene 1 start frame) for social previews
	const thumbnailUrl = project?.thumbnailUrl || null;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "video.other",
			url,
			...(thumbnailUrl && {
				images: [
					{
						url: thumbnailUrl,
						width: 1280,
						height: 720,
						alt: title,
					},
				],
			}),
			...(project?.finalVideoUrl && {
				videos: [
					{
						url: project.finalVideoUrl,
						width: 1280,
						height: 720,
					},
				],
			}),
		},
		twitter: {
			card: "player",
			title,
			description,
			...(thumbnailUrl && { images: [thumbnailUrl] }),
		},
	};
}

export default function PublicWatchPage({ params }: PublicWatchPageProps) {
	const projectId = params.projectId as Id<"projects">;

	return <PublicWatchClient projectId={projectId} />;
}

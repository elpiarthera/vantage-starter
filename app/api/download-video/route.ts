import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export const dynamic = "force-dynamic";

/**
 * GET /api/download-video?projectId=...
 *
 * Streams the project's final video with Content-Disposition: attachment
 * so the browser always triggers "Save as" (works for cross-origin URLs e.g. Convex storage).
 * Requires the caller to be the project owner (enforced via projects.get).
 */
export async function GET(req: Request) {
	try {
		const authResult = await auth();
		const { userId } = authResult;
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const token = (await authResult.getToken({ template: "convex" })) ?? null;

		const { searchParams } = new URL(req.url);
		const projectId = searchParams.get("projectId");
		if (!projectId) {
			return new Response(JSON.stringify({ error: "Missing projectId" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const project = await fetchQuery(
			api.projects.get,
			{ projectId: projectId as Id<"projects"> },
			{ token: token ?? undefined },
		);

		if (!project?.finalVideoUrl) {
			return new Response(
				JSON.stringify({ error: "Project or video not found" }),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const videoRes = await fetch(project.finalVideoUrl, {
			headers: { Accept: "video/mp4" },
		});

		if (!videoRes.ok || !videoRes.body) {
			return new Response(JSON.stringify({ error: "Failed to fetch video" }), {
				status: 502,
				headers: { "Content-Type": "application/json" },
			});
		}

		const contentType = videoRes.headers.get("Content-Type") ?? "video/mp4";

		return new Response(videoRes.body, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": 'attachment; filename="my-short-reel.mp4"',
			},
		});
	} catch (err) {
		console.error("[download-video]", err);
		return new Response(JSON.stringify({ error: "Download failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

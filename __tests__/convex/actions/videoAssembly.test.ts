import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import type { Id } from "@/convex/_generated/dataModel";
import type { ActionCtx } from "@/convex/_generated/server";

type BuildHandler =
	typeof import("@/convex/actions/videoAssembly").buildFinalVideoHandler;

vi.mock("@/lib/audio-processing", () => {
	return {
		mixAudioWithRendi: vi
			.fn()
			.mockImplementation(
				(_url1: string, _url2: string, _targetDurationSeconds: number) =>
					Promise.resolve({
						success: true,
						mixedAudioUrl: "https://rendi/mixed.m4a",
						fileId: "rendi-file-1",
					}),
			),
		deleteRendiFile: vi.fn().mockResolvedValue(undefined),
	};
});

vi.mock("@/lib/rendi-video-processing", () => {
	return {
		mergeVideosWithXfade: vi.fn().mockResolvedValue({
			success: true,
			videoUrl: "https://rendi/merged.mp4",
			fileId: "rendi-video-1",
		}),
		mergeVideosConcat: vi.fn().mockResolvedValue({
			success: true,
			videoUrl: "https://rendi/concat.mp4",
			fileId: "rendi-concat-1",
		}),
		mergeVideosWithPerSceneXfade: vi.fn().mockResolvedValue({
			success: true,
			videoUrl: "https://rendi/per-scene.mp4",
			fileId: "rendi-per-scene-1",
		}),
		mergeAudioVideo: vi.fn().mockResolvedValue({
			success: true,
			videoUrl: "https://rendi/final.mp4",
			fileId: "rendi-final-1",
		}),
		deleteRendiFile: vi.fn().mockResolvedValue(undefined),
	};
});

const jsonResponse = (data: unknown) =>
	new Response(JSON.stringify(data), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});

describe("videoAssembly action", () => {
	const runMutation = vi.fn();
	const runQuery = vi.fn();
	const storage = {
		store: vi.fn().mockResolvedValue("sid-1"),
		getUrl: vi.fn().mockResolvedValue("https://convex/final.mp4"),
	};
	const ctx: {
		runMutation: typeof runMutation;
		runQuery: typeof runQuery;
		auth: { getUserIdentity: ReturnType<typeof vi.fn> };
		storage: typeof storage;
	} = {
		runMutation,
		runQuery,
		auth: {
			getUserIdentity: vi.fn().mockResolvedValue({ subject: "user-1" }),
		},
		storage,
	};

	let handler: BuildHandler;

	beforeEach(async () => {
		process.env.FAL_KEY = "test-fal-key";
		process.env.RENDI_API_KEY = "test-rendi-key";
		vi.clearAllMocks();
		vi.resetModules();

		const module = await import("@/convex/actions/videoAssembly");
		handler = module.buildFinalVideoHandler;

		// Simple mock: identify mutations by their args pattern
		runMutation.mockImplementation(
			(_mutation: unknown, args?: Record<string, unknown>) => {
				// deductCredits has actionType in args
				if (args && "actionType" in args) {
					return { success: true, transactionId: "tx-1" };
				}
				// All other mutations return null (updateAssemblyStatus, updateFinalVideo, etc.)
				return null;
			},
		);

		runQuery.mockImplementation(
			(_query: unknown, args: { sceneId: Id<"scenes"> }) => {
				// Return scene data for any query
				return {
					videoUrl:
						args?.sceneId === ("scene-1" as Id<"scenes">)
							? "https://scene/1.mp4"
							: "https://scene/2.mp4",
				};
			},
		);

		global.fetch = vi.fn(async (input: RequestInfo | URL) => {
			const url = typeof input === "string" ? input : input.toString();
			switch (url) {
				case "https://rendi/final.mp4":
					return new Response("video-bytes", { status: 200 });
				default:
					return jsonResponse({});
			}
		});

		ctx.auth.getUserIdentity = vi.fn().mockResolvedValue({ subject: "user-1" });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should assemble video with Rendi only (happy path)", async () => {
		const result = await handler(ctx as unknown as ActionCtx, {
			projectId: "proj-1" as Id<"projects">,
			sceneIds: ["scene-1", "scene-2"] as Id<"scenes">[],
			narrationUrl: "https://nar.mp3",
			musicUrl: "https://music.mp3",
			targetResolution: "1080p",
		});

		expect(result.success).toBe(true);
		expect(result.finalUrl).toBe("https://convex/final.mp4");

		// Verify deductCredits was called with correct args
		expect(runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				clerkUserId: "user-1",
				actionType: "video_assembly",
				projectId: "proj-1",
			}),
		);

		// Verify updateFinalVideo was called with completed status
		expect(runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				projectId: "proj-1",
				assemblyStatus: "completed",
			}),
		);
	});

	it("falls back to narration-only when Rendi mix fails", async () => {
		const { mixAudioWithRendi } = await import("@/lib/audio-processing");
		(
			mixAudioWithRendi as unknown as MockedFunction<typeof mixAudioWithRendi>
		).mockResolvedValueOnce({
			success: false,
			error: "rendi-failed",
		});

		const result = await handler(ctx as unknown as ActionCtx, {
			projectId: "proj-2" as Id<"projects">,
			sceneIds: ["scene-1"] as Id<"scenes">[],
			narrationUrl: "https://nar.mp3",
			musicUrl: "https://music.mp3",
		});

		expect(result.audioMixMethod).toBe("fallback-narration-only");
		expect(runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ projectId: "proj-2" }),
		);
	});

	it("should default to hard_cut when transitionConfig is undefined", async () => {
		const { mergeVideosConcat } = await import("@/lib/rendi-video-processing");

		await handler(ctx as unknown as ActionCtx, {
			projectId: "proj-3" as Id<"projects">,
			sceneIds: ["scene-1", "scene-2"] as Id<"scenes">[],
			narrationUrl: "https://nar.mp3",
			musicUrl: "https://music.mp3",
			// No transitionConfig - defaults to hard_cut
		});

		// Should default to hard_cut (concat)
		expect(mergeVideosConcat).toHaveBeenCalled();
	});

	it("should use hard cut when transitionConfig mode is hard_cut", async () => {
		const { mergeVideosConcat } = await import("@/lib/rendi-video-processing");

		await handler(ctx as unknown as ActionCtx, {
			projectId: "proj-4" as Id<"projects">,
			sceneIds: ["scene-1", "scene-2"] as Id<"scenes">[],
			narrationUrl: "https://nar.mp3",
			musicUrl: "https://music.mp3",
			transitionConfig: {
				mode: "hard_cut",
			},
		});

		// Should use concat for hard cut
		expect(mergeVideosConcat).toHaveBeenCalled();
	});

	it("should use hard_cut even when scenes have outgoingTransition", async () => {
		const { mergeVideosConcat, mergeVideosWithPerSceneXfade } = await import(
			"@/lib/rendi-video-processing"
		);

		// Scenes with stale transition data (e.g. from previous xfade config)
		runQuery.mockImplementation(
			(_query: unknown, args: { sceneId: Id<"scenes"> }) => {
				const isFirstOrSecond =
					args?.sceneId === ("scene-1" as Id<"scenes">) ||
					args?.sceneId === ("scene-2" as Id<"scenes">);
				return {
					videoUrl:
						args?.sceneId === ("scene-1" as Id<"scenes">)
							? "https://scene/1.mp4"
							: args?.sceneId === ("scene-2" as Id<"scenes">)
								? "https://scene/2.mp4"
								: "https://scene/3.mp4",
					outgoingTransition: isFirstOrSecond
						? { effectKey: "fade", duration: 1 }
						: undefined,
				};
			},
		);

		await handler(ctx as unknown as ActionCtx, {
			projectId: "proj-per-scene" as Id<"projects">,
			sceneIds: ["scene-1", "scene-2", "scene-3"] as Id<"scenes">[],
			narrationUrl: "https://nar.mp3",
			musicUrl: "https://music.mp3",
			transitionConfig: { mode: "hard_cut" },
		});

		// Project mode is hard_cut → should use concat, not per-scene xfade
		expect(mergeVideosConcat).toHaveBeenCalled();
		expect(mergeVideosWithPerSceneXfade).not.toHaveBeenCalled();
	});

	it("should use specified xfade transition type", async () => {
		const { mergeVideosWithXfade } = await import(
			"@/lib/rendi-video-processing"
		);

		await handler(ctx as unknown as ActionCtx, {
			projectId: "proj-5" as Id<"projects">,
			sceneIds: ["scene-1", "scene-2"] as Id<"scenes">[],
			narrationUrl: "https://nar.mp3",
			musicUrl: "https://music.mp3",
			transitionConfig: {
				mode: "xfade",
				xfadeType: "fade",
				transitionDuration: 1.5,
			},
		});

		// Should use xfade with specified type
		expect(mergeVideosWithXfade).toHaveBeenCalledWith(
			expect.any(Array),
			expect.objectContaining({
				transitionType: "fade",
				transitionDuration: 1.5,
			}),
		);
	});
});

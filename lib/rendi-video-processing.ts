const RENDI_API_KEY = process.env.RENDI_API_KEY;
const RENDI_BASE_URL = "https://api.rendi.dev/v1";

// ============================================================
// Output Resolution Settings (Sprint 17)
// ============================================================

// Target output resolution - LANDSCAPE 16:9
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;

// Scaling algorithm: lanczos = high quality resampling
const SCALE_FLAGS = "lanczos";

// Reusable scale filter for normalizing video dimensions
const SCALE_FILTER = `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:flags=${SCALE_FLAGS},setsar=1`;

export interface RendiVideoResult {
	success: boolean;
	videoUrl?: string;
	fileId?: string;
	duration?: number;
	error?: string;
}

// All 46 verified working xfade transitions (see docs/MVP/x-fade-effects-tests.md)
export type XfadeTransitionType =
	// Fades
	| "fade"
	| "fadeblack"
	| "fadewhite"
	| "fadegrays"
	| "fadefast"
	| "fadeslow"
	// Wipes
	| "wipeleft"
	| "wiperight"
	| "wipeup"
	| "wipedown"
	| "wipetl"
	| "wipetr"
	| "wipebl"
	| "wipebr"
	// Slides
	| "slideleft"
	| "slideright"
	| "slideup"
	| "slidedown"
	| "smoothleft"
	| "smoothright"
	| "smoothup"
	| "smoothdown"
	// Circles
	| "circleopen"
	| "circleclose"
	| "circlecrop"
	// Rectangles & Lines
	| "rectcrop"
	| "vertopen"
	| "vertclose"
	| "horzopen"
	| "horzclose"
	// Diagonals
	| "diagtl"
	| "diagtr"
	| "diagbl"
	| "diagbr"
	// Slices
	| "hlslice"
	| "hrslice"
	| "vuslice"
	| "vdslice"
	// Effects
	| "dissolve"
	| "pixelize"
	| "distance"
	| "radial"
	| "hblur"
	// Squeeze & Zoom
	| "squeezeh"
	| "squeezev"
	| "zoomin";

export interface XfadeConfig {
	transitionType: XfadeTransitionType;
	transitionDuration: number; // seconds
	clipDuration: number; // seconds per scene
}

/**
 * Sprint 11 Phase 2: Per-scene transition configuration
 * Each scene can have a different transition effect to the next scene
 */
export interface PerSceneTransition {
	effectKey: string; // e.g., "circleopen", "fade", "dissolve"
	duration: number; // Transition duration in seconds
}

/**
 * Sprint 11 Phase 2: Config for per-scene transitions
 */
export interface PerSceneXfadeConfig {
	transitions: PerSceneTransition[]; // One transition per scene pair (length = numScenes - 1)
	clipDuration: number; // seconds per scene
}

/**
 * Merge video scenes with xfade transitions using Rendi
 */
export async function mergeVideosWithXfade(
	sceneUrls: string[],
	config: XfadeConfig = {
		transitionType: "circleopen",
		transitionDuration: 1.0,
		clipDuration: 10.0,
	},
): Promise<RendiVideoResult> {
	if (!RENDI_API_KEY) {
		return { success: false, error: "RENDI_API_KEY not configured" };
	}

	if (sceneUrls.length < 2) {
		return { success: false, error: "Need at least 2 scenes to merge" };
	}

	try {
		// Build input placeholders and files map
		const inputPlaceholders: string[] = [];
		const inputFiles: Record<string, string> = {};

		sceneUrls.forEach((url, i) => {
			const key = `in_scene${i + 1}`;
			inputPlaceholders.push(`-i {{${key}}}`);
			inputFiles[key] = url;
		});

		// Build filter_complex for xfade chain
		const filterComplex = buildXfadeFilterComplex(
			sceneUrls.length,
			config.transitionType,
			config.transitionDuration,
			config.clipDuration,
		);

		const ffmpegCommand = `${inputPlaceholders.join(" ")} -filter_complex "${filterComplex}" -map "[out]" -c:v libx264  {{out_video}}`;

		const submitRes = await fetch(`${RENDI_BASE_URL}/run-ffmpeg-command`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-KEY": RENDI_API_KEY,
			},
			body: JSON.stringify({
				ffmpeg_command: ffmpegCommand,
				input_files: inputFiles,
				output_files: { out_video: "merged_scenes.mp4" },
				vcpu_count: 8, // Higher for video processing
			}),
		});

		if (!submitRes.ok) {
			const errorText = await submitRes.text();
			throw new Error(`Rendi submit failed: ${submitRes.status} ${errorText}`);
		}

		const { command_id: commandId } = (await submitRes.json()) as {
			command_id?: string;
		};
		if (!commandId) {
			throw new Error("Rendi did not return a command_id");
		}

		// Poll for result
		return await pollRendiCommand(commandId, "out_video");
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

export interface ConcatConfig {
	clipDuration: number; // seconds per scene
}

/**
 * Merge video scenes with hard cuts (no transitions) using Rendi
 * This produces a simple concatenation where each scene plays for clipDuration
 * seconds and then immediately cuts to the next scene.
 */
export async function mergeVideosConcat(
	sceneUrls: string[],
	config: ConcatConfig = { clipDuration: 10.0 },
): Promise<RendiVideoResult> {
	if (!RENDI_API_KEY) {
		return { success: false, error: "RENDI_API_KEY not configured" };
	}

	if (sceneUrls.length < 2) {
		return { success: false, error: "Need at least 2 scenes to merge" };
	}

	try {
		// Build input placeholders and files map
		const inputPlaceholders: string[] = [];
		const inputFiles: Record<string, string> = {};

		sceneUrls.forEach((url, i) => {
			const key = `in_scene${i + 1}`;
			inputPlaceholders.push(`-i {{${key}}}`);
			inputFiles[key] = url;
		});

		// Build filter_complex for simple concat with trimming
		// Trim each video to clipDuration, then concatenate
		const filterComplex = buildConcatFilterComplex(
			sceneUrls.length,
			config.clipDuration,
		);

		const ffmpegCommand = `${inputPlaceholders.join(" ")} -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 {{out_video}}`;

		const submitRes = await fetch(`${RENDI_BASE_URL}/run-ffmpeg-command`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-KEY": RENDI_API_KEY,
			},
			body: JSON.stringify({
				ffmpeg_command: ffmpegCommand,
				input_files: inputFiles,
				output_files: { out_video: "merged_scenes.mp4" },
				vcpu_count: 8, // Higher for video processing
			}),
		});

		if (!submitRes.ok) {
			const errorText = await submitRes.text();
			throw new Error(`Rendi submit failed: ${submitRes.status} ${errorText}`);
		}

		const { command_id: commandId } = (await submitRes.json()) as {
			command_id?: string;
		};
		if (!commandId) {
			throw new Error("Rendi did not return a command_id");
		}

		// Poll for result
		return await pollRendiCommand(commandId, "out_video");
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Build concat filter_complex for N videos with simple hard cuts
 * Sprint 17 Fix: Changed from portrait (1080x1920) to landscape (1920x1080)
 * with lanczos high-quality scaling
 */
function buildConcatFilterComplex(
	numScenes: number,
	clipDuration: number,
): string {
	// Trim each scene and prepare for concatenation
	const trimParts: string[] = [];
	const concatInputs: string[] = [];

	for (let i = 0; i < numScenes; i++) {
		// Trim each video to clipDuration, scale to landscape 1920x1080 with lanczos
		trimParts.push(
			`[${i}:v]trim=duration=${clipDuration},setpts=PTS-STARTPTS,${SCALE_FILTER},format=yuv420p[v${i}]`,
		);
		concatInputs.push(`[v${i}]`);
	}

	// Concatenate all trimmed videos
	return `${trimParts.join(";")};${concatInputs.join("")}concat=n=${numScenes}:v=1:a=0[out]`;
}

/**
 * Merge audio and video into final output
 * Sprint 17 Task 17.4 Fix: Added scaling normalization to prevent deformation
 */
export async function mergeAudioVideo(
	videoUrl: string,
	audioUrl: string,
): Promise<RendiVideoResult> {
	if (!RENDI_API_KEY) {
		return { success: false, error: "RENDI_API_KEY not configured" };
	}

	try {
		// Sprint 17 Task 17.4 Fix: Apply scaling filter to ensure consistent dimensions
		// The previous `-c:v copy` would preserve SAR issues, causing deformed output
		// Now we re-encode with proper scaling to ensure 1920x1080 landscape
		const ffmpegCommand = `-i {{in_video}} -i {{in_audio}} -vf "${SCALE_FILTER}" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 192k -shortest {{out_final}}`;

		const submitRes = await fetch(`${RENDI_BASE_URL}/run-ffmpeg-command`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-KEY": RENDI_API_KEY,
			},
			body: JSON.stringify({
				ffmpeg_command: ffmpegCommand,
				input_files: {
					in_video: videoUrl,
					in_audio: audioUrl,
				},
				output_files: { out_final: "final_video.mp4" },
				vcpu_count: 4,
			}),
		});

		if (!submitRes.ok) {
			const errorText = await submitRes.text();
			throw new Error(`Rendi submit failed: ${submitRes.status} ${errorText}`);
		}

		const { command_id: commandId } = (await submitRes.json()) as {
			command_id?: string;
		};
		if (!commandId) {
			throw new Error("Rendi did not return a command_id");
		}

		return await pollRendiCommand(commandId, "out_final");
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Build xfade filter_complex for N videos (uniform transition)
 * Sprint 17 Fix: Added scaling normalization before xfade to ensure
 * consistent dimensions (1920x1080 landscape) with lanczos quality
 */
function buildXfadeFilterComplex(
	numScenes: number,
	transitionType: string,
	transitionDuration: number,
	clipDuration: number,
): string {
	const parts: string[] = [];

	// Step 1: Scale all inputs to consistent dimensions (Sprint 17 fix)
	for (let i = 0; i < numScenes; i++) {
		parts.push(`[${i}:v]${SCALE_FILTER}[s${i}]`);
	}

	// Step 2: Apply xfade transitions between scaled videos
	if (numScenes === 2) {
		const offset = clipDuration - transitionDuration;
		parts.push(
			`[s0][s1]xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset},format=yuv420p[out]`,
		);
	} else {
		// For 3+ scenes, chain the xfades
		let currentOffset = clipDuration - transitionDuration;

		// First transition: [s0][s1] -> [v1]
		parts.push(
			`[s0][s1]xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${currentOffset}[v1]`,
		);

		// Chain remaining transitions
		for (let i = 2; i < numScenes; i++) {
			currentOffset += clipDuration - transitionDuration;
			const prevLabel = `v${i - 1}`;
			const isLast = i === numScenes - 1;
			const nextLabel = isLast ? "out" : `v${i}`;
			const formatSuffix = isLast ? ",format=yuv420p" : "";

			parts.push(
				`[${prevLabel}][s${i}]xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${currentOffset}${formatSuffix}[${nextLabel}]`,
			);
		}
	}

	return parts.join(";");
}

/**
 * Sprint 11 Phase 2: Build xfade filter_complex with per-scene transitions
 * Each transition between scenes can have a different effect and duration
 * Sprint 17 Fix: Added scaling normalization before xfade
 *
 * @param numScenes Number of video scenes
 * @param transitions Array of per-scene transitions (length = numScenes - 1)
 * @param clipDuration Duration of each clip in seconds
 */
function buildPerSceneXfadeFilterComplex(
	numScenes: number,
	transitions: PerSceneTransition[],
	clipDuration: number,
): string {
	// Validate we have the right number of transitions
	const expectedTransitions = numScenes - 1;
	if (transitions.length !== expectedTransitions) {
		console.warn(
			`[buildPerSceneXfadeFilterComplex] Expected ${expectedTransitions} transitions, got ${transitions.length}. Using defaults for missing.`,
		);
	}

	// Helper to get transition config with fallback
	const getTransition = (index: number): PerSceneTransition => {
		return transitions[index] ?? { effectKey: "circleopen", duration: 1.0 };
	};

	const parts: string[] = [];

	// Step 1: Scale all inputs to consistent dimensions (Sprint 17 fix)
	for (let i = 0; i < numScenes; i++) {
		parts.push(`[${i}:v]${SCALE_FILTER}[s${i}]`);
	}

	// Step 2: Apply xfade transitions between scaled videos
	if (numScenes === 2) {
		const t = getTransition(0);
		const offset = clipDuration - t.duration;
		parts.push(
			`[s0][s1]xfade=transition=${t.effectKey}:duration=${t.duration}:offset=${offset},format=yuv420p[out]`,
		);
	} else {
		// For 3+ scenes, chain the xfades with different transitions
		const t0 = getTransition(0);
		let currentOffset = clipDuration - t0.duration;
		parts.push(
			`[s0][s1]xfade=transition=${t0.effectKey}:duration=${t0.duration}:offset=${currentOffset}[v1]`,
		);

		// Chain remaining transitions
		for (let i = 2; i < numScenes; i++) {
			const t = getTransition(i - 1);
			currentOffset += clipDuration - t.duration;
			const prevLabel = `v${i - 1}`;
			const isLast = i === numScenes - 1;
			const nextLabel = isLast ? "out" : `v${i}`;
			const formatSuffix = isLast ? ",format=yuv420p" : "";

			parts.push(
				`[${prevLabel}][s${i}]xfade=transition=${t.effectKey}:duration=${t.duration}:offset=${currentOffset}${formatSuffix}[${nextLabel}]`,
			);
		}
	}

	return parts.join(";");
}

/**
 * Sprint 11 Phase 2: Merge video scenes with per-scene xfade transitions
 * Each scene pair can have a different transition effect
 */
export async function mergeVideosWithPerSceneXfade(
	sceneUrls: string[],
	config: PerSceneXfadeConfig,
): Promise<RendiVideoResult> {
	if (!RENDI_API_KEY) {
		return { success: false, error: "RENDI_API_KEY not configured" };
	}

	if (sceneUrls.length < 2) {
		return { success: false, error: "Need at least 2 scenes to merge" };
	}

	try {
		// Build input placeholders and files map
		const inputPlaceholders: string[] = [];
		const inputFiles: Record<string, string> = {};

		sceneUrls.forEach((url, i) => {
			const key = `in_scene${i + 1}`;
			inputPlaceholders.push(`-i {{${key}}}`);
			inputFiles[key] = url;
		});

		// Build filter_complex with per-scene transitions
		const filterComplex = buildPerSceneXfadeFilterComplex(
			sceneUrls.length,
			config.transitions,
			config.clipDuration,
		);

		console.log(
			`[mergeVideosWithPerSceneXfade] Filter complex: ${filterComplex}`,
		);

		const ffmpegCommand = `${inputPlaceholders.join(" ")} -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 {{out_video}}`;

		const submitRes = await fetch(`${RENDI_BASE_URL}/run-ffmpeg-command`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-KEY": RENDI_API_KEY,
			},
			body: JSON.stringify({
				ffmpeg_command: ffmpegCommand,
				input_files: inputFiles,
				output_files: { out_video: "merged_scenes.mp4" },
				vcpu_count: 8,
			}),
		});

		if (!submitRes.ok) {
			const errorText = await submitRes.text();
			throw new Error(`Rendi submit failed: ${submitRes.status} ${errorText}`);
		}

		const { command_id: commandId } = (await submitRes.json()) as {
			command_id?: string;
		};
		if (!commandId) {
			throw new Error("Rendi did not return a command_id");
		}

		return await pollRendiCommand(commandId, "out_video");
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Poll Rendi command until completion
 */
async function pollRendiCommand(
	commandId: string,
	outputKey: string,
): Promise<RendiVideoResult> {
	let attempts = 0;
	const maxAttempts = 120; // 4 minutes max for video
	let consecutiveErrors = 0;
	const maxConsecutiveErrors = 10; // Increased from 3 to handle Cloudflare 524 timeouts

	while (attempts < maxAttempts) {
		attempts += 1;
		await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s intervals for video

		try {
			const pollRes = await fetch(`${RENDI_BASE_URL}/commands/${commandId}`, {
				headers: { "X-API-KEY": RENDI_API_KEY as string },
			});

			if (!pollRes.ok) {
				// Transient HTTP errors (especially 524 timeouts) - retry instead of failing immediately
				consecutiveErrors++;
				const errorText = await pollRes.text();
				const is524Timeout =
					pollRes.status === 524 || /524|timeout occurred/i.test(errorText);

				console.warn(
					`[VideoProcessing] Poll error (${consecutiveErrors}/${maxConsecutiveErrors}): ${pollRes.status} ${is524Timeout ? "(Cloudflare timeout - job still running)" : ""}`,
				);

				if (consecutiveErrors >= maxConsecutiveErrors) {
					throw new Error(
						`Rendi poll failed after ${maxConsecutiveErrors} consecutive errors: ${pollRes.status}`,
					);
				}
				continue; // Retry on next iteration
			}

			// Reset consecutive errors on successful poll
			consecutiveErrors = 0;

			const pollData = (await pollRes.json()) as {
				status: string;
				output_files?: Record<
					string,
					{ storage_url?: string; file_id?: string; duration?: number }
				>;
				error_message?: string;
			};

			if (pollData.status === "SUCCESS") {
				const output = pollData.output_files?.[outputKey];
				return {
					success: true,
					videoUrl: output?.storage_url,
					fileId: output?.file_id,
					duration: output?.duration,
				};
			}

			if (pollData.status === "FAILED") {
				return {
					success: false,
					error: pollData.error_message || "Rendi command failed",
				};
			}
		} catch (pollError) {
			// Network errors - also retry
			consecutiveErrors++;
			console.warn(
				`[VideoProcessing] Poll network error (${consecutiveErrors}/${maxConsecutiveErrors}):`,
				pollError,
			);

			if (consecutiveErrors >= maxConsecutiveErrors) {
				throw pollError;
			}
			// Continue to next attempt
		}
	}

	throw new Error("Rendi video processing timeout after 4 minutes");
}

/**
 * Delete a Rendi file by ID
 */
export async function deleteRendiFile(fileId?: string): Promise<void> {
	if (!fileId || !RENDI_API_KEY) return;

	try {
		await fetch(`${RENDI_BASE_URL}/files/${fileId}`, {
			method: "DELETE",
			headers: { "X-API-KEY": RENDI_API_KEY },
		});
	} catch (error) {
		console.error("Failed to cleanup Rendi file:", error);
	}
}

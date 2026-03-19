const RENDI_API_KEY = process.env.RENDI_API_KEY;

type RendiCommandStatus = "QUEUED" | "PROCESSING" | "SUCCESS" | "FAILED";

export interface RendiAudioResult {
	success: boolean;
	mixedAudioUrl?: string;
	fileId?: string;
	error?: string;
}

const AUDIO_CONFIG = {
	musicPreVolume: 0.4,
	threshold: 0.03,
	ratio: 9,
	attack: 10,
	release: 200,
	makeup: 1,
	loudnormI: -16,
	loudnormTP: -1.5,
	loudnormLRA: 11,
};

/**
 * @param targetDurationSeconds Expected video length (e.g. 30 for 3×10s). Mix output is forced to this length (trim or pad) so final = min(video, mix) = video length.
 */
export async function mixAudioWithRendi(
	narrationUrl: string,
	musicUrl: string,
	targetDurationSeconds: number,
): Promise<RendiAudioResult> {
	if (!RENDI_API_KEY) {
		return { success: false, error: "RENDI_API_KEY not configured" };
	}

	// Sidechain + Loudnorm. amix [ducked][narr] duration=first = music length. Then force output to targetDurationSeconds (trim or pad).
	const filterComplex = `
    [0:a]asplit=2[sc][narr];
    [1:a]volume=${AUDIO_CONFIG.musicPreVolume}[music];
    [music][sc]sidechaincompress=threshold=${AUDIO_CONFIG.threshold}:ratio=${AUDIO_CONFIG.ratio}:attack=${AUDIO_CONFIG.attack}:release=${AUDIO_CONFIG.release}:makeup=${AUDIO_CONFIG.makeup}[ducked];
    [ducked][narr]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=${AUDIO_CONFIG.loudnormI}:TP=${AUDIO_CONFIG.loudnormTP}:LRA=${AUDIO_CONFIG.loudnormLRA}[out];
    [out]atrim=duration=${targetDurationSeconds},apad=whole_dur=${targetDurationSeconds}[final]
  `
		.replace(/\s+/g, " ")
		.trim();

	const command = `-i {{in_narration}} -i {{in_music}} -filter_complex "${filterComplex}" -map "[final]" -c:a aac -b:a 192k {{out_mixed}}`;

	try {
		const submitRes = await fetch(
			"https://api.rendi.dev/v1/run-ffmpeg-command",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-API-KEY": RENDI_API_KEY,
				},
				body: JSON.stringify({
					ffmpeg_command: command,
					input_files: {
						in_narration: narrationUrl,
						in_music: musicUrl,
					},
					output_files: {
						out_mixed: "mixed_audio.m4a",
					},
					vcpu_count: 2,
				}),
			},
		);

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

		let attempts = 0;
		const maxAttempts = 120; // 4 minutes max wait (match video processing)
		let consecutiveErrors = 0;
		const maxConsecutiveErrors = 3;

		while (attempts < maxAttempts) {
			attempts += 1;
			await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s intervals (match video)

			try {
				const pollRes = await fetch(
					`https://api.rendi.dev/v1/commands/${commandId}`,
					{
						headers: { "X-API-KEY": RENDI_API_KEY as string },
					},
				);

				if (!pollRes.ok) {
					// Transient HTTP errors - retry instead of failing immediately
					consecutiveErrors++;
					const errorText = await pollRes.text();
					console.warn(
						`[AudioMixing] Poll error (${consecutiveErrors}/${maxConsecutiveErrors}): ${pollRes.status} ${errorText}`,
					);

					if (consecutiveErrors >= maxConsecutiveErrors) {
						throw new Error(
							`Rendi poll failed after ${maxConsecutiveErrors} consecutive errors: ${pollRes.status} ${errorText}`,
						);
					}
					continue; // Retry on next iteration
				}

				// Reset consecutive errors on successful poll
				consecutiveErrors = 0;

				const pollData = (await pollRes.json()) as {
					status: RendiCommandStatus;
					output_files?: {
						out_mixed?: { storage_url?: string; file_id?: string };
					};
					error_message?: string;
				};

				if (pollData.status === "SUCCESS") {
					return {
						success: true,
						mixedAudioUrl: pollData.output_files?.out_mixed?.storage_url,
						fileId: pollData.output_files?.out_mixed?.file_id,
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
					`[AudioMixing] Poll network error (${consecutiveErrors}/${maxConsecutiveErrors}):`,
					pollError,
				);

				if (consecutiveErrors >= maxConsecutiveErrors) {
					throw pollError;
				}
				// Continue to next attempt
			}
		}

		throw new Error("Rendi audio mixing timeout after 4 minutes");
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function deleteRendiFile(fileId?: string): Promise<void> {
	if (!fileId || !RENDI_API_KEY) return;

	try {
		await fetch(`https://api.rendi.dev/v1/files/${fileId}`, {
			method: "DELETE",
			headers: { "X-API-KEY": RENDI_API_KEY },
		});
	} catch (error) {
		console.error("Failed to cleanup Rendi file:", error);
	}
}

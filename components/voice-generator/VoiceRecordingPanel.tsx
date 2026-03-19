"use client";

import { Mic, RotateCcw, Save, Square, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface VoiceRecordingPanelProps {
	/** Callback when recording is saved — called directly with blob+duration */
	onSave?: (audioBlob: Blob, duration: number) => void;
	/** Called when the user wants to dismiss/close the panel */
	onClose?: () => void;
	/** Disable all controls (e.g., during processing) */
	disabled?: boolean;
	/** Optional CSS class */
	className?: string;
}

type RecordingState =
	| "idle" // No recording, no preview
	| "requesting" // Requesting microphone permission
	| "recording" // Active recording
	| "preview" // Has recorded audio, can preview
	| "permission_denied"; // Microphone permission denied

/**
 * VoiceRecordingPanel - Mobile-first voice recording interface
 *
 * Features:
 * - Large 88px touch-friendly record button
 * - Real-time waveform visualization
 * - MediaRecorder API integration
 * - Microphone permission handling
 * - Preview, retry, and save controls
 * - File upload alternative
 * - Glass panel design system
 */
export function VoiceRecordingPanel({
	onSave,
	onClose,
	disabled = false,
	className,
}: VoiceRecordingPanelProps) {
	const t = useTranslations("voice_generator.recording");

	const [state, setState] = useState<RecordingState>("idle");
	const [recordingDuration, setRecordingDuration] = useState(0);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioDuration, setAudioDuration] = useState(0);
	const [waveformData, setWaveformData] = useState<number[]>(
		Array(16).fill(0.3),
	);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const recordingTimerRef = useRef<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const waveformBarsRef = useRef<(HTMLDivElement | null)[]>([]);
	// Detected MIME type — set before MediaRecorder construction, consumed in onstop
	const detectedMimeTypeRef = useRef<string>("");

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop();
				}
			}
			if (
				audioContextRef.current &&
				audioContextRef.current.state !== "closed"
			) {
				audioContextRef.current.close();
			}
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			if (recordingTimerRef.current) {
				clearInterval(recordingTimerRef.current);
			}
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	// Animate waveform during recording using direct DOM manipulation for 60fps
	const animateWaveform = useCallback(() => {
		const bars = waveformBarsRef.current.filter(Boolean);

		if (bars.length === 0) {
			// Bars not yet rendered, retry on next frame
			animationFrameRef.current = requestAnimationFrame(animateWaveform);
			return;
		}

		if (!analyserRef.current) {
			// If no analyser, create a pulsing animation to show it's recording
			const time = Date.now() / 200;
			bars.forEach((bar, i) => {
				if (!bar) return;
				const pulse = Math.sin(time + i * 0.2) * 0.3 + 0.5; // 0.2-0.8
				const height = Math.max(0.2, pulse);
				// Direct DOM manipulation bypasses React's render cycle for 60fps
				bar.style.height = `${height * 100}%`;
			});

			animationFrameRef.current = requestAnimationFrame(animateWaveform);
			return;
		}

		const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
		analyserRef.current.getByteFrequencyData(dataArray);

		// Sample 16 points for visualization
		const step = Math.floor(dataArray.length / 16);
		bars.forEach((bar, i) => {
			if (!bar) return;
			const value = dataArray[i * step] || 0;
			// Add a minimum height to ensure visible movement
			const height = Math.max(0.2, value / 255); // Normalize to 0.2-1.0
			// Direct DOM manipulation for smooth 60fps animation
			bar.style.height = `${height * 100}%`;
		});

		animationFrameRef.current = requestAnimationFrame(animateWaveform);
	}, []);

	// Start/stop animation based on recording state
	useEffect(() => {
		if (state === "recording") {
			// Small delay to ensure DOM refs are populated
			const timeoutId = setTimeout(() => {
				animateWaveform();
			}, 50);
			return () => {
				clearTimeout(timeoutId);
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
					animationFrameRef.current = null;
				}
			};
		}
		// Stop animation when not recording
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
	}, [state, animateWaveform]);

	// Start recording
	const handleStartRecording = useCallback(async () => {
		if (disabled) return;

		try {
			setState("requesting");

			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			// Setup audio analysis for waveform
			const audioContext = new AudioContext();
			if (audioContext.state === "suspended") {
				await audioContext.resume();
			}
			audioContextRef.current = audioContext;
			const source = audioContext.createMediaStreamSource(stream);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);
			analyserRef.current = analyser;

			// Setup MediaRecorder with cross-browser MIME type detection
			const mimeType =
				["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(
					(t) => MediaRecorder.isTypeSupported(t),
				) ?? "";
			detectedMimeTypeRef.current = mimeType;
			const mediaRecorder = new MediaRecorder(
				stream,
				mimeType ? { mimeType } : {},
			);
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: detectedMimeTypeRef.current || "audio/mpeg",
				});
				const url = URL.createObjectURL(audioBlob);
				setAudioUrl(url);

				// Calculate duration from audio element
				const audio = new Audio(url);
				audio.addEventListener("loadedmetadata", () => {
					setAudioDuration(Math.round(audio.duration));
				});

				setState("preview");

				// Cleanup
				if (streamRef.current) {
					for (const track of streamRef.current.getTracks()) {
						track.stop();
					}
				}
				if (
					audioContextRef.current &&
					audioContextRef.current.state !== "closed"
				) {
					audioContextRef.current.close();
				}
			};

			mediaRecorder.start();
			setState("recording");
			setRecordingDuration(0);

			// Start timer
			recordingTimerRef.current = window.setInterval(() => {
				setRecordingDuration((prev) => prev + 1);
			}, 1000);

			// Animation now starts via useEffect when state changes to "recording"
		} catch (error) {
			console.error("Failed to start recording:", error);
			if (error instanceof DOMException && error.name === "NotAllowedError") {
				setState("permission_denied");
			} else {
				setState("idle");
			}
		}
	}, [disabled]);

	// Stop recording
	const handleStopRecording = useCallback(() => {
		if (mediaRecorderRef.current && state === "recording") {
			mediaRecorderRef.current.stop();
			if (recordingTimerRef.current) {
				clearInterval(recordingTimerRef.current);
			}
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		}
	}, [state]);

	// Retry recording
	const handleRetry = useCallback(() => {
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
			setAudioUrl(null);
		}
		setRecordingDuration(0);
		setAudioDuration(0);
		setWaveformData(Array(16).fill(0.3));
		setState("idle");
	}, [audioUrl]);

	// Save recording — fetch blob and call onSave directly (no modal here)
	const handleSave = useCallback(async () => {
		if (!audioUrl || !onSave) return;
		const response = await fetch(audioUrl);
		const blob = await response.blob();
		onSave(blob, Math.max(audioDuration, recordingDuration));
	}, [audioUrl, audioDuration, recordingDuration, onSave]);

	// Handle file upload
	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			// Validate file type
			if (!file.type.startsWith("audio/")) {
				console.error("Invalid file type:", file.type);
				return;
			}

			const url = URL.createObjectURL(file);
			setAudioUrl(url);

			// Calculate duration
			const audio = new Audio(url);
			audio.addEventListener("loadedmetadata", () => {
				setAudioDuration(Math.round(audio.duration));
			});

			setState("preview");
		},
		[],
	);

	// Request permission button
	const handleRequestPermission = useCallback(() => {
		setState("idle");
		handleStartRecording();
	}, [handleStartRecording]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: panel intercepts scrim clicks; inner buttons/controls handle all keyboard navigation
		// biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only — no action; keyboard users interact with inner controls
		<div
			className={cn("glass-panel shadow-xl p-4 md:p-6", className)}
			onClick={(e) => e.stopPropagation()}
		>
			{/* Close button — h-11 reserves layout space so the button stays within the scroll container */}
			{onClose && (
				<div className="relative h-11">
					<button
						type="button"
						onClick={onClose}
						aria-label={t("close")}
						className="absolute top-0 right-0 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
					>
						<X className="size-5" aria-hidden="true" />
					</button>
				</div>
			)}

			<div className="space-y-4 md:space-y-6">
				{/* Title */}
				<div>
					<Label className="text-base font-medium leading-relaxed">
						{t("title")}
					</Label>
				</div>

				{/* Waveform visualization */}
				<div className="flex items-center justify-center h-20 md:h-24 gap-1 md:gap-1.5 px-4 bg-muted/20 rounded-lg">
					{waveformData.map((amplitude, i) => (
						<div
							key={`wave-${
								// biome-ignore lint/suspicious/noArrayIndexKey: waveform bars are purely visual
								i
							}`}
							ref={(el) => {
								waveformBarsRef.current[i] = el;
							}}
							className={cn(
								"w-1.5 md:w-2 rounded-full bg-gradient-to-t from-primary to-primary/60",
								// Remove transition during recording for smooth 60fps animation
								state !== "recording" && "transition-all duration-200",
							)}
							style={
								state !== "recording"
									? { height: `${amplitude * 100}%` }
									: undefined
							}
							aria-hidden="true"
						/>
					))}
				</div>

				{/* Permission denied state */}
				{state === "permission_denied" && (
					<div className="glass-inner-field p-3 md:p-4 text-center">
						<p className="text-sm text-destructive leading-relaxed mb-3">
							{t("permission_denied")}
						</p>
						<Button
							onClick={handleRequestPermission}
							className="min-h-[44px]"
							disabled={disabled}
						>
							{t("permission_request")}
						</Button>
					</div>
				)}

				{/* Main record button (88px touch target) */}
				{state !== "permission_denied" && state !== "preview" && (
					<div className="flex justify-center">
						<Button
							size="lg"
							variant={state === "recording" ? "destructive" : "default"}
							className="h-[88px] w-[88px] rounded-full transition-smooth active:scale-95 focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
							onClick={
								state === "recording"
									? handleStopRecording
									: handleStartRecording
							}
							disabled={disabled || state === "requesting"}
							aria-label={
								state === "recording" ? t("stop_recording") : t("tap_to_record")
							}
							aria-pressed={state === "recording"}
						>
							{state === "recording" ? (
								<Square className="size-8" aria-hidden="true" />
							) : (
								<Mic className="size-8" aria-hidden="true" />
							)}
						</Button>
					</div>
				)}

				{/* Status text */}
				{state === "recording" && (
					<p
						aria-live="polite"
						className="text-center text-sm text-muted-foreground leading-relaxed"
					>
						{t("recording_active", { duration: recordingDuration })}
					</p>
				)}

				{state === "idle" && (
					<p
						aria-live="polite"
						className="text-center text-sm text-muted-foreground leading-relaxed"
					>
						{t("tap_to_record")}
					</p>
				)}

				{/* Preview controls */}
				{state === "preview" && audioUrl && (
					<div className="space-y-4">
						<div className="glass-inner-field p-3 md:p-4">
							<p className="text-sm text-muted-foreground leading-relaxed mb-2">
								{t("preview_recording")} (
								{t("recording_duration_seconds", { seconds: audioDuration })})
							</p>
							{/* biome-ignore lint/a11y/useMediaCaption: preview audio without captions */}
							<audio
								src={audioUrl}
								controls
								className="w-full min-h-[44px]"
								aria-label={t("preview_recording")}
							/>
						</div>

						<div className="flex flex-col xs:flex-row gap-2">
							<Button
								variant="outline"
								onClick={handleRetry}
								disabled={disabled}
								className="flex-1 min-h-[44px] active:scale-95 transition-smooth"
							>
								<RotateCcw className="size-4 mr-2" aria-hidden="true" />
								{t("retry_recording")}
							</Button>
							<Button
								onClick={handleSave}
								disabled={disabled || !onSave}
								className="flex-1 min-h-[44px] active:scale-95 transition-smooth"
							>
								<Save className="size-4 mr-2" aria-hidden="true" />
								{t("save_recording")}
							</Button>
						</div>
					</div>
				)}

				{/* File upload alternative */}
				{(state === "idle" || state === "permission_denied") && (
					<div>
						<input
							ref={fileInputRef}
							type="file"
							accept="audio/*"
							onChange={handleFileUpload}
							className="hidden"
							disabled={disabled}
						/>
						<Button
							variant="outline"
							onClick={() => fileInputRef.current?.click()}
							disabled={disabled}
							className="w-full min-h-[44px] active:scale-95 transition-smooth"
						>
							<Upload className="size-4 mr-2" aria-hidden="true" />
							{t("upload_audio")}
						</Button>
						<p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
							{t("upload_hint")}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

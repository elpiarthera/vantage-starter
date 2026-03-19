"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";

interface ActionBarProps {
	generatedImage: { url: string; prompt: string } | null;
	hasI2IModels?: boolean;
	onLoadAsInput: () => void;
	onCopy: () => void;
	onDownload: () => void;
	onUseInVideo: () => void;
	useInVideoLabel?: string;
	onSaveToProject?: () => void;
	saveToProjectLabel?: string;
}

export function ActionBar({
	generatedImage,
	hasI2IModels = true,
	onLoadAsInput,
	onCopy,
	onDownload,
	onUseInVideo,
	useInVideoLabel,
	onSaveToProject,
	saveToProjectLabel,
}: ActionBarProps) {
	const t = useTranslations("image_generator");
	const { isMobile, isTablet } = useDevice();
	const isTouchDevice = isMobile || isTablet;

	const resolvedUseInVideoLabel = useInVideoLabel ?? t("use_in_video");
	const resolvedSaveToProjectLabel = saveToProjectLabel ?? t("save_to_project");

	// Button styling — compact (icons only) on touch devices, full (icons + text) on desktop
	const buttonClassName = cn(
		"min-h-[44px] text-xs bg-background/80 backdrop-blur-sm border-border/50",
		"text-foreground hover:bg-background/90 hover:border-border",
		"flex items-center gap-1 active:scale-95 transition-smooth",
		"disabled:opacity-50 disabled:cursor-not-allowed",
		isTouchDevice ? "min-w-[44px] px-2" : "min-w-[44px] px-3",
	);

	if (!generatedImage) return null;

	return (
		<div className="flex items-center justify-center gap-2 p-2">
			{hasI2IModels && (
				<Button
					type="button"
					onClick={onLoadAsInput}
					disabled={!generatedImage}
					variant="outline"
					size="sm"
					className={buttonClassName}
					title={t("use_as_input")}
				>
					<svg
						className="w-3 h-3"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden
						role="img"
					>
						<title>{t("use_as_input")}</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					<span className={isTouchDevice ? "sr-only" : ""}>
						{t("use_as_input")}
					</span>
				</Button>
			)}

			<Button
				type="button"
				onClick={onCopy}
				disabled={!generatedImage}
				variant="outline"
				size="sm"
				className={buttonClassName}
				title={t("copy_to_clipboard")}
			>
				<svg
					className="w-3 h-3"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden
					role="img"
				>
					<title>{t("copy")}</title>
					<rect
						x="9"
						y="9"
						width="13"
						height="13"
						rx="2"
						ry="2"
						strokeWidth="2"
					/>
					<path
						d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
						strokeWidth="2"
					/>
				</svg>
				<span className={isTouchDevice ? "sr-only" : ""}>{t("copy")}</span>
			</Button>

			<Button
				type="button"
				onClick={onDownload}
				disabled={!generatedImage}
				variant="outline"
				size="sm"
				className={buttonClassName}
				title={t("download_image")}
			>
				<svg
					className="w-3 h-3"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden
					role="img"
				>
					<title>{t("download")}</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					/>
				</svg>
				<span className={isTouchDevice ? "sr-only" : ""}>{t("download")}</span>
			</Button>

			<Button
				type="button"
				onClick={onUseInVideo}
				disabled={!generatedImage}
				variant="outline"
				size="sm"
				className={buttonClassName}
				title={resolvedUseInVideoLabel}
			>
				<svg
					className="w-3 h-3"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden
					role="img"
				>
					<title>{resolvedUseInVideoLabel}</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
					/>
				</svg>
				<span className={isTouchDevice ? "sr-only" : ""}>
					{resolvedUseInVideoLabel}
				</span>
			</Button>

			{onSaveToProject && (
				<Button
					type="button"
					onClick={onSaveToProject}
					disabled={!generatedImage}
					variant="default"
					size="sm"
					className={cn(
						buttonClassName,
						"bg-primary text-primary-foreground hover:bg-primary/90",
					)}
					title={resolvedSaveToProjectLabel}
				>
					<svg
						className="w-3 h-3"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden
						role="img"
					>
						<title>{resolvedSaveToProjectLabel}</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
						/>
					</svg>
					<span className={isTouchDevice ? "sr-only" : ""}>
						{resolvedSaveToProjectLabel}
					</span>
				</Button>
			)}
		</div>
	);
}

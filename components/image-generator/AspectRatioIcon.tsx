"use client";

import { cn } from "@/lib/utils";

/**
 * Visual aspect ratio icon component
 * Renders a proportional rectangle representing the aspect ratio
 * Sprint 30e.3: Visual Aspect Ratio Icons
 */

// Aspect ratio dimensions (normalized to fit in 16x16 viewBox)
const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
	// Common ratios
	"1:1": { width: 14, height: 14 },
	"16:9": { width: 16, height: 9 },
	"9:16": { width: 9, height: 16 },
	"4:3": { width: 14, height: 10.5 },
	"3:4": { width: 10.5, height: 14 },
	"3:2": { width: 15, height: 10 },
	"2:3": { width: 10, height: 15 },
	"21:9": { width: 16, height: 6.86 },
	"9:21": { width: 6.86, height: 16 },
	// Additional ratios from models
	"2:1": { width: 16, height: 8 },
	"1:2": { width: 8, height: 16 },
	"20:9": { width: 16, height: 7.2 },
	"9:20": { width: 7.2, height: 16 },
	"19.5:9": { width: 16, height: 7.38 },
	"9:19.5": { width: 7.38, height: 16 },
	"5:4": { width: 15, height: 12 },
	"4:5": { width: 12, height: 15 },
	auto: { width: 14, height: 14 }, // Square with dashed border for "auto"
};

interface AspectRatioIconProps {
	/** The aspect ratio string (e.g., "16:9", "1:1") */
	ratio: string;
	/** Additional CSS classes */
	className?: string;
	/** Size of the icon (default: 16) */
	size?: number;
}

export function AspectRatioIcon({
	ratio,
	className,
	size = 16,
}: AspectRatioIconProps) {
	const dimensions = ASPECT_RATIOS[ratio];

	// Fallback for unknown ratios: try to parse and calculate
	if (!dimensions) {
		const [w, h] = ratio.split(":").map(Number);
		if (w && h) {
			const scale = 14 / Math.max(w, h);
			const width = w * scale;
			const height = h * scale;
			return (
				<svg
					viewBox="0 0 16 16"
					width={size}
					height={size}
					className={cn("text-current", className)}
					aria-hidden="true"
				>
					<rect
						x={(16 - width) / 2}
						y={(16 - height) / 2}
						width={width}
						height={height}
						rx={1}
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
					/>
				</svg>
			);
		}
		// Ultimate fallback: square
		return (
			<svg
				viewBox="0 0 16 16"
				width={size}
				height={size}
				className={cn("text-current", className)}
				aria-hidden="true"
			>
				<rect
					x={1}
					y={1}
					width={14}
					height={14}
					rx={1}
					fill="none"
					stroke="currentColor"
					strokeWidth={1.5}
				/>
			</svg>
		);
	}

	const { width, height } = dimensions;
	const isAuto = ratio === "auto";

	return (
		<svg
			viewBox="0 0 16 16"
			width={size}
			height={size}
			className={cn("text-current", className)}
			aria-hidden="true"
		>
			<rect
				x={(16 - width) / 2}
				y={(16 - height) / 2}
				width={width}
				height={height}
				rx={1}
				fill="none"
				stroke="currentColor"
				strokeWidth={1.5}
				strokeDasharray={isAuto ? "2 2" : undefined}
			/>
		</svg>
	);
}

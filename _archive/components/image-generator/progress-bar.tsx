"use client";

import { Button } from "@/components/ui/button";

interface ProgressBarProps {
	progress: number;
	onCancel: () => void;
	isConverting?: boolean;
	cancelLabel?: string;
	convertingLabel?: string;
	runningLabel?: string;
}

export function ProgressBar({
	progress,
	onCancel,
	isConverting = false,
	cancelLabel = "Cancel",
	convertingLabel = "Converting HEIC image...",
	runningLabel = "Running...",
}: ProgressBarProps) {
	return (
		<div className="w-full h-full flex flex-col items-center justify-center px-4 select-none">
			<div className="w-full max-w-md">
				<div
					role="progressbar"
					aria-valuenow={Math.round(progress)}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label={runningLabel}
					className="relative h-4 md:h-8 bg-background/50 border border-border overflow-hidden mb-4"
					style={{ zIndex: 30 }}
				>
					<div
						className="absolute inset-0 opacity-20"
						style={{
							backgroundImage: `
                linear-gradient(90deg, transparent 0%, transparent 49%, #333 49%, #333 51%, transparent 51%),
                linear-gradient(0deg, transparent 0%, transparent 49%, #333 49%, #333 51%, transparent 51%)
              `,
							backgroundSize: "8px 8px",
						}}
					/>

					<div
						className="absolute top-0 left-0 h-full transition-all duration-100 ease-out"
						style={{
							width: `${progress}%`,
							backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  #005B5B 0px,
                  #005B5B 6px,
                  #007070 6px,
                  #007070 8px
                ),
                repeating-linear-gradient(
                  0deg,
                  #005B5B 0px,
                  #005B5B 6px,
                  #007070 6px,
                  #007070 8px
                )
              `,
							backgroundSize: "8px 8px",
						}}
					/>

					<div className="absolute inset-0 flex items-center justify-center">
						<span
							className="text-xs md:text-sm font-mono text-foreground/80"
							style={{ zIndex: 40 }}
						>
							{Math.round(progress)}%
						</span>
					</div>
				</div>

				<div className="text-center space-y-2">
					<p className="text-xs md:text-sm font-medium text-foreground animate-pulse">
						{isConverting ? convertingLabel : runningLabel}
					</p>
					{!isConverting && (
						<Button
							onClick={onCancel}
							variant="outline"
							className="text-xs min-h-[44px] px-4 bg-transparent"
						>
							{cancelLabel}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

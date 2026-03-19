"use client";

import { cn } from "@/lib/utils";

interface GlobalDropZoneProps {
	dropZoneHover: 1 | 2 | null;
	onSetDropZoneHover: (zone: 1 | 2 | null) => void;
	onDrop: (e: React.DragEvent, slot?: 1 | 2) => void;
	input1Label?: string;
	input2Label?: string;
	dropFirstLabel?: string;
	dropSecondLabel?: string;
}

export function GlobalDropZone({
	dropZoneHover,
	onSetDropZoneHover,
	onDrop,
	input1Label = "Input 1",
	input2Label = "Input 2",
	dropFirstLabel = "Drop here for first image",
	dropSecondLabel = "Drop here for second image",
}: GlobalDropZoneProps) {
	return (
		<section
			aria-label="Drop zone overlay"
			className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center gap-8 px-8"
			onDrop={(e) => {
				e.preventDefault();
				onDrop(e, 1);
			}}
		>
			<button
				type="button"
				className={cn(
					"flex-1 max-w-md h-64 border-4 border-dashed p-8 text-center transition-all duration-200 cursor-pointer",
					dropZoneHover === 1
						? "border-white bg-white/30 scale-110 shadow-2xl shadow-white/50"
						: "border-white/50 bg-white/5 hover:bg-white/10 hover:border-white/70",
				)}
				onDragEnter={() => onSetDropZoneHover(1)}
				onDragLeave={() => onSetDropZoneHover(null)}
				onDragOver={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
				onDrop={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onDrop(e, 1);
				}}
				aria-label={dropFirstLabel}
			>
				<div className="flex flex-col items-center justify-center h-full">
					<div
						className={cn(
							"w-16 h-16 flex items-center justify-center mb-4 transition-all",
							dropZoneHover === 1 ? "bg-white/40 scale-110" : "bg-white/10",
						)}
					>
						<span
							className={cn(
								"text-3xl font-bold transition-all",
								dropZoneHover === 1 ? "text-white" : "text-white/80",
							)}
						>
							1
						</span>
					</div>
					<svg
						className={cn(
							"w-12 h-12 mx-auto mb-4 transition-all",
							dropZoneHover === 1 ? "text-white scale-110" : "text-white/80",
						)}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden
					>
						<title>Upload</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					<p
						className={cn(
							"text-xl font-bold transition-all",
							dropZoneHover === 1 ? "text-white" : "text-white/80",
						)}
					>
						{input1Label}
					</p>
					<p
						className={cn(
							"text-sm mt-2 transition-all",
							dropZoneHover === 1 ? "text-white/90" : "text-white/70",
						)}
					>
						{dropFirstLabel}
					</p>
				</div>
			</button>

			<button
				type="button"
				className={cn(
					"flex-1 max-w-md h-64 border-4 border-dashed p-8 text-center transition-all duration-200 cursor-pointer",
					dropZoneHover === 2
						? "border-white bg-white/30 scale-110 shadow-2xl shadow-white/50"
						: "border-white/50 bg-white/5 hover:bg-white/10 hover:border-white/70",
				)}
				onDragEnter={() => onSetDropZoneHover(2)}
				onDragLeave={() => onSetDropZoneHover(null)}
				onDragOver={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
				onDrop={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onDrop(e, 2);
				}}
				aria-label={dropSecondLabel}
			>
				<div className="flex flex-col items-center justify-center h-full">
					<div
						className={cn(
							"w-16 h-16 flex items-center justify-center mb-4 transition-all",
							dropZoneHover === 2 ? "bg-white/40 scale-110" : "bg-white/10",
						)}
					>
						<span
							className={cn(
								"text-3xl font-bold transition-all",
								dropZoneHover === 2 ? "text-white" : "text-white/80",
							)}
						>
							2
						</span>
					</div>
					<svg
						className={cn(
							"w-12 h-12 mx-auto mb-4 transition-all",
							dropZoneHover === 2 ? "text-white scale-110" : "text-white/80",
						)}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden
					>
						<title>Upload</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					<p
						className={cn(
							"text-xl font-bold transition-all",
							dropZoneHover === 2 ? "text-white" : "text-white/80",
						)}
					>
						{input2Label}
					</p>
					<p
						className={cn(
							"text-sm mt-2 transition-all",
							dropZoneHover === 2 ? "text-white/90" : "text-white/70",
						)}
					>
						{dropSecondLabel}
					</p>
				</div>
			</button>
		</section>
	);
}

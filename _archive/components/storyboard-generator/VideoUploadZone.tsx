"use client";

import { Upload, Video, X } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface VideoUploadZoneProps {
	value?: string;
	onChange: (url: string | undefined) => void;
	required?: boolean;
	label: string;
	hint?: string;
	disabled?: boolean;
	className?: string;
}

export function VideoUploadZone({
	value,
	onChange,
	required = false,
	label,
	hint,
	disabled,
	className,
}: VideoUploadZoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const objectUrl = URL.createObjectURL(file);
		onChange(objectUrl);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		if (disabled) return;
		const file = e.dataTransfer.files?.[0];
		if (!file || !file.type.startsWith("video/")) return;
		const objectUrl = URL.createObjectURL(file);
		onChange(objectUrl);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	if (value) {
		return (
			<div className={cn("relative rounded-lg overflow-hidden", className)}>
				<video
					src={value}
					className="w-full aspect-video rounded-lg object-cover"
					controls={false}
					muted
					playsInline
				/>
				<div className="absolute inset-0 flex items-center justify-center">
					<Video className="size-8 text-foreground/60" aria-hidden="true" />
				</div>
				{!disabled && (
					<button
						type="button"
						onClick={() => onChange(undefined)}
						className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-smooth hover:bg-background active:scale-95"
						aria-label={`Remove ${label}`}
					>
						<X className="size-4" />
					</button>
				)}
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-1", className)}>
			<span className="text-xs font-medium text-muted-foreground">
				{label}
				{required && (
					<span className="ml-0.5 text-destructive" aria-hidden>
						*
					</span>
				)}
			</span>
			<button
				type="button"
				onClick={() => !disabled && inputRef.current?.click()}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				disabled={disabled}
				className={cn(
					"flex min-h-[44px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20 py-4 text-sm text-muted-foreground transition-smooth",
					"hover:border-border hover:bg-muted/30",
					disabled && "cursor-not-allowed opacity-50",
				)}
				aria-label={label}
			>
				<Upload
					className="size-6 text-muted-foreground/60"
					aria-hidden="true"
				/>
				<span className="text-xs font-medium">
					{hint ?? "MP4/MOV, max 200MB"}
				</span>
				<span className="text-xs text-muted-foreground/60">
					Drag & drop or click
				</span>
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="video/mp4,video/quicktime,.mp4,.mov"
				className="sr-only"
				onChange={handleFileChange}
				disabled={disabled}
				aria-label={label}
			/>
		</div>
	);
}

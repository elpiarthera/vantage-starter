"use client";

import { ImageIcon, Plus, X } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface StyleRefStripProps {
	urls: string[];
	onChange: (urls: string[]) => void;
	max?: number;
	disabled?: boolean;
}

export function StyleRefStrip({
	urls,
	onChange,
	max = 4,
	disabled,
}: StyleRefStripProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		const newUrls = files.map((f) => URL.createObjectURL(f));
		const combined = [...urls, ...newUrls].slice(0, max);
		onChange(combined);
		// reset so same file can be re-selected
		e.target.value = "";
	};

	const handleRemove = (index: number) => {
		onChange(urls.filter((_, i) => i !== index));
	};

	const canAdd = urls.length < max && !disabled;

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-medium text-muted-foreground">
				Style References ({urls.length}/{max})
			</span>
			<div className="flex items-center gap-2 overflow-x-auto pb-1">
				{urls.map((url, i) => (
					<div key={url} className="relative shrink-0">
						{/* biome-ignore lint/performance/noImgElement: object URL preview */}
						<img
							src={url}
							alt={`Style ref ${i + 1}`}
							className="size-16 rounded-lg object-cover border border-border/30"
						/>
						{!disabled && (
							<button
								type="button"
								onClick={() => handleRemove(i)}
								className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-background border border-border/50 text-foreground transition-smooth hover:bg-muted active:scale-95"
								aria-label={`Remove style ref ${i + 1}`}
							>
								<X className="size-3" />
							</button>
						)}
					</div>
				))}

				{canAdd && (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className={cn(
							"flex size-16 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20 transition-smooth",
							"hover:border-border hover:bg-muted/30 active:scale-95",
						)}
						aria-label="Add style reference image"
					>
						<Plus className="size-5 text-muted-foreground" />
					</button>
				)}

				{urls.length === 0 && !canAdd && (
					<div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border/30 bg-muted/20">
						<ImageIcon className="size-5 text-muted-foreground/40" />
					</div>
				)}
			</div>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				multiple
				className="sr-only"
				onChange={handleFileChange}
				disabled={disabled}
				aria-label="Upload style reference images"
			/>
		</div>
	);
}

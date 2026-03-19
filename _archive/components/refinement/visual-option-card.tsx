"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface VisualOptionCardProps {
	id: string;
	name: string;
	description?: string;
	imageUrl: string;
	isSelected: boolean;
	isSponsored?: boolean;
	onSelect: (id: string) => void;
	size?: "default" | "compact";
}

export function VisualOptionCard({
	id,
	name,
	description,
	imageUrl,
	isSelected,
	isSponsored = false,
	onSelect,
	size = "default",
}: VisualOptionCardProps) {
	const [imageError, setImageError] = useState(false);

	const heightClass =
		size === "compact" ? "h-28 md:h-32" : "h-32 md:h-40 lg:h-44";

	return (
		<button
			type="button"
			onClick={() => onSelect(id)}
			className={`
        relative overflow-hidden rounded-xl group cursor-pointer touch-optimized
        transition-all duration-300 ease-out gpu-accelerated
        ${heightClass}
        ${isSelected ? "ring-2 ring-[oklch(0.65_0.25_var(--hue))] ring-offset-2 ring-offset-[oklch(0.15_0.02_var(--hue))] scale-[0.98]" : "hover:scale-[1.02] active:scale-[0.98]"}
        ${isSponsored ? "ring-1 ring-amber-500/30" : ""}
      `}
			aria-pressed={isSelected}
			aria-label={`${name}${isSponsored ? " (Sponsored)" : ""}`}
		>
			{/* Image */}
			<Image
				src={
					imageError
						? "/placeholder.svg?height=400&width=600&text=Image"
						: imageUrl
				}
				alt={name}
				fill
				sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
				className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-active:scale-100"
				onError={() => setImageError(true)}
				priority={false}
				loading="lazy"
				quality={85}
			/>

			{/* Gradient Overlay */}
			<div
				className={`
        absolute inset-0 
        ${isSelected ? "bg-gradient-to-t from-[oklch(0.65_0.25_var(--hue))]/90 via-[oklch(0.65_0.25_var(--hue))]/30 to-transparent" : "bg-gradient-to-t from-black/80 via-black/20 to-transparent"}
        transition-all duration-300
      `}
			/>

			{/* Sponsored Badge */}
			{isSponsored && (
				<div className="absolute top-2 right-2 z-10">
					<div className="bg-amber-500/90 backdrop-blur-sm text-black text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
						<svg
							className="w-2.5 h-2.5"
							fill="currentColor"
							viewBox="0 0 16 16"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<path d="M8 0l2.5 5.5L16 6.5l-4 4 1 5.5-5-2.5-5 2.5 1-5.5-4-4 5.5-1L8 0z" />
						</svg>
						<span>Sponsored</span>
					</div>
				</div>
			)}

			{/* Selection Checkmark */}
			{isSelected && (
				<div className="absolute top-2 left-2 z-10">
					<div className="bg-[oklch(0.65_0.25_var(--hue))] rounded-full p-1 shadow-lg animate-in zoom-in duration-200">
						<Check className="w-4 h-4 text-white" />
					</div>
				</div>
			)}

			{/* Content */}
			<div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
				<h4
					className={`
          font-semibold text-white mb-0.5
          ${size === "compact" ? "text-xs md:text-sm" : "text-sm md:text-base"}
          ${isSelected ? "drop-shadow-lg" : ""}
        `}
				>
					{name}
				</h4>
				{description && (
					<p
						className={`
            text-white/80 line-clamp-1
            ${size === "compact" ? "text-[10px] md:text-xs" : "text-xs md:text-sm"}
            ${isSelected ? "drop-shadow" : ""}
          `}
					>
						{description}
					</p>
				)}
			</div>
		</button>
	);
}

/**
 * Tool Card Component
 * Sprint 24: Tool Selection Wall Feature
 *
 * Displays a single tool card on the tools page
 * Uses MyShortReel design tokens and i18n
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Doc } from "@/convex/_generated/dataModel";

interface ToolCardProps {
	tool: Doc<"tools">;
	onClick: () => void;
}

export function ToolCard({ tool, onClick }: ToolCardProps) {
	const t = useTranslations();

	return (
		<button
			onClick={onClick}
			className="group relative flex flex-col items-center justify-center p-4 rounded-lg bg-card hover:bg-secondary transition-smooth border border-border hover:border-primary/50 min-h-[180px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
		>
			{/* Background gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent rounded-lg" />

			{/* Content */}
			<div className="relative z-10 text-center">
				{tool.imageUrl && (
					<div className="relative w-12 h-12 mx-auto mb-2">
						<Image
							src={tool.imageUrl}
							alt={t(tool.nameTranslationKey)}
							fill
							className="object-contain"
						/>
					</div>
				)}

				<h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-smooth">
					{t(tool.nameTranslationKey)}
				</h3>

				{tool.description && (
					<p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
						{t(tool.descriptionTranslationKey)}
					</p>
				)}
			</div>

			{/* Hover indicator */}
			<div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/10 transition-smooth" />
		</button>
	);
}

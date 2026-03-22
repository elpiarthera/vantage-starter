"use client";

import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type FeatureItem = {
	icon: React.ReactNode;
	titleKey: string;
	descKey: string;
	/** "large" cards span 2 cols on desktop and get extra padding / larger title */
	size?: "large" | "standard";
};

const FEATURES: FeatureItem[] = [
	{
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
				<path d="M5 3v4" />
				<path d="M19 17v4" />
				<path d="M3 5h4" />
				<path d="M17 19h4" />
			</svg>
		),
		titleKey: "ai_renders_title",
		descKey: "ai_renders_desc",
		size: "large",
	},
	{
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
			</svg>
		),
		titleKey: "realtime_title",
		descKey: "realtime_desc",
		size: "standard",
	},
	{
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<circle cx="8" cy="8" r="6" />
				<path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
				<path d="M7 6h1v4" />
				<path d="m16.71 13.88.7.71-2.82 2.82" />
			</svg>
		),
		titleKey: "credits_title",
		descKey: "credits_desc",
		size: "standard",
	},
	{
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
			</svg>
		),
		titleKey: "media_title",
		descKey: "media_desc",
		size: "large",
	},
	{
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M12 8V4H8" />
				<rect width="16" height="12" x="4" y="8" rx="2" />
				<path d="M2 14h2" />
				<path d="M20 14h2" />
				<path d="M15 13v2" />
				<path d="M9 13v2" />
			</svg>
		),
		titleKey: "agents_title",
		descKey: "agents_desc",
		size: "standard",
	},
	{
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" />
				<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
				<path d="M2 12h20" />
			</svg>
		),
		titleKey: "i18n_title",
		descKey: "i18n_desc",
		size: "standard",
	},
];

function useRevealOnScroll(
	ref: React.RefObject<HTMLElement | null>,
	delay = 0,
) {
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		// Respect reduced motion
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			el.style.opacity = "1";
			el.style.transform = "none";
			return;
		}

		el.classList.add("reveal");
		if (delay > 0) {
			el.style.transitionDelay = `${delay}s`;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.classList.add("revealed");
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [ref, delay]);
}

export function FeaturesSection() {
	const t = useTranslations("landing.features");
	const headerRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);

	useRevealOnScroll(headerRef as React.RefObject<HTMLElement | null>);
	useRevealOnScroll(gridRef as React.RefObject<HTMLElement | null>, 0.1);

	return (
		<section
			id="features"
			aria-labelledby="features-heading"
			className="relative py-24 md:py-32"
		>
			{/* Subtle section background */}
			<div
				className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent"
				aria-hidden="true"
			/>

			<div className="relative max-w-6xl mx-auto px-6 lg:px-12">
				{/* Section header */}
				<div ref={headerRef} className="mb-16 text-center">
					<p className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
						{t("eyebrow")}
					</p>
					<h2
						id="features-heading"
						className="font-heading font-bold text-foreground text-3xl md:text-4xl lg:text-5xl leading-[1.15] tracking-[-0.03em] mb-4"
					>
						{t("heading")}
					</h2>
				</div>

				<div ref={gridRef} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((feature, index) => (
						<FeatureCard
							key={feature.titleKey}
							feature={feature}
							t={t}
							staggerIndex={index}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

const STAGGER_DELAYS = [0, 0.06, 0.12, 0.18, 0.24, 0.35];

function FeatureCard({
	feature,
	t,
	className,
	staggerIndex = 0,
}: {
	feature: FeatureItem;
	t: ReturnType<typeof useTranslations>;
	className?: string;
	staggerIndex?: number;
}) {
	const isLarge = feature.size === "large";
	const delay = STAGGER_DELAYS[staggerIndex] ?? 0;

	return (
		<article
			className={cn(
				"group relative rounded-2xl border border-border bg-card p-6",
				"card-elevated transition-[border-color] hover:border-border/60",
				className,
			)}
			style={{ transitionDelay: `${delay}s` }}
		>
			{/* Subtle gradient overlay on hover */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-muted/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
				aria-hidden="true"
			/>

			<div className="relative">
				{/* Icon — inverts on hover */}
				<div
					className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:shadow-md group-hover:scale-105"
					aria-hidden="true"
				>
					{feature.icon}
				</div>

				{/* Title */}
				<h3
					className={cn(
						"font-heading font-semibold leading-[1.3] tracking-[-0.015em] text-foreground mb-2 transition-transform duration-300 group-hover:translate-x-0.5",
						isLarge ? "text-lg" : "text-[1.0625rem]",
					)}
				>
					{t(feature.titleKey)}
				</h3>

				{/* Description */}
				<p className="text-sm leading-relaxed text-muted-foreground">
					{t(feature.descKey)}
				</p>
			</div>
		</article>
	);
}

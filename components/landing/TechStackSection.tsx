"use client";

import { useTranslations } from "next-intl";
import type React from "react";

type TechItem = {
	name: string;
	icon: React.ReactNode;
};

// SVGs hardcoded from svgl.app for reliability (no runtime fetch)
const TECH_STACK: TechItem[] = [
	{
		name: "Next.js",
		icon: (
			<svg aria-hidden="true" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
				<mask id="mask0_408_139" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
					<circle cx="90" cy="90" r="90" fill="black" />
				</mask>
				<g mask="url(#mask0_408_139)">
					<circle cx="90" cy="90" r="90" fill="black" />
					<path d="M149.508 157.52L69.142 54H54V125.97H66.1V69.3L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="url(#paint0_linear_408_139)" />
					<rect x="115" y="54" width="12" height="72" fill="url(#paint1_linear_408_139)" />
				</g>
				<defs>
					<linearGradient id="paint0_linear_408_139" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
						<stop stopColor="white" />
						<stop offset="1" stopColor="white" stopOpacity="0" />
					</linearGradient>
					<linearGradient id="paint1_linear_408_139" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
						<stop stopColor="white" />
						<stop offset="1" stopColor="white" stopOpacity="0" />
					</linearGradient>
				</defs>
			</svg>
		),
	},
	{
		name: "Convex",
		icon: (
			<svg aria-hidden="true" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="256" height="256" rx="60" fill="#EE342F" />
				<path d="M210.358 60.0001L128 210L45.6421 60.0001H210.358Z" fill="white" />
			</svg>
		),
	},
	{
		name: "Clerk",
		icon: (
			<svg aria-hidden="true" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="40" height="40" rx="8" fill="#6C47FF" />
				<path d="M27.456 25.388a1.385 1.385 0 0 1-.974-.399l-2.378-2.326a3.705 3.705 0 0 1-4.208 0l-2.378 2.326a1.385 1.385 0 1 1-1.948-1.972l2.374-2.323a3.705 3.705 0 0 1 0-4.388l-2.374-2.323a1.385 1.385 0 0 1 1.948-1.972l2.378 2.326a3.705 3.705 0 0 1 4.208 0l2.378-2.326a1.385 1.385 0 1 1 1.948 1.972l-2.374 2.323a3.705 3.705 0 0 1 0 4.388l2.374 2.323a1.385 1.385 0 0 1-.974 2.371z" fill="white" />
			</svg>
		),
	},
	{
		name: "Polar",
		icon: (
			<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="100" height="100" rx="20" fill="#0B0E13" />
				<circle cx="50" cy="50" r="28" stroke="white" strokeWidth="6" />
				<circle cx="50" cy="50" r="14" fill="white" />
			</svg>
		),
	},
	{
		name: "Vercel AI SDK",
		icon: (
			<svg aria-hidden="true" viewBox="0 0 116 100" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M57.5 0L115 100H0L57.5 0Z" fill="currentColor" />
			</svg>
		),
	},
	{
		name: "fal.ai",
		icon: (
			<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="100" height="100" rx="16" fill="#0F0F0F" />
				<text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="white" fontFamily="monospace" fontSize="28" fontWeight="700">fal</text>
			</svg>
		),
	},
	{
		name: "Firecrawl",
		icon: (
			<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="100" height="100" rx="16" fill="#FF4500" />
				<path d="M50 20 C50 20 30 35 30 55 C30 68 38 78 50 80 C62 78 70 68 70 55 C70 35 50 20 50 20Z" fill="white" opacity="0.9" />
				<path d="M50 45 C50 45 40 53 40 62 C40 69 44 74 50 75 C56 74 60 69 60 62 C60 53 50 45 50 45Z" fill="white" />
			</svg>
		),
	},
];

export function TechStackSection() {
	const t = useTranslations("landing.techstack");

	return (
		<section
			id="tech-stack"
			aria-labelledby="techstack-heading"
			className="py-24 border-t border-border"
		>
			<div className="max-w-6xl mx-auto px-6 lg:px-12">
				<h2
					id="techstack-heading"
					className="text-sm font-medium text-muted-foreground tracking-[0.05em] uppercase mb-10 text-center"
				>
					{t("heading")}
				</h2>

				<div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
					{TECH_STACK.map(({ name, icon }) => (
						<div
							key={name}
							className="flex flex-col items-center gap-2 group"
							title={name}
						>
							<div
								className="w-10 h-10 opacity-50 grayscale transition-all duration-150 ease-out group-hover:opacity-100 group-hover:grayscale-0 dark:opacity-40"
								role="img"
								aria-label={name}
							>
								{icon}
							</div>
							<span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out whitespace-nowrap">
								{name}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

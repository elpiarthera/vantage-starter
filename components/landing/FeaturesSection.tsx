"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type FeatureItem = {
	icon: React.ReactNode;
	titleKey: string;
	descKey: string;
};

const FEATURES: FeatureItem[] = [
	{
		icon: (
			<svg
				className="h-6 w-6"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M5 3v4"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M19 17v4"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M3 5h4"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M17 19h4"
				/>
			</svg>
		),
		titleKey: "ai_renders_title",
		descKey: "ai_renders_desc",
	},
	{
		icon: (
			<svg
				className="h-6 w-6"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
		),
		titleKey: "realtime_title",
		descKey: "realtime_desc",
	},
	{
		icon: (
			<svg
				className="h-6 w-6"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<circle cx="8" cy="8" r="6" />
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M18.09 10.37A6 6 0 1 1 10.34 18"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M7 6h1v4"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="m16.71 13.88.7.71-2.82 2.82"
				/>
			</svg>
		),
		titleKey: "credits_title",
		descKey: "credits_desc",
	},
	{
		icon: (
			<svg
				className="h-6 w-6"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
				/>
			</svg>
		),
		titleKey: "media_title",
		descKey: "media_desc",
	},
	{
		icon: (
			<svg
				className="h-6 w-6"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M12 8V4H8"
				/>
				<rect width="16" height="12" x="4" y="8" rx="2" />
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M2 14h2"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M20 14h2"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M15 13v2"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M9 13v2"
				/>
			</svg>
		),
		titleKey: "agents_title",
		descKey: "agents_desc",
	},
	{
		icon: (
			<svg
				className="h-6 w-6"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
				/>
			</svg>
		),
		titleKey: "i18n_title",
		descKey: "i18n_desc",
	},
];

function useReveal({ threshold = 0.15 }: { threshold?: number } = {}) {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setIsVisible(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.unobserve(el);
				}
			},
			{ threshold },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [threshold]);

	return { ref, isVisible };
}

export function FeaturesSection() {
	const t = useTranslations("landing.features");
	const { ref: headingRef, isVisible: headingVisible } = useReveal({
		threshold: 0.2,
	});
	const { ref: gridRef, isVisible: gridVisible } = useReveal({
		threshold: 0.1,
	});

	return (
		<section
			id="features"
			aria-labelledby="features-heading"
			className="relative py-24 md:py-32"
		>
			<div className="relative mx-auto max-w-6xl px-6">
				<div
					ref={headingRef}
					className={`mb-16 text-center reveal ${headingVisible ? "revealed" : ""}`}
				>
					<p className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
						{t("eyebrow")}
					</p>
					<h2
						id="features-heading"
						className="mb-4 text-3xl font-bold tracking-[-0.02em] text-gray-900 dark:text-gray-100 md:text-4xl lg:text-5xl"
					>
						{t("heading")}
					</h2>
					<p className="mx-auto max-w-2xl text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
						{t("subheading")}
					</p>
				</div>

				<div ref={gridRef} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((feature, index) => (
						<div
							key={feature.titleKey}
							className={`group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 card-elevated transition-[border-color] hover:border-gray-300 dark:hover:border-gray-700 reveal ${gridVisible ? "revealed" : ""}`}
							style={{ transitionDelay: `${index * 0.08}s` }}
						>
							{/* Subtle gradient on hover */}
							<div
								className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50 dark:from-gray-800 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
								aria-hidden="true"
							/>

							<div className="relative">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-[400ms] group-hover:bg-gray-900 dark:group-hover:bg-gray-100 group-hover:text-white dark:group-hover:text-gray-900 group-hover:shadow-md group-hover:scale-105">
									{feature.icon}
								</div>
								<h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-transform duration-300 group-hover:translate-x-0.5">
									{t(feature.titleKey)}
								</h3>
								<p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
									{t(feature.descKey)}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

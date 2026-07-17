"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

function useRevealOnScroll(
	ref: React.RefObject<HTMLElement | null>,
	delay = 0,
) {
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			el.style.opacity = "1";
			el.style.transform = "none";
			return;
		}

		el.classList.add("reveal");
		if (delay > 0) el.style.transitionDelay = `${delay}s`;

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

export function TestimonialsSection() {
	const t = useTranslations("landing.testimonials");
	const headerRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);

	useRevealOnScroll(headerRef as React.RefObject<HTMLElement | null>);
	useRevealOnScroll(gridRef as React.RefObject<HTMLElement | null>, 0.1);

	return (
		<section aria-labelledby="testimonials-heading" className="py-24">
			<div className="max-w-6xl mx-auto px-6 lg:px-12">
				<div ref={headerRef} className="mb-12 md:mb-16 max-w-xl">
					<p className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
						{t("eyebrow")}
					</p>
					<h2
						id="testimonials-heading"
						className="font-heading font-bold text-foreground text-3xl md:text-4xl leading-[1.15] tracking-[-0.02em] mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						{t("subheading")}
					</p>
				</div>

				<div
					ref={gridRef}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
				>
					{[1, 2, 3].map((i) => (
						<TestimonialPlaceholder key={i} index={i} t={t} />
					))}
				</div>
			</div>
		</section>
	);
}

function TestimonialPlaceholder({
	index,
	t,
}: {
	index: number;
	t: ReturnType<typeof useTranslations>;
}) {
	return (
		<article
			className={cn(
				"group relative rounded-2xl border border-dashed p-6 h-full card-elevated",
				"border-primary/20",
				"bg-primary/3 dark:bg-primary/5",
				"opacity-60",
			)}
			aria-label={t("placeholder_aria", { index })}
		>
			{/* Hover gradient */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-muted/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
				aria-hidden="true"
			/>

			<div className="relative">
				{/* Quote mark */}
				{/* Decorative quote glyph — punctuation only, no words, never translated */}
				<div
					className="text-primary/40 font-serif text-4xl leading-none mb-3 select-none"
					aria-hidden="true"
				>
					&ldquo;
				</div>

				{/* Quote placeholder lines */}
				<div className="space-y-2 mb-5">
					<div
						className="h-3 w-full rounded-full bg-primary/15"
						aria-hidden="true"
					/>
					<div
						className="h-3 w-5/6 rounded-full bg-primary/10"
						aria-hidden="true"
					/>
					<div
						className="h-3 w-3/4 rounded-full bg-primary/8"
						aria-hidden="true"
					/>
				</div>

				{/* Author placeholder */}
				<div className="flex items-center gap-3 pt-4 border-t border-primary/15">
					<div
						className="size-9 rounded-full bg-primary/20 border border-primary/25 shrink-0"
						aria-hidden="true"
					/>
					<div className="space-y-1.5 flex-1">
						<div
							className="h-2.5 w-24 rounded-full bg-primary/20"
							aria-hidden="true"
						/>
						<div
							className="h-2 w-32 rounded-full bg-primary/12"
							aria-hidden="true"
						/>
					</div>
				</div>

				<p className="sr-only">{t("placeholder_sr")}</p>
			</div>
		</article>
	);
}

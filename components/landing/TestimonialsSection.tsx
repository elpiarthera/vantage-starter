"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function TestimonialsSection() {
	const t = useTranslations("landing.testimonials");
	const reduced = useReducedMotion();

	const cardVariants = {
		hidden: { opacity: 1, y: reduced ? 0 : 20 },
		visible: { opacity: 1, y: 0 },
	};

	return (
		<section
			aria-labelledby="testimonials-heading"
			className="py-28 md:py-40"
		>
			<div className="max-w-5xl mx-auto px-4 sm:px-6">
				<motion.div
					className="mb-12 md:mb-16 max-w-xl"
					initial={{ opacity: 1, y: 0 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px", amount: 0.01 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					{/* Section label */}
					<p className="text-xs font-semibold text-primary tracking-[0.2em] uppercase font-mono mb-3">
						Testimonials
					</p>
					<h2
						id="testimonials-heading"
						className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-foreground mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						{t("subheading")}
					</p>
				</motion.div>

				{/* Section container animates in, not individual cards */}
				<motion.div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
					initial={cardVariants.hidden}
					whileInView={cardVariants.visible}
					viewport={{ once: true, margin: "-40px", amount: 0.01 }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				>
					{[1, 2, 3].map((i) => (
						<TestimonialPlaceholder key={i} index={i} t={t} />
					))}
				</motion.div>
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
				"rounded-lg border border-dashed p-6 h-full",
				// Dashed primary tint border — designed placeholder, not a blank box
				"border-primary/20",
				"bg-primary/3 dark:bg-primary/5",
				// 60% opacity: signals "coming soon" without looking broken
				"opacity-60",
			)}
			aria-label={t("placeholder_aria", { index })}
		>
			{/*
        REPLACE THIS TESTIMONIAL
        Recommended: 2 lines max. Focus on a specific outcome, not general praise.
        Format: "[Outcome achieved] — [Name], [Role] at [Company]"
        Example: "Cut our onboarding from 3 days to 4 hours. — Sarah, CTO at Acme"
      */}

			{/* Quote mark — primary accent */}
			<div
				className="text-primary/40 font-serif text-4xl leading-none mb-3 select-none"
				aria-hidden="true"
			>
				&ldquo;
			</div>

			{/* Quote placeholder lines */}
			<div className="space-y-2 mb-5">
				<div className="h-3 w-full rounded-full bg-primary/15" aria-hidden="true" />
				<div className="h-3 w-5/6 rounded-full bg-primary/10" aria-hidden="true" />
				<div className="h-3 w-3/4 rounded-full bg-primary/8" aria-hidden="true" />
			</div>

			{/* Author placeholder */}
			<div className="flex items-center gap-3 pt-4 border-t border-primary/15">
				{/* Avatar circle */}
				<div
					className="size-9 rounded-full bg-primary/20 border border-primary/25 shrink-0"
					aria-hidden="true"
				/>
				<div className="space-y-1.5 flex-1">
					<div className="h-2.5 w-24 rounded-full bg-primary/20" aria-hidden="true" />
					<div className="h-2 w-32 rounded-full bg-primary/12" aria-hidden="true" />
				</div>
			</div>

			<p className="sr-only">{t("placeholder_sr")}</p>
		</article>
	);
}

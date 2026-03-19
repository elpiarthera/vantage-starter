import { useTranslations } from "next-intl";

export function TestimonialsSection() {
	const t = useTranslations("landing.testimonials");

	return (
		<section
			aria-labelledby="testimonials-heading"
			className="py-20 md:py-32"
		>
			<div className="max-w-5xl mx-auto px-6">
				<h2
					id="testimonials-heading"
					className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-foreground mb-4"
				>
					{t("heading")}
				</h2>
				<p className="text-muted-foreground text-lg max-w-xl mb-12 md:mb-16">
					{t("subheading")}
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
			className="rounded-xl border border-dashed border-border opacity-60 p-6"
			aria-label={t("placeholder_aria", { index })}
		>
			{/*
        REPLACE THIS TESTIMONIAL
        Recommended: 2 lines max. Focus on a specific outcome, not general praise.
        Format: "[Outcome achieved] — [Name], [Role] at [Company]"
        Example: "Cut our onboarding from 3 days to 4 hours. — Sarah, CTO at Acme"
      */}

			{/* Avatar placeholder */}
			<div className="flex items-center gap-3 mb-4">
				<div
					className="size-10 rounded-full bg-muted"
					aria-hidden="true"
				/>
				<div className="space-y-1.5">
					<div className="h-3 w-24 rounded bg-muted" aria-hidden="true" />
					<div className="h-2.5 w-32 rounded bg-muted" aria-hidden="true" />
				</div>
			</div>

			{/* Quote placeholder lines */}
			<div className="space-y-2">
				<div className="h-3 w-full rounded bg-muted border-b border-dashed border-border" aria-hidden="true" />
				<div className="h-3 w-5/6 rounded bg-muted border-b border-dashed border-border" aria-hidden="true" />
				<div className="h-3 w-3/4 rounded bg-muted" aria-hidden="true" />
			</div>

			<p className="sr-only">{t("placeholder_sr")}</p>
		</article>
	);
}

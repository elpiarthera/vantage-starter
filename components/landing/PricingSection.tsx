"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tier = {
	nameKey: string;
	price: string;
	earlyBirdPrice?: string;
	descKey: string;
	ctaKey: string;
	ctaHref: string;
	featuresKey: string[];
	highlighted?: boolean;
};

const TIERS: Tier[] = [
	{
		nameKey: "starter_name",
		price: "$0",
		descKey: "starter_desc",
		ctaKey: "starter_cta",
		ctaHref: "/sign-up",
		featuresKey: [
			"starter_f1",
			"starter_f2",
			"starter_f3",
			"starter_f4",
		],
	},
	{
		nameKey: "pro_name",
		price: "$499",
		earlyBirdPrice: "$399",
		descKey: "pro_desc",
		ctaKey: "pro_cta",
		ctaHref: "https://polar.sh/checkout/[POLAR_PRO_PRODUCT_ID]",
		featuresKey: [
			"pro_f1",
			"pro_f2",
			"pro_f3",
			"pro_f4",
			"pro_f5",
		],
		highlighted: true,
	},
	{
		nameKey: "team_name",
		price: "$899",
		descKey: "team_desc",
		ctaKey: "team_cta",
		ctaHref: "https://polar.sh/checkout/[POLAR_TEAM_PRODUCT_ID]",
		featuresKey: [
			"team_f1",
			"team_f2",
			"team_f3",
			"team_f4",
			"team_f5",
			"team_f6",
		],
	},
];

export function PricingSection() {
	const t = useTranslations("landing.pricing");
	const reduced = useReducedMotion();

	return (
		<section
			id="pricing"
			aria-labelledby="pricing-heading"
			className="py-20 md:py-32"
		>
			<div className="max-w-5xl mx-auto px-4 sm:px-6">
				{/* Header */}
				<motion.div
					className="mb-12 md:mb-16 max-w-xl"
					initial={{ opacity: 0, y: reduced ? 0 : 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.15 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					{/* Eyebrow */}
					<p className="text-xs font-medium tracking-[0.05em] uppercase text-[var(--accent-warm)] mb-3">
						{t("eyebrow")}
					</p>
					<h2
						id="pricing-heading"
						className="font-heading font-bold text-foreground mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						{t("subheading")}
					</p>
				</motion.div>

				{/* Tiers grid */}
				<motion.div
					className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start"
					initial={{ opacity: 0, y: reduced ? 0 : 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.15 }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				>
					{TIERS.map((tier) => (
						<PricingCard key={tier.nameKey} tier={tier} t={t} />
					))}
				</motion.div>

				<p className="mt-8 text-xs text-muted-foreground text-center">
					{t("one_time_note")}
				</p>
			</div>
		</section>
	);
}

function PricingCard({
	tier,
	t,
}: {
	tier: Tier;
	t: ReturnType<typeof useTranslations>;
}) {
	const isHighlighted = tier.highlighted;

	return (
		<article
			className={cn(
				"rounded-none p-8 flex flex-col relative h-full",
				"bg-card",
				isHighlighted
					? "border border-primary"
					: "border border-border",
			)}
		>
			{/* Most popular badge — only on highlighted card */}
			{isHighlighted && (
				<span className="inline-flex items-center rounded-full bg-[var(--accent-warm)] text-black px-3 py-1 text-xs font-medium mb-3 self-start">
					{t("popular_badge")}
				</span>
			)}

			{/* Tier name */}
			<h3 className="font-heading text-base font-semibold text-foreground">
				{t(tier.nameKey)}
			</h3>

			{/* Description */}
			<p className="text-sm mt-1 mb-5 leading-relaxed text-muted-foreground">
				{t(tier.descKey)}
			</p>

			{/* Price */}
			<div className="mb-2 flex items-baseline gap-2">
				<span className="font-heading text-5xl font-bold tracking-[-0.03em] text-foreground">
					{tier.price}
				</span>
				{tier.price !== "$0" && (
					<span className="text-sm font-normal text-muted-foreground">
						{t("one_time_label")}
					</span>
				)}
			</div>

			{/* Early bird note */}
			{tier.earlyBirdPrice && (
				<p className="text-xs font-medium mb-5 text-primary">
					{t("early_bird_note", { price: tier.earlyBirdPrice })}
				</p>
			)}

			{/* Divider */}
			<div className="h-px mb-5 bg-border" />

			{/* Features list */}
			<ul
				className="space-y-3 mb-8 flex-1"
				aria-label={`${t(tier.nameKey)} ${t("features_aria")}`}
			>
				{tier.featuresKey.map((fk) => (
					<li
						key={fk}
						className="flex items-start gap-2.5 text-base text-foreground"
					>
						<Check
							className={cn(
								"size-4 shrink-0 mt-0.5",
								isHighlighted ? "text-primary" : "text-muted-foreground",
							)}
							aria-hidden="true"
						/>
						{t(fk)}
					</li>
				))}
			</ul>

			{/* CTA */}
			<a href={tier.ctaHref} className="block">
				<Button
					className={cn(
						"w-full h-12 rounded-full font-medium transition-opacity duration-100 hover:opacity-90",
						isHighlighted
							? "bg-primary text-primary-foreground border-0"
							: "bg-transparent border border-border text-foreground hover:bg-transparent",
					)}
				>
					{t(tier.ctaKey)}
				</Button>
			</a>
		</article>
	);
}

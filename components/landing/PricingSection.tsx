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
	calloutKey?: string;
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
		calloutKey: "pro_callout",
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

	const cardVariants = {
		hidden: { opacity: 0, y: reduced ? 0 : 20 },
		visible: { opacity: 1, y: 0 },
	};

	return (
		<section
			id="pricing"
			aria-labelledby="pricing-heading"
			className="py-28 md:py-40"
		>
			<div className="max-w-5xl mx-auto px-4 sm:px-6">
				{/* Header */}
				<motion.div
					className="mb-12 md:mb-16 max-w-xl"
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px", amount: 0.01 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					{/* Section label */}
					<p className="text-xs font-semibold text-primary tracking-[0.2em] uppercase font-mono mb-3">
						Pricing
					</p>
					<h2
						id="pricing-heading"
						className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-foreground mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						{t("subheading")}
					</p>
				</motion.div>

				{/* Tiers grid — section container animates in */}
				<motion.div
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:items-start"
					initial={cardVariants.hidden}
					whileInView={cardVariants.visible}
					viewport={{ once: true, margin: "-40px", amount: 0.01 }}
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
				"rounded-lg p-6 md:p-8 flex flex-col relative h-full",
				isHighlighted
					? [
							"border-2 border-primary",
							"bg-card",
							"shadow-lg shadow-primary/20",
							"scale-[1.02]",
							"ring-2 ring-primary/30",
					  ].join(" ")
					: [
							"border border-border",
							"bg-card",
					  ].join(" "),
			)}
		>
			{/* Most popular badge — only on highlighted card */}
			{isHighlighted && (
				<span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-medium mb-3 self-start">
					Most popular
				</span>
			)}

			{/* Tier name */}
			<h3
				className={cn(
					"text-base font-semibold tracking-[-0.02em]",
					isHighlighted ? "text-primary" : "text-foreground",
				)}
			>
				{t(tier.nameKey)}
			</h3>

			{/* Description */}
			<p
				className={cn(
					"text-sm mt-1 mb-5 leading-relaxed",
					"text-muted-foreground",
				)}
			>
				{t(tier.descKey)}
			</p>

			{/* Price */}
			<div className="mb-2 flex items-baseline gap-2">
				<span
					className={cn(
						"text-4xl font-semibold tracking-[-0.03em]",
						"text-foreground",
					)}
				>
					{tier.price}
				</span>
				{tier.price !== "$0" && (
					<span
						className={cn(
							"text-sm",
							"text-muted-foreground",
						)}
					>
						{t("one_time_label")}
					</span>
				)}
			</div>

			{/* Early bird note */}
			{tier.earlyBirdPrice && (
				<p
					className={cn(
						"text-xs font-medium mb-5",
						"text-primary",
					)}
				>
					{t("early_bird_note", { price: tier.earlyBirdPrice })}
				</p>
			)}

			{/* Pro callout — "The AI layer." */}
			{tier.calloutKey && (
				<p
					className={cn(
						"text-xs mb-5 italic leading-relaxed",
						"border-l-2 border-primary/50 pl-3 text-muted-foreground",
					)}
				>
					{t(tier.calloutKey)}
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
						className="flex items-start gap-2.5 text-sm text-foreground"
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

			{/* CTA — filled on highlighted card, outline on others */}
			<a href={tier.ctaHref} className="block">
				<Button
					variant={isHighlighted ? "default" : "outline"}
					className={cn(
						"w-full font-medium",
						isHighlighted
							? "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
							: "border-border hover:bg-accent hover:text-accent-foreground",
					)}
				>
					{t(tier.ctaKey)}
				</Button>
			</a>
		</article>
	);
}

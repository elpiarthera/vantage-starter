import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Tier = {
	nameKey: string;
	price: string;
	descKey: string;
	ctaKey: string;
	ctaHref: string;
	featuresKey: string[];
	highlighted?: boolean;
	badgeKey?: string;
};

const TIERS: Tier[] = [
	{
		nameKey: "starter_name",
		price: "$0",
		descKey: "starter_desc",
		ctaKey: "starter_cta",
		ctaHref: "https://github.com/vantage-starter/vantage-starter",
		featuresKey: [
			"starter_f1",
			"starter_f2",
			"starter_f3",
			"starter_f4",
			"starter_f5",
			"starter_f6",
			"starter_f7",
		],
	},
	{
		nameKey: "pro_name",
		price: "$99",
		descKey: "pro_desc",
		ctaKey: "pro_cta",
		ctaHref: "https://polar.sh/checkout/vantage-starter-pro",
		featuresKey: [
			"pro_f1",
			"pro_f2",
			"pro_f3",
			"pro_f4",
			"pro_f5",
			"pro_f6",
			"pro_f7",
			"pro_f8",
			"pro_f9",
			"pro_f10",
		],
		highlighted: true,
		badgeKey: "pro_badge",
	},
];

export function PricingSection() {
	const t = useTranslations("landing.pricing");

	return (
		<section id="pricing" aria-labelledby="pricing-heading" className="py-24">
			<div className="max-w-6xl mx-auto px-6 lg:px-12">
				{/* Header */}
				<div className="mb-12 max-w-xl">
					<p className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
						{t("eyebrow")}
					</p>
					<h2
						id="pricing-heading"
						className="font-heading font-bold text-foreground text-3xl md:text-4xl leading-[1.15] tracking-[-0.03em] mb-4"
					>
						{t("heading")}
					</h2>
				</div>

				{/* 2-column grid, max-w-3xl centered */}
				<div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
					{TIERS.map((tier) => (
						<PricingCard key={tier.nameKey} tier={tier} t={t} />
					))}
				</div>

				<p className="mt-8 text-sm text-muted-foreground max-w-3xl">
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
					? "border border-primary card-elevated"
					: "border border-border",
			)}
		>
			{/* Badge — only on Pro */}
			{isHighlighted && tier.badgeKey && (
				<span className="inline-flex items-center rounded-full bg-foreground text-background px-3 py-1 text-xs font-medium mb-4 self-start">
					{t(tier.badgeKey)}
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

			{/* Divider */}
			<div className="h-px my-5 bg-border" />

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
						{/* Check icon — inline SVG */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className={cn(
								"size-4 shrink-0 mt-0.5",
								isHighlighted ? "text-primary" : "text-muted-foreground",
							)}
							aria-hidden="true"
						>
							<path d="M20 6 9 17l-5-5" />
						</svg>
						{t(fk)}
					</li>
				))}
			</ul>

			{/* CTA */}
			<a href={tier.ctaHref} className="no-underline">
				<ui-button
					variant={isHighlighted ? "primary" : "outline"}
					size="lg"
					class="w-full"
				>
					{t(tier.ctaKey)}
				</ui-button>
			</a>
		</article>
	);
}

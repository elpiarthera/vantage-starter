import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tier = {
	nameKey: string;
	price: string;
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

	return (
		<section
			id="pricing"
			aria-labelledby="pricing-heading"
			className="py-20 md:py-32 bg-muted/30"
		>
			<div className="max-w-5xl mx-auto px-6">
				{/* Header */}
				<div className="mb-12 md:mb-16">
					<h2
						id="pricing-heading"
						className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-foreground mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg max-w-xl">
						{t("subheading")}
					</p>
				</div>

				{/* Tiers grid — mobile: 1 col, tablet: 2 col, desktop: 3 col */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{TIERS.map((tier) => (
						<PricingCard key={tier.nameKey} tier={tier} t={t} />
					))}
				</div>

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
	return (
		<article
			className={cn(
				"rounded-xl border p-6 flex flex-col",
				tier.highlighted
					? "border-primary bg-primary/5 shadow-sm"
					: "border-border bg-background",
			)}
		>
			{tier.highlighted && (
				<span className="inline-flex self-start mb-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
					{t("popular_badge")}
				</span>
			)}

			<h3 className="text-lg font-semibold text-foreground">{t(tier.nameKey)}</h3>
			<p className="text-sm text-muted-foreground mt-1 mb-4">{t(tier.descKey)}</p>

			<div className="mb-6">
				<span className="text-4xl font-semibold tracking-[-0.03em] text-foreground">
					{tier.price}
				</span>
				{tier.price !== "$0" && (
					<span className="ml-1.5 text-sm text-muted-foreground">
						{t("one_time_label")}
					</span>
				)}
			</div>

			<ul className="space-y-3 mb-8 flex-1" aria-label={`${t(tier.nameKey)} ${t("features_aria")}`}>
				{tier.featuresKey.map((fk) => (
					<li key={fk} className="flex items-start gap-2.5 text-sm text-foreground">
						<Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
						{t(fk)}
					</li>
				))}
			</ul>

			<a href={tier.ctaHref} className="block">
				<Button
					variant={tier.highlighted ? "default" : "outline"}
					className="w-full"
				>
					{t(tier.ctaKey)}
				</Button>
			</a>
		</article>
	);
}

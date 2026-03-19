import type React from "react";
import {
	Bot,
	Brain,
	Coins,
	Globe,
	Layers,
	ShieldCheck,
	Sparkles,
	Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type FeatureItem = {
	icon: React.ReactNode;
	titleKey: string;
	descKey: string;
	accent?: boolean;
};

const FEATURES: FeatureItem[] = [
	// 1 — primary differentiator
	{
		icon: <Sparkles className="size-4" aria-hidden="true" />,
		titleKey: "generative_ui_title",
		descKey: "generative_ui_desc",
		accent: true,
	},
	// 3 pillars
	{
		icon: <Coins className="size-4" aria-hidden="true" />,
		titleKey: "credits_title",
		descKey: "credits_desc",
	},
	{
		icon: <Zap className="size-4" aria-hidden="true" />,
		titleKey: "realtime_title",
		descKey: "realtime_desc",
	},
	{
		icon: <Bot className="size-4" aria-hidden="true" />,
		titleKey: "agents_title",
		descKey: "agents_desc",
	},
	// 4 proof points
	{
		icon: <Brain className="size-4" aria-hidden="true" />,
		titleKey: "rag_title",
		descKey: "rag_desc",
	},
	{
		icon: <ShieldCheck className="size-4" aria-hidden="true" />,
		titleKey: "accessibility_title",
		descKey: "accessibility_desc",
	},
	{
		icon: <Layers className="size-4" aria-hidden="true" />,
		titleKey: "stack_title",
		descKey: "stack_desc",
	},
	{
		icon: <Globe className="size-4" aria-hidden="true" />,
		titleKey: "no_sql_title",
		descKey: "no_sql_desc",
	},
];

export function FeaturesSection() {
	const t = useTranslations("landing.features");

	return (
		<section
			id="features"
			aria-labelledby="features-heading"
			className="py-20 md:py-32"
		>
			<div className="max-w-5xl mx-auto px-6">
				{/* Section header */}
				<div className="mb-12 md:mb-16">
					<h2
						id="features-heading"
						className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-foreground mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg max-w-xl">
						{t("subheading")}
					</p>
				</div>

				{/* 1+3+4 grid */}
				<div className="grid grid-cols-1 gap-8 md:gap-12">
					{/* Row 1: primary differentiator — full width */}
					<div className="grid grid-cols-1 md:grid-cols-1">
						<FeatureCard feature={FEATURES[0]} t={t} fullWidth />
					</div>

					{/* Row 2: 3 pillars */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12">
						{FEATURES.slice(1, 4).map((f) => (
							<FeatureCard key={f.titleKey} feature={f} t={t} />
						))}
					</div>

					{/* Row 3: 4 proof points */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
						{FEATURES.slice(4).map((f) => (
							<FeatureCard key={f.titleKey} feature={f} t={t} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function FeatureCard({
	feature,
	t,
	fullWidth,
}: {
	feature: FeatureItem;
	t: ReturnType<typeof useTranslations>;
	fullWidth?: boolean;
}) {
	return (
		<article
			className={cn(
				"rounded-xl border border-border p-6",
				feature.accent && "border-primary/30 bg-primary/5",
				fullWidth && "md:flex md:items-start md:gap-8",
			)}
		>
			<div
				className={cn(
					"flex items-center gap-2 text-primary mb-3",
					fullWidth && "md:mb-0 md:shrink-0 md:mt-1",
				)}
			>
				{feature.icon}
			</div>
			<div>
				<h3 className="text-base font-semibold text-foreground mb-1.5">
					{t(feature.titleKey)}
				</h3>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{t(feature.descKey)}
				</p>
			</div>
		</article>
	);
}

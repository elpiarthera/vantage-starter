import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { FAQSection } from "@/components/landing/FAQSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingSection } from "@/components/landing/PricingSection";
import { TechStackSection } from "@/components/landing/TechStackSection";

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "landing.meta" });

	return {
		title: t("title"),
		description: t("description"),
		alternates: {
			canonical: "/",
			languages: {
				en: "/",
				fr: "/fr",
				de: "/de",
				it: "/it",
				es: "/es",
				pt: "/pt",
				ru: "/ru",
			},
		},
		openGraph: {
			title: t("og_title"),
			description: t("og_description"),
			url: "/",
			type: "website",
			images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t("og_image_alt") }],
		},
		twitter: {
			card: "summary_large_image",
			title: t("og_title"),
			description: t("og_description"),
			images: ["/og-image.png"],
		},
	};
}

export default async function LandingPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<div className="min-h-screen bg-background">
			<LandingNav />
			<main id="main-content">
				<HeroSection />
				<FeaturesSection />
				<TechStackSection />
				<PricingSection />
				<FAQSection />
			</main>
			<LandingFooter />
		</div>
	);
}

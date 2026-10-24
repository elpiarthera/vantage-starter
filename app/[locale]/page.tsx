import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CTASection } from "@/components/landing/CTASection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingSection } from "@/components/landing/PricingSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { TechStackSection } from "@/components/landing/TechStackSection";
import { WebComponentsLoader } from "@/components/landing/WebComponentsLoader";

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
			images: [
				{
					url: "/og-image.png",
					width: 1200,
					height: 630,
					alt: t("og_image_alt"),
				},
			],
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
		<div className="min-h-screen bg-white dark:bg-gray-950">
			<WebComponentsLoader />
			<LandingNav />
			<main id="main-content">
				<HeroSection />
				<SocialProofSection />
				<FeaturesSection />
				<TechStackSection />
				<PricingSection />
				<FAQSection />
				<CTASection />
			</main>
			<LandingFooter />
		</div>
	);
}

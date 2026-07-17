import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccessibilityPlan } from "@/components/shared/AccessibilityPlan";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({
		locale,
		namespace: "legal.accessibility_plan",
	});

	return {
		title: t("title"),
		description: `${t("title")} — RGAA 4.1.2.`,
		alternates: {
			canonical: `${BASE_URL}/fr/schema-accessibilite`,
			languages: {
				fr: `${BASE_URL}/fr/schema-accessibilite`,
				en: `${BASE_URL}/en/accessibility-plan`,
			},
		},
		robots: { index: true, follow: true },
	};
}

export default async function SchemaAccessibilitePage({ params }: Props) {
	const { locale } = await params;
	return await AccessibilityPlan({ locale });
}

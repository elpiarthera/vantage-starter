import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccessibilityDeclaration } from "@/components/shared/AccessibilityDeclaration";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({
		locale,
		namespace: "legal.accessibility_declaration",
	});

	return {
		title: t("title"),
		description: `${t("title")} — RGAA 4.1.2.`,
		alternates: {
			canonical: `${BASE_URL}/en/accessibility`,
			languages: {
				en: `${BASE_URL}/en/accessibility`,
				fr: `${BASE_URL}/fr/accessibilite`,
			},
		},
		robots: { index: true, follow: true },
	};
}

export default async function AccessibilityDeclarationPage({ params }: Props) {
	const { locale } = await params;
	return await AccessibilityDeclaration({ locale });
}

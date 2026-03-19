import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	title: {
		default: "VantageStarter",
		template: "%s | VantageStarter",
	},
	description:
		"The AI SaaS starter kit that ships with Convex, Clerk, Polar billing, credits system, i18n, and accessibility built-in.",
	alternates: {
		canonical: BASE_URL,
		languages: {
			en: BASE_URL,
			fr: `${BASE_URL}/fr`,
		},
	},
	openGraph: {
		type: "website",
		siteName: "VantageStarter",
		url: BASE_URL,
		images: [
			{
				url: `${BASE_URL}/opengraph-image.png`,
				width: 1200,
				height: 630,
				alt: "VantageStarter — AI SaaS Starter Kit",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		images: [`${BASE_URL}/opengraph-image.png`],
	},
	robots: { index: true, follow: true },
};

// SoftwareApplication JSON-LD
const softwareApplicationSchema = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	"@id": `${BASE_URL}/#software`,
	name: "VantageStarter",
	url: BASE_URL,
	applicationCategory: "DeveloperApplication",
	operatingSystem: "Web",
	description:
		"AI SaaS starter kit with Convex backend, Clerk auth, Polar billing, credit system, multi-language support, and RGAA accessibility.",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: server-only static JSON-LD, no user input
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(softwareApplicationSchema),
				}}
			/>
			{children}
		</>
	);
}

// Required for next-intl to work with non-locale routes
export function generateStaticParams() {
	return [];
}

import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type React from "react";
import { UserSyncProvider } from "@/components/UserSyncProvider";
import { routing } from "@/i18n/routing";
import { ClientProviders } from "../ClientProviders";

type Props = {
	children: React.ReactNode;
	params: { locale: string };
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params: { locale },
}: Props) {
	// Validate locale
	if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
		notFound();
	}

	// Enable static rendering
	setRequestLocale(locale);

	// Load messages for the current locale
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
		>
			<body>
				<NextIntlClientProvider messages={messages}>
					<ClientProviders>
						<UserSyncProvider>{children}</UserSyncProvider>
					</ClientProviders>
				</NextIntlClientProvider>
				<Analytics />
			</body>
		</html>
	);
}

import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { Instrument_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type React from "react";
import { RouteAnnouncer } from "@/components/shared/RouteAnnouncer";
import { SkipLink } from "@/components/shared/SkipLink";
import { ThemeProvider } from "@/components/theme-provider";
import { UserSyncProvider } from "@/components/UserSyncProvider";
import { routing } from "@/i18n/routing";
import { ClientProviders } from "../ClientProviders";

// Instrument Sans — humanist editorial, display + body
const instrumentSans = Instrument_Sans({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;

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
			className={`${instrumentSans.variable} ${GeistMono.variable} antialiased`}
			suppressHydrationWarning
		>
			<body>
				<SkipLink />
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<RouteAnnouncer />
					<NextIntlClientProvider messages={messages}>
						<ClientProviders>
							<UserSyncProvider>{children}</UserSyncProvider>
						</ClientProviders>
					</NextIntlClientProvider>
				</ThemeProvider>
				<Analytics />
			</body>
		</html>
	);
}

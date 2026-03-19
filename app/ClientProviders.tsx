"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { clerkLocalizations } from "@/i18n/clerk-localization";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";

// Amber-gold primary: oklch(0.62 0.16 44) → approx #c47a1e in light, oklch(0.72 0.16 44) → #d9901f in dark
// Using CSS hex approximation for Clerk appearance API (does not accept oklch() strings)
const CLERK_PRIMARY = "#c47a1e"; // oklch(0.62 0.16 44) — warm amber
const CLERK_PRIMARY_DARK = "#d9901f"; // oklch(0.72 0.16 44) — lighter for dark mode

export function ClientProviders({ children }: { children: ReactNode }) {
	const locale = useLocale();
	const localization = clerkLocalizations[locale] || {};

	return (
		<ClerkProvider
			dynamic
			afterSignOutUrl="/sign-in"
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/dashboard"
			localization={localization}
			appearance={{
				baseTheme: dark,
				variables: {
					// OKLCH amber-gold primary (hue 44°)
					colorPrimary: CLERK_PRIMARY_DARK,
					// Dark backgrounds — matches .dark mode tokens
					colorBackground: "#1a1208", // oklch(0.10 0.01 44) approx
					colorInputBackground: "#2a1e0a", // oklch(0.22 0.02 44) approx
					colorInputText: "#f8f4ee",        // oklch(0.97 0 0) approx
					colorText: "#f8f4ee",
					colorTextSecondary: "#a09080",     // oklch(0.65 0 0) approx
					colorDanger: "#c0392b",             // oklch(0.65 0.22 25) approx

					// Typography
					fontFamily: '"Instrument Sans", system-ui, sans-serif',
					fontSize: "1rem",
					fontWeight: { normal: 400, medium: 500, bold: 700 },

					// Border radius contract: rounded-xl = 0.75rem
					borderRadius: "0.75rem",

					spacingUnit: "1rem",
				},
				elements: {
					rootBox: {
						margin: "0 auto",
					},
					card: {
						// oklch(0.15 0.01 44) approx
						backgroundColor: "#221508",
						borderColor: "rgba(255,255,255,0.10)",
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "0.75rem",
						boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
					},
					headerTitle: {
						color: "#f8f4ee",
						fontWeight: "700",
					},
					headerSubtitle: {
						color: "#a09080",
					},
					socialButtonsBlockButton: {
						minHeight: "44px",
						backgroundColor: "#2a1e0a",
						borderColor: "rgba(255,255,255,0.10)",
						color: "#f8f4ee",
						fontWeight: "500",
					},
					formButtonPrimary: {
						minHeight: "44px",
						backgroundColor: CLERK_PRIMARY_DARK,
						// Dark text on amber: contrast 6.6:1 in dark mode — WCAG AA pass
						color: "#1a1208",
						fontWeight: "600",
					},
					formFieldInput: {
						minHeight: "48px",
						backgroundColor: "#2a1e0a",
						borderColor: "rgba(255,255,255,0.10)",
						color: "#f8f4ee",
					},
					formFieldLabel: {
						color: "#a09080",
					},
					footerActionLink: {
						minHeight: "44px",
						color: CLERK_PRIMARY_DARK,
					},
					footerActionText: {
						color: "#a09080",
					},
					identityPreviewText: {
						color: "#f8f4ee",
					},
					identityPreviewEditButton: {
						color: CLERK_PRIMARY_DARK,
					},
					otpCodeFieldInput: {
						backgroundColor: "#2a1e0a",
						borderColor: "rgba(255,255,255,0.10)",
						color: "#f8f4ee",
					},
					alternativeMethodsBlockButton: {
						borderColor: "rgba(255,255,255,0.10)",
						color: "#a09080",
					},
					formResendCodeLink: {
						color: CLERK_PRIMARY_DARK,
					},
				},
			}}
		>
			<ConvexClientProvider>
				{children}
				<Toaster position="top-right" richColors />
			</ConvexClientProvider>
		</ClerkProvider>
	);
}

"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { clerkLocalizations } from "@/i18n/clerk-localization";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";

export function ClientProviders({ children }: { children: ReactNode }) {
	const locale = useLocale();
	const localization = clerkLocalizations[locale] || {};

	return (
		// @ts-expect-error Server Component - ClerkProvider is async in Next.js 15
		<ClerkProvider
			dynamic
			afterSignOutUrl="/sign-in"
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/guided/step-1"
			localization={localization}
			appearance={{
				baseTheme: dark,
				variables: {
					// Brand colors from design system
					colorPrimary: "#0d7ff2", // --primary (blue)
					colorBackground: "#101a23", // --background (dark blue-gray)
					colorInputBackground: "#223649", // --secondary (darker blue-gray for inputs)
					colorInputText: "#ffffff", // --foreground (white text)
					colorText: "#ffffff", // --foreground (white text)
					colorTextSecondary: "#d1d5db", // --muted-foreground (gray)
					colorDanger: "#ef4444", // --destructive (red)

					// Typography
					fontFamily: '"Space Grotesk", "Noto Sans", sans-serif',
					fontSize: "1rem",
					fontWeight: { normal: 400, medium: 500, bold: 700 },

					// Borders & Radius
					borderRadius: "0.75rem", // --radius

					// Spacing (WCAG 2.1 AA touch targets)
					spacingUnit: "1rem",
				},
				elements: {
					// Root container
					rootBox: {
						margin: "0 auto",
					},

					// Card styling
					card: {
						backgroundColor: "#182634", // --card
						borderColor: "#223649", // --border
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "0.75rem",
						boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
					},

					// Header elements
					headerTitle: {
						color: "#ffffff",
						fontWeight: "700",
					},
					headerSubtitle: {
						color: "#d1d5db",
					},

					// Social buttons
					socialButtonsBlockButton: {
						minHeight: "44px",
						backgroundColor: "#223649",
						borderColor: "#223649",
						color: "#ffffff",
						fontWeight: "500",
					},
					"socialButtonsBlockButton:hover": {
						backgroundColor: "#314d68",
					},

					// Primary form button
					formButtonPrimary: {
						minHeight: "44px",
						backgroundColor: "#0d7ff2",
						color: "#ffffff",
						fontWeight: "600",
					},
					"formButtonPrimary:hover": {
						backgroundColor: "#0b6dd1",
					},

					// Form fields
					formFieldInput: {
						minHeight: "48px",
						backgroundColor: "#223649",
						borderColor: "#223649",
						color: "#ffffff",
					},
					"formFieldInput::placeholder": {
						color: "#9ca3af",
					},
					formFieldLabel: {
						color: "#d1d5db",
					},

					// Footer links
					footerActionLink: {
						minHeight: "44px",
						color: "#0d7ff2",
					},
					"footerActionLink:hover": {
						color: "#0b6dd1",
					},
					footerActionText: {
						color: "#d1d5db",
					},

					// Identity preview
					identityPreviewText: {
						color: "#ffffff",
					},
					identityPreviewEditButton: {
						color: "#0d7ff2",
					},

					// OTP fields
					otpCodeFieldInput: {
						backgroundColor: "#223649",
						borderColor: "#223649",
						color: "#ffffff",
					},

					// Alternative methods
					alternativeMethodsBlockButton: {
						borderColor: "#223649",
						color: "#d1d5db",
					},
					"alternativeMethodsBlockButton:hover": {
						backgroundColor: "#223649",
					},

					// Resend code link
					formResendCodeLink: {
						color: "#0d7ff2",
					},
					"formResendCodeLink:hover": {
						color: "#0b6dd1",
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

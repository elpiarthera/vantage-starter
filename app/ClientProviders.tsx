"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { clerkLocalizations } from "@/i18n/clerk-localization";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";

// Dark electric blue palette — matches dark-electric-blue.css .dark tokens
// Clerk appearance API does not accept oklch() — using verified hex approximations.
// oklch(0.55 0.15 250) → #3366cc (primary blue)
// oklch(0.08 0.01 240) → #101218 (deep background)
// oklch(0.12 0.01 240) → #1a1c2e (card/modal/popover surface)
// oklch(0.16 0.015 240) → #22243a (input background — slightly lighter than card)
// oklch(0.22 0.02 240) → #2e3148 (border)
// oklch(0.93 0.01 240) → #e8e9f0 (primary text)
// oklch(0.65 0.01 240) → #9a9baa (secondary text / muted)

const CLERK_PRIMARY = "#3366cc"; // oklch(0.55 0.15 250)
const CLERK_BG = "#101218"; // oklch(0.08 0.01 240)
const CLERK_CARD = "#1a1c2e"; // oklch(0.12 0.01 240) — modal/card/popover bg
const CLERK_INPUT_BG = "#22243a"; // oklch(0.16 0.015 240) — slightly lighter than card
const CLERK_BORDER = "#2e3148"; // oklch(0.22 0.02 240)
const CLERK_TEXT = "#e8e9f0"; // oklch(0.93 0.01 240)
const CLERK_TEXT_MUTED = "#9a9baa"; // oklch(0.65 0.01 240)
const CLERK_DANGER = "#c0392b"; // oklch(0.65 0.22 25)

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
					colorPrimary: CLERK_PRIMARY,
					colorBackground: CLERK_BG,
					colorInputBackground: CLERK_INPUT_BG,
					colorInputText: CLERK_TEXT,
					colorText: CLERK_TEXT,
					colorTextSecondary: CLERK_TEXT_MUTED,
					colorDanger: CLERK_DANGER,

					// Space Grotesk — inherits from page CSS via "inherit"
					fontFamily: '"Space Grotesk", system-ui, sans-serif',
					fontSize: "0.9375rem",
					fontWeight: { normal: 400, medium: 500, bold: 700 },

					// Sharp corners everywhere — editorial design system
					borderRadius: "0px",

					spacingUnit: "1rem",
				},
				elements: {
					// --- Global containers ---
					rootBox: {
						margin: "0",
					},
					card: {
						backgroundColor: CLERK_CARD,
						borderColor: CLERK_BORDER,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "0px",
						boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
					},

					// --- OrganizationSwitcher popover ---
					organizationSwitcherPopoverCard: {
						backgroundColor: CLERK_CARD,
						borderColor: CLERK_BORDER,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "0px",
						boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
					},
					organizationSwitcherPopoverActionButton: {
						color: CLERK_TEXT,
						borderRadius: "0px",
					},
					organizationSwitcherPopoverActionButton__createOrganization: {
						color: CLERK_TEXT,
					},
					organizationSwitcherPopoverActionButton__manageOrganization: {
						color: CLERK_TEXT,
					},
					organizationPreviewMainIdentifier: {
						color: CLERK_TEXT,
					},
					organizationPreviewSecondaryIdentifier: {
						color: CLERK_TEXT_MUTED,
					},
					// Trigger button — styled in DashboardHeader; keep minimal here
					organizationSwitcherTrigger: {
						borderRadius: "0px",
					},
					organizationSwitcherTriggerIcon: {
						color: CLERK_TEXT_MUTED,
					},

					// --- UserButton / UserProfile popover ---
					userButtonPopoverCard: {
						backgroundColor: CLERK_CARD,
						borderColor: CLERK_BORDER,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "0px",
						boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
					},
					userButtonPopoverActionButton: {
						color: CLERK_TEXT,
						borderRadius: "0px",
					},
					userPreviewMainIdentifier: {
						color: CLERK_TEXT,
					},
					userPreviewSecondaryIdentifier: {
						color: CLERK_TEXT_MUTED,
					},

					// --- Create Organization / profile modals ---
					modalContent: {
						backgroundColor: CLERK_CARD,
						borderColor: CLERK_BORDER,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "0px",
						boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
					},
					modalBackdrop: {
						backgroundColor: "rgba(0,0,0,0.75)",
						backdropFilter: "blur(4px)",
					},
					// CreateOrganization modal specifically
					createOrganizationBox: {
						backgroundColor: CLERK_CARD,
					},
					profileSection: {
						backgroundColor: CLERK_CARD,
					},
					profileSectionTitle: {
						color: CLERK_TEXT,
					},
					profileSectionContent: {
						color: CLERK_TEXT_MUTED,
					},
					navbar: {
						backgroundColor: CLERK_BG,
						borderColor: CLERK_BORDER,
					},
					navbarButton: {
						color: CLERK_TEXT_MUTED,
					},
					navbarButtonIcon: {
						color: CLERK_TEXT_MUTED,
					},
					// Active nav item
					"navbarButton:focus": {
						color: CLERK_TEXT,
					},

					// --- Form elements ---
					headerTitle: {
						color: CLERK_TEXT,
						fontWeight: "700",
					},
					headerSubtitle: {
						color: CLERK_TEXT_MUTED,
					},
					socialButtonsBlockButton: {
						minHeight: "44px",
						backgroundColor: CLERK_INPUT_BG,
						borderColor: CLERK_BORDER,
						borderRadius: "0px",
						color: CLERK_TEXT,
						fontWeight: "500",
					},
					formButtonPrimary: {
						minHeight: "44px",
						backgroundColor: CLERK_PRIMARY,
						borderRadius: "0px",
						color: "#ffffff",
						fontWeight: "600",
					},
					formButtonReset: {
						borderRadius: "0px",
						color: CLERK_TEXT_MUTED,
					},
					formFieldInput: {
						minHeight: "48px",
						backgroundColor: CLERK_INPUT_BG,
						borderColor: CLERK_BORDER,
						borderRadius: "0px",
						color: CLERK_TEXT,
					},
					formFieldLabel: {
						color: CLERK_TEXT_MUTED,
					},
					footerActionLink: {
						color: CLERK_PRIMARY,
					},
					footerActionText: {
						color: CLERK_TEXT_MUTED,
					},
					identityPreviewText: {
						color: CLERK_TEXT,
					},
					identityPreviewEditButton: {
						color: CLERK_PRIMARY,
					},
					otpCodeFieldInput: {
						backgroundColor: CLERK_INPUT_BG,
						borderColor: CLERK_BORDER,
						borderRadius: "0px",
						color: CLERK_TEXT,
					},
					alternativeMethodsBlockButton: {
						borderColor: CLERK_BORDER,
						borderRadius: "0px",
						color: CLERK_TEXT_MUTED,
					},
					formResendCodeLink: {
						color: CLERK_PRIMARY,
					},
					dividerLine: {
						backgroundColor: CLERK_BORDER,
					},
					dividerText: {
						color: CLERK_TEXT_MUTED,
					},

					// --- Hide Clerk branding only ---
					// IMPORTANT: Do NOT hide `footer` — in Clerk v6 it is the action/nav bar
					// inside OrganizationProfile modals (save changes, section nav, member invite).
					// Hiding it breaks all org management flows.
					// Only hide the specific branding sub-elements below.

					// Development mode badge
					badge: {
						display: "none",
					},
					// "Secured by Clerk" page links (sign-in/up cards)
					footerPages: {
						display: "none",
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

"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { clerkLocalizations } from "@/i18n/clerk-localization";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";

// Monochrome grayscale palette — pure achromatic equivalents
// Clerk appearance API does not accept oklch() — using verified hex approximations.
// oklch(0.95 0 0) → #f0f0f0 (near white — primary button bg)
// oklch(0.08 0 0) → #141414 (gray-950 — deep background)
// oklch(0.12 0 0) → #1f1f1f (gray-900 — card/modal/popover surface)
// oklch(0.16 0 0) → #292929 (gray-850 — input background)
// oklch(0.22 0 0) → #383838 (between gray-800/700 — border)
// oklch(0.95 0 0) → #f0f0f0 (near white — primary text)
// oklch(0.65 0 0) → #a3a3a3 (gray-400 — secondary text / muted)

const CLERK_PRIMARY = "#e8e8e8"; // light gray button (like bg-gray-100)
const CLERK_BG = "#141414"; // oklch(0.08 0 0) — gray-950
const CLERK_CARD = "#1f1f1f"; // oklch(0.12 0 0) — gray-900
const CLERK_INPUT_BG = "#292929"; // oklch(0.16 0 0) — gray-850
const CLERK_BORDER = "#383838"; // oklch(0.22 0 0) — between gray-800 and gray-700
const CLERK_TEXT = "#f0f0f0"; // oklch(0.95 0 0) — near white
const CLERK_TEXT_MUTED = "#a3a3a3"; // oklch(0.65 0 0) — gray-400
const CLERK_DANGER = "#c0392b"; // keep red for danger

// Light-theme counterparts. Same constraint as above: Clerk's appearance API does
// not accept oklch(), so these are hex. Unlike the dark palette (authored as an
// achromatic approximation), these are exact sRGB conversions of the light tokens
// in public/styles/presets/dark-electric-blue.css `:root` — derived, not chosen,
// so the widget lands on the same colors the page itself paints.
// oklch(0.99 0 0)      → #fcfcfc (--background)
// oklch(0.97 0.01 232) → #eff6fb (--card)
// oklch(0.96 0 0)      → #f2f2f2 (--muted — input surface)
// oklch(0.88 0.02 232) → #cbdae3 (--border)
// oklch(0.10 0.01 232) → #020405 (--foreground)
// oklch(0.52 0 0)      → #696969 (--muted-foreground)
// oklch(0.50 0.22 232) → #006ec8 (--primary)

const CLERK_LIGHT_PRIMARY = "#006ec8"; // oklch(0.50 0.22 232) — --primary
const CLERK_LIGHT_BG = "#fcfcfc"; // oklch(0.99 0 0) — --background
const CLERK_LIGHT_CARD = "#eff6fb"; // oklch(0.97 0.01 232) — --card
const CLERK_LIGHT_INPUT_BG = "#f2f2f2"; // oklch(0.96 0 0) — --muted
const CLERK_LIGHT_BORDER = "#cbdae3"; // oklch(0.88 0.02 232) — --border
const CLERK_LIGHT_TEXT = "#020405"; // oklch(0.10 0.01 232) — --foreground
const CLERK_LIGHT_TEXT_MUTED = "#696969"; // oklch(0.52 0 0) — --muted-foreground
const CLERK_LIGHT_DANGER = "#c0392b"; // keep red for danger

const DARK_PALETTE = {
	primary: CLERK_PRIMARY,
	bg: CLERK_BG,
	card: CLERK_CARD,
	inputBg: CLERK_INPUT_BG,
	border: CLERK_BORDER,
	text: CLERK_TEXT,
	textMuted: CLERK_TEXT_MUTED,
	danger: CLERK_DANGER,
	cardShadow: "0 8px 24px rgba(0,0,0,0.5)",
	modalShadow: "0 16px 48px rgba(0,0,0,0.7)",
	modalBackdrop: "rgba(0,0,0,0.75)",
};

// Same keys, light values. Shadows are lightened too: the dark palette's
// rgba(0,0,0,0.5) reads as a black halo on a near-white surface.
const LIGHT_PALETTE: typeof DARK_PALETTE = {
	primary: CLERK_LIGHT_PRIMARY,
	bg: CLERK_LIGHT_BG,
	card: CLERK_LIGHT_CARD,
	inputBg: CLERK_LIGHT_INPUT_BG,
	border: CLERK_LIGHT_BORDER,
	text: CLERK_LIGHT_TEXT,
	textMuted: CLERK_LIGHT_TEXT_MUTED,
	danger: CLERK_LIGHT_DANGER,
	cardShadow: "0 8px 24px rgba(0,0,0,0.10)",
	modalShadow: "0 16px 48px rgba(0,0,0,0.14)",
	modalBackdrop: "rgba(0,0,0,0.40)",
};

// ClerkProvider in @clerk/nextjs v6 is typed as an async Server Component
// (Promise<React.JSX.Element>), which is incompatible with @types/react 18.0.x JSX.
// This is a known TS compatibility gap — the runtime behavior is correct.
// See: https://clerk.com/changelog/2024-04-19#nextjs-app-router-server-components
// biome-ignore lint/suspicious/noExplicitAny: cast required for Clerk v6 + @types/react 18 compat
const ClerkProviderCompat = ClerkProvider as any;

export function ClientProviders({
	children,
	locale,
}: {
	children: ReactNode;
	locale: string;
}) {
	const localization = clerkLocalizations[locale] || {};

	const { resolvedTheme } = useTheme();
	// `resolvedTheme` is undefined on the server and on the first client render, so it
	// falls back to the dark palette — identical to what this file rendered before, which
	// keeps SSR and first client paint byte-for-byte in agreement (no hydration mismatch).
	// next-themes then re-renders with the real value on mount.
	const isLight = resolvedTheme === "light";
	const c = isLight ? LIGHT_PALETTE : DARK_PALETTE;

	return (
		<ClerkProviderCompat
			dynamic
			afterSignOutUrl="/sign-in"
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/dashboard"
			localization={localization}
			appearance={{
				...(isLight ? {} : { baseTheme: dark }),
				variables: {
					colorPrimary: c.primary,
					colorBackground: c.bg,
					colorInputBackground: c.inputBg,
					colorInputText: c.text,
					colorText: c.text,
					colorTextSecondary: c.textMuted,
					colorDanger: c.danger,

					// Space Grotesk — inherits from page CSS via "inherit"
					fontFamily: '"Space Grotesk", system-ui, sans-serif',
					fontSize: "0.9375rem",
					fontWeight: { normal: 400, medium: 500, bold: 700 },

					// Sharp corners everywhere — editorial design system
					// Rounded corners — matches landing card style (rounded-2xl)
					borderRadius: "16px",

					spacingUnit: "1rem",
				},
				elements: {
					// --- Global containers ---
					rootBox: {
						margin: "0",
					},
					card: {
						backgroundColor: c.card,
						borderColor: c.border,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "16px",
						boxShadow: c.cardShadow,
					},

					// --- OrganizationSwitcher popover ---
					organizationSwitcherPopoverCard: {
						backgroundColor: c.card,
						borderColor: c.border,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "16px",
						boxShadow: c.cardShadow,
					},
					organizationSwitcherPopoverActionButton: {
						color: c.text,
						borderRadius: "16px",
					},
					organizationSwitcherPopoverActionButton__createOrganization: {
						color: c.text,
					},
					organizationSwitcherPopoverActionButton__manageOrganization: {
						color: c.text,
					},
					organizationPreviewMainIdentifier: {
						color: c.text,
					},
					organizationPreviewSecondaryIdentifier: {
						color: c.textMuted,
					},
					// Trigger button — styled in DashboardHeader; keep minimal here
					organizationSwitcherTrigger: {
						borderRadius: "16px",
					},
					organizationSwitcherTriggerIcon: {
						color: c.textMuted,
					},

					// --- UserButton / UserProfile popover ---
					userButtonPopoverCard: {
						backgroundColor: c.card,
						borderColor: c.border,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "16px",
						boxShadow: c.cardShadow,
					},
					userButtonPopoverActionButton: {
						color: c.text,
						borderRadius: "16px",
					},
					userPreviewMainIdentifier: {
						color: c.text,
					},
					userPreviewSecondaryIdentifier: {
						color: c.textMuted,
					},

					// --- Create Organization / profile modals ---
					modalContent: {
						backgroundColor: c.card,
						borderColor: c.border,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "16px",
						boxShadow: c.modalShadow,
					},
					modalBackdrop: {
						backgroundColor: c.modalBackdrop,
						backdropFilter: "blur(4px)",
					},
					// CreateOrganization modal specifically
					createOrganizationBox: {
						backgroundColor: c.card,
					},
					profileSection: {
						backgroundColor: c.card,
					},
					profileSectionTitle: {
						color: c.text,
					},
					profileSectionContent: {
						color: c.textMuted,
					},
					navbar: {
						backgroundColor: c.bg,
						borderColor: c.border,
					},
					navbarButton: {
						color: c.textMuted,
					},
					navbarButtonIcon: {
						color: c.textMuted,
					},
					// Active nav item
					"navbarButton:focus": {
						color: c.text,
					},

					// --- Form elements ---
					headerTitle: {
						color: c.text,
						fontWeight: "700",
					},
					headerSubtitle: {
						color: c.textMuted,
					},
					socialButtonsBlockButton: {
						minHeight: "44px",
						backgroundColor: c.inputBg,
						borderColor: c.border,
						borderRadius: "16px",
						color: c.text,
						fontWeight: "500",
					},
					formButtonPrimary: {
						minHeight: "44px",
						backgroundColor: c.text,
						borderRadius: "16px",
						color: c.bg,
						fontWeight: "600",
					},
					formButtonReset: {
						borderRadius: "16px",
						color: c.textMuted,
					},
					formFieldInput: {
						minHeight: "48px",
						backgroundColor: c.inputBg,
						borderColor: c.border,
						borderRadius: "16px",
						color: c.text,
					},
					formFieldLabel: {
						color: c.textMuted,
					},
					footerActionLink: {
						color: c.primary,
					},
					footerActionText: {
						color: c.textMuted,
					},
					identityPreviewText: {
						color: c.text,
					},
					identityPreviewEditButton: {
						color: c.primary,
					},
					otpCodeFieldInput: {
						backgroundColor: c.inputBg,
						borderColor: c.border,
						borderRadius: "16px",
						color: c.text,
					},
					alternativeMethodsBlockButton: {
						borderColor: c.border,
						borderRadius: "16px",
						color: c.textMuted,
					},
					formResendCodeLink: {
						color: c.primary,
					},
					dividerLine: {
						backgroundColor: c.border,
					},
					dividerText: {
						color: c.textMuted,
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
		</ClerkProviderCompat>
	);
}

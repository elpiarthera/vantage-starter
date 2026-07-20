import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { clerkLocalizations } from "@/i18n/clerk-localization";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";

// Theme-following palette: reference the same CSS custom properties the rest
// of the app uses (defined in app/globals.css + styles/presets/*.css).
// VERIFIED (this task, k172nrg38ap3v9e6f0jry50bws8andg0): `@clerk/shared`'s
// internal appearance types (node_modules/.pnpm/@clerk+shared@4.4.0.../dist/
// runtime/react/index.d.ts, `internalStripeAppearance`) type every color
// field as a plain `string`, so `var(--token)` compiles and type-checks.
// VERIFIED (this task): clerk-js DOES resolve `var(--token)` at runtime.
// Measured with real Chromium on the public /en/sign-in route, waiting for
// `[class*='cl-formButtonPrimary']` to mount, then reading
// `getComputedStyle` while toggling the `dark` class on `<html>`:
//   LIGHT: token --background oklch(0.99 0 0)   | button bg oklch(0.3 0 0)
//          button text oklch(0.99 0 0)          | card text oklch(0.1 0 0)
//   DARK : token --background oklch(0.145 0 0)  | button bg oklch(0.922 0 0)
//          button text oklch(0.205 0 0)         | card text oklch(0.985 0 0)
// Clerk's computed colors are resolved OKLCH values that match the tokens
// and flip with the theme — not a literal "var(" string and not a stale
// default. Guarded by e2e/clerk-theme.spec.ts, which fails if clerk-js ever
// stops resolving custom properties.
// No unconditional `baseTheme` import: with every listed variable
// point at a live token, base state is provided by the tokens already, and
// following light/dark requires no JS theme read (no client boundary).
const CLERK_PRIMARY = "var(--primary)";
const CLERK_PRIMARY_FOREGROUND = "var(--primary-foreground)";
const CLERK_BG = "var(--background)";
const CLERK_CARD = "var(--card)";
const CLERK_INPUT_BG = "var(--input)";
const CLERK_BORDER = "var(--border)";
const CLERK_TEXT = "var(--foreground)";
const CLERK_TEXT_MUTED = "var(--muted-foreground)";
const CLERK_DANGER = "var(--destructive)";

// ClerkProvider in @clerk/nextjs is still typed as an async Server Component
// in v7 (Promise<React.JSX.Element>), which TS rejects as a JSX component
// regardless of @types/react version. VERIFIED (this task, @clerk/nextjs
// 7.5.20): node_modules/@clerk/nextjs/dist/types/app-router/server/
// ClerkProvider.d.ts -- the file actually re-exported from the package's
// top-level `ClerkProvider` (via components.server.d.ts ->
// ServerComponentsServerModuleTypes) -- still declares
// `ClerkProvider<TUi>(props): Promise<React.JSX.Element>`. (A second,
// unrelated `client-boundary/ClerkProvider.d.ts` in the same package IS
// synchronous, but it is not what `import { ClerkProvider } from
// "@clerk/nextjs"` resolves to -- checking it first was a mistake in an
// earlier pass of this task.) TS2786 persists exactly as it did on v6:
// "'ClerkProvider' cannot be used as a JSX component. Its return type
// 'Promise<Element>' is not a valid JSX element." Not a React 18 vs 19 gap --
// it is Clerk's own async-component typing, the runtime behavior is correct.
// See: https://clerk.com/changelog/2024-04-19#nextjs-app-router-server-components
// biome-ignore lint/suspicious/noExplicitAny: cast required for Clerk's async-component typing
const ClerkProviderCompat = ClerkProvider as any;

export function ClientProviders({
	children,
	locale,
}: {
	children: ReactNode;
	locale: string;
}) {
	const localization = clerkLocalizations[locale] || {};

	return (
		<ClerkProviderCompat
			dynamic
			afterSignOutUrl="/sign-in"
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/dashboard"
			localization={localization}
			appearance={{
				variables: {
					colorPrimary: CLERK_PRIMARY,
					colorBackground: CLERK_BG,
					colorInput: CLERK_INPUT_BG,
					colorInputForeground: CLERK_TEXT,
					colorForeground: CLERK_TEXT,
					colorMutedForeground: CLERK_TEXT_MUTED,
					colorDanger: CLERK_DANGER,

					// Space Grotesk — inherits from page CSS via "inherit"
					fontFamily: '"Space Grotesk", system-ui, sans-serif',
					fontSize: "0.9375rem",
					fontWeight: { normal: 400, medium: 500, bold: 700 },

					// Sharp corners everywhere — editorial design system
					// Rounded corners — matches landing card style (rounded-2xl)
					borderRadius: "16px",

					spacing: "1rem",
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
						borderRadius: "16px",
						boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
					},

					// --- OrganizationSwitcher popover ---
					organizationSwitcherPopoverCard: {
						backgroundColor: CLERK_CARD,
						borderColor: CLERK_BORDER,
						borderWidth: "1px",
						borderStyle: "solid",
						borderRadius: "16px",
						boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
					},
					organizationSwitcherPopoverActionButton: {
						color: CLERK_TEXT,
						borderRadius: "16px",
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
						borderRadius: "16px",
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
						borderRadius: "16px",
						boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
					},
					userButtonPopoverActionButton: {
						color: CLERK_TEXT,
						borderRadius: "16px",
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
						borderRadius: "16px",
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
						borderRadius: "16px",
						color: CLERK_TEXT,
						fontWeight: "500",
					},
					formButtonPrimary: {
						minHeight: "44px",
						backgroundColor: CLERK_PRIMARY,
						borderRadius: "16px",
						color: CLERK_PRIMARY_FOREGROUND,
						fontWeight: "600",
					},
					formButtonReset: {
						borderRadius: "16px",
						color: CLERK_TEXT_MUTED,
					},
					formFieldInput: {
						minHeight: "48px",
						backgroundColor: CLERK_INPUT_BG,
						borderColor: CLERK_BORDER,
						borderRadius: "16px",
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
						borderRadius: "16px",
						color: CLERK_TEXT,
					},
					alternativeMethodsBlockButton: {
						borderColor: CLERK_BORDER,
						borderRadius: "16px",
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
		</ClerkProviderCompat>
	);
}

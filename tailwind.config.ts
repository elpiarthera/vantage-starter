import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		screens: {
			xs: "480px",
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			"2xl": "1536px",
		},
		extend: {
			fontFamily: {
				sans: ["var(--font-sans)", ...fontFamily.sans],
				heading: ["var(--font-heading)", ...fontFamily.sans],
				mono: ["Geist Mono", "monospace"],
			},
			colors: {
				gray: {
					50: "oklch(0.98 0 0)",
					100: "oklch(0.95 0 0)",
					200: "oklch(0.88 0 0)",
					300: "oklch(0.78 0 0)",
					400: "oklch(0.62 0 0)",
					500: "oklch(0.50 0 0)",
					600: "oklch(0.40 0 0)",
					700: "oklch(0.28 0 0)",
					800: "oklch(0.20 0 0)",
					850: "oklch(0.16 0 0)",
					900: "oklch(0.12 0 0)",
					950: "oklch(0.08 0 0)",
				},
				white: "oklch(1 0 0)",
				background: "oklch(var(--background) / <alpha-value>)",
				foreground: "oklch(var(--foreground) / <alpha-value>)",
				"accent-warm": "var(--accent-warm)",
				"card-hover": "var(--card-hover)",
				"border-hover": "var(--border-hover)",
				card: {
					DEFAULT: "oklch(var(--card) / <alpha-value>)",
					foreground: "oklch(var(--card-foreground) / <alpha-value>)",
				},
				popover: {
					DEFAULT: "oklch(var(--popover) / <alpha-value>)",
					foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
				},
				primary: {
					DEFAULT: "oklch(var(--primary) / <alpha-value>)",
					foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
				},
				secondary: {
					DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
					foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
				},
				muted: {
					DEFAULT: "oklch(var(--muted) / <alpha-value>)",
					foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
				},
				accent: {
					DEFAULT: "oklch(var(--accent) / <alpha-value>)",
					foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
				},
				destructive: {
					DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
					foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
				},
				success: "oklch(var(--success) / <alpha-value>)",
				warning: "oklch(var(--warning) / <alpha-value>)",
				border: "oklch(var(--border) / <alpha-value>)",
				input: "oklch(var(--input) / <alpha-value>)",
				ring: "oklch(var(--ring) / <alpha-value>)",
				chart: {
					"1": "oklch(var(--chart-1) / <alpha-value>)",
					"2": "oklch(var(--chart-2) / <alpha-value>)",
					"3": "oklch(var(--chart-3) / <alpha-value>)",
					"4": "oklch(var(--chart-4) / <alpha-value>)",
					"5": "oklch(var(--chart-5) / <alpha-value>)",
				},
				sidebar: {
					DEFAULT: "var(--sidebar-background)",
					foreground: "var(--sidebar-foreground)",
					primary: "var(--sidebar-primary)",
					"primary-foreground": "var(--sidebar-primary-foreground)",
					accent: "var(--sidebar-accent)",
					"accent-foreground": "var(--sidebar-accent-foreground)",
					border: "var(--sidebar-border)",
					ring: "var(--sidebar-ring)",
				},
			},
			borderRadius: {
				DEFAULT: "12px",
				sm: "6px",
				md: "8px",
				lg: "8px",
				xl: "12px",
				"2xl": "16px",
				full: "9999px",
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: "0",
					},
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			transitionTimingFunction: {
				"out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
			},
			boxShadow: {
				xs: "0 1px 2px oklch(0 0 0 / 5%)",
				sm: "0 1px 3px oklch(0 0 0 / 8%), 0 1px 2px oklch(0 0 0 / 5%)",
				md: "0 4px 8px oklch(0 0 0 / 8%), 0 2px 4px oklch(0 0 0 / 5%)",
				lg: "0 8px 24px oklch(0 0 0 / 10%), 0 4px 8px oklch(0 0 0 / 6%)",
				xl: "0 16px 48px oklch(0 0 0 / 12%), 0 8px 16px oklch(0 0 0 / 8%)",
				"amber-sm": "0 2px 8px oklch(0.62 0.16 44 / 25%)",
				"amber-md": "0 4px 16px oklch(0.62 0.16 44 / 20%)",
				"amber-lg": "0 8px 32px oklch(0.62 0.16 44 / 25%)",
				"amber-dark-sm": "0 2px 8px oklch(0.72 0.16 44 / 15%)",
				"amber-dark-lg": "0 8px 32px oklch(0.72 0.16 44 / 12%)",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;

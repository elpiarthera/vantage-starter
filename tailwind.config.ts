import type { Config } from "tailwindcss";

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
    		xs: '480px',
    		sm: '640px',
    		md: '768px',
    		lg: '1024px',
    		xl: '1280px',
    		'2xl': '1536px'
    	},
    	extend: {
    		fontFamily: {
    			sans: [
    				'Instrument Sans',
    				'system-ui',
    				'sans-serif'
    			],
    			mono: [
    				'Geist Mono',
    				'monospace'
    			]
    		},
    		colors: {
    			background: 'oklch(var(--background) / <alpha-value>)',
    			foreground: 'oklch(var(--foreground) / <alpha-value>)',
    			card: {
    				DEFAULT: 'oklch(var(--card) / <alpha-value>)',
    				foreground: 'oklch(var(--card-foreground) / <alpha-value>)'
    			},
    			popover: {
    				DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
    				foreground: 'oklch(var(--popover-foreground) / <alpha-value>)'
    			},
    			primary: {
    				DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
    				foreground: 'oklch(var(--primary-foreground) / <alpha-value>)'
    			},
    			secondary: {
    				DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
    				foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)'
    			},
    			muted: {
    				DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
    				foreground: 'oklch(var(--muted-foreground) / <alpha-value>)'
    			},
    			accent: {
    				DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
    				foreground: 'oklch(var(--accent-foreground) / <alpha-value>)'
    			},
    			destructive: {
    				DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
    				foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)'
    			},
    			success: 'oklch(var(--success) / <alpha-value>)',
    			warning: 'oklch(var(--warning) / <alpha-value>)',
    			border: 'oklch(var(--border) / <alpha-value>)',
    			input: 'oklch(var(--input) / <alpha-value>)',
    			ring: 'oklch(var(--ring) / <alpha-value>)',
    			chart: {
    				'1': 'oklch(var(--chart-1) / <alpha-value>)',
    				'2': 'oklch(var(--chart-2) / <alpha-value>)',
    				'3': 'oklch(var(--chart-3) / <alpha-value>)',
    				'4': 'oklch(var(--chart-4) / <alpha-value>)',
    				'5': 'oklch(var(--chart-5) / <alpha-value>)'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		borderRadius: {
    			DEFAULT: '12px',
    			sm: '6px',
    			md: '8px',
    			lg: '8px',
    			xl: '12px',
    			'2xl': '16px',
    			full: '9999px'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
};
export default config;

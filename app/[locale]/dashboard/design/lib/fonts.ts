/**
 * Design System Fonts — ported from shadcn/ui v4
 * Font loading via next/font/google with CSS variable injection.
 */

import {
	DM_Sans,
	Figtree,
	Geist,
	Geist_Mono,
	IBM_Plex_Sans,
	Instrument_Sans,
	Inter,
	JetBrains_Mono,
	Lora,
	Manrope,
	Merriweather,
	Montserrat,
	Noto_Sans,
	Noto_Serif,
	Nunito_Sans,
	Outfit,
	Oxanium,
	Playfair_Display,
	Public_Sans,
	Raleway,
	Roboto,
	Roboto_Slab,
	Source_Sans_3,
	Space_Grotesk,
} from "next/font/google";

type PreviewFont = ReturnType<typeof Inter>;

// ============================================================================
// Font instances — loaded via next/font/google
// ============================================================================

const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const notoSans = Noto_Sans({
	subsets: ["latin"],
	variable: "--font-noto-sans",
});

const nunitoSans = Nunito_Sans({
	subsets: ["latin"],
	variable: "--font-nunito-sans",
});

const figtree = Figtree({
	subsets: ["latin"],
	variable: "--font-figtree",
});

const roboto = Roboto({
	subsets: ["latin"],
	variable: "--font-roboto",
});

const raleway = Raleway({
	subsets: ["latin"],
	variable: "--font-raleway",
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
});

const publicSans = Public_Sans({
	subsets: ["latin"],
	variable: "--font-public-sans",
});

const outfit = Outfit({
	subsets: ["latin"],
	variable: "--font-outfit",
});

const oxanium = Oxanium({
	subsets: ["latin"],
	variable: "--font-oxanium",
});

const manrope = Manrope({
	subsets: ["latin"],
	variable: "--font-manrope",
});

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-space-grotesk",
});

const montserrat = Montserrat({
	subsets: ["latin"],
	variable: "--font-montserrat",
});

const ibmPlexSans = IBM_Plex_Sans({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-ibm-plex-sans",
});

const sourceSans3 = Source_Sans_3({
	subsets: ["latin"],
	variable: "--font-source-sans-3",
});

const instrumentSans = Instrument_Sans({
	subsets: ["latin"],
	variable: "--font-instrument-sans",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

const notoSerif = Noto_Serif({
	subsets: ["latin"],
	variable: "--font-noto-serif",
});

const robotoSlab = Roboto_Slab({
	subsets: ["latin"],
	variable: "--font-roboto-slab",
});

const merriweather = Merriweather({
	weight: ["300", "400", "700", "900"],
	subsets: ["latin"],
	variable: "--font-merriweather",
});

const lora = Lora({
	subsets: ["latin"],
	variable: "--font-lora",
});

const playfairDisplay = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-playfair-display",
});

// ============================================================================
// Font registry — maps font value to loaded instance
// ============================================================================

type FontType = "sans" | "serif" | "mono";

interface FontDefinition {
	name: string;
	value: string;
	font: PreviewFont;
	type: FontType;
}

const PREVIEW_FONTS: Record<string, PreviewFont> = {
	geist: geistSans,
	inter,
	"noto-sans": notoSans,
	"nunito-sans": nunitoSans,
	figtree,
	roboto,
	raleway,
	"dm-sans": dmSans,
	"public-sans": publicSans,
	outfit,
	oxanium,
	manrope,
	"space-grotesk": spaceGrotesk,
	montserrat,
	"ibm-plex-sans": ibmPlexSans,
	"source-sans-3": sourceSans3,
	"instrument-sans": instrumentSans,
	"jetbrains-mono": jetbrainsMono,
	"geist-mono": geistMono,
	"noto-serif": notoSerif,
	"roboto-slab": robotoSlab,
	merriweather,
	lora,
	"playfair-display": playfairDisplay,
};

function createFontOption(
	value: string,
	name: string,
	type: FontType,
): FontDefinition {
	const font = PREVIEW_FONTS[value];
	if (!font) {
		throw new Error(`Unknown font: ${value}`);
	}
	return { name, value, font, type };
}

export const FONTS: FontDefinition[] = [
	createFontOption("geist", "Geist", "sans"),
	createFontOption("inter", "Inter", "sans"),
	createFontOption("noto-sans", "Noto Sans", "sans"),
	createFontOption("nunito-sans", "Nunito Sans", "sans"),
	createFontOption("figtree", "Figtree", "sans"),
	createFontOption("roboto", "Roboto", "sans"),
	createFontOption("raleway", "Raleway", "sans"),
	createFontOption("dm-sans", "DM Sans", "sans"),
	createFontOption("public-sans", "Public Sans", "sans"),
	createFontOption("outfit", "Outfit", "sans"),
	createFontOption("oxanium", "Oxanium", "sans"),
	createFontOption("manrope", "Manrope", "sans"),
	createFontOption("space-grotesk", "Space Grotesk", "sans"),
	createFontOption("montserrat", "Montserrat", "sans"),
	createFontOption("ibm-plex-sans", "IBM Plex Sans", "sans"),
	createFontOption("source-sans-3", "Source Sans 3", "sans"),
	createFontOption("instrument-sans", "Instrument Sans", "sans"),
	createFontOption("geist-mono", "Geist Mono", "mono"),
	createFontOption("jetbrains-mono", "JetBrains Mono", "mono"),
	createFontOption("noto-serif", "Noto Serif", "serif"),
	createFontOption("roboto-slab", "Roboto Slab", "serif"),
	createFontOption("merriweather", "Merriweather", "serif"),
	createFontOption("lora", "Lora", "serif"),
	createFontOption("playfair-display", "Playfair Display", "serif"),
];

export type Font = (typeof FONTS)[number];

export const FONT_HEADING_OPTIONS = [
	{
		name: "Inherit",
		value: "inherit",
		font: null,
		type: "default" as const,
	},
	...FONTS,
];

export type FontHeadingOption = (typeof FONT_HEADING_OPTIONS)[number];

"use client";

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
	Nunito_Sans,
	Outfit,
	Public_Sans,
	Raleway,
	Roboto,
	Source_Sans_3,
	Space_Grotesk,
} from "next/font/google";

// Font instances — loaded once, shared across the design system
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSans = Noto_Sans({
	subsets: ["latin"],
	variable: "--font-noto-sans",
});
const nunitoSans = Nunito_Sans({
	subsets: ["latin"],
	variable: "--font-nunito-sans",
});
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const publicSans = Public_Sans({
	subsets: ["latin"],
	variable: "--font-public-sans",
});
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-space-grotesk",
});
const montserrat = Montserrat({
	subsets: ["latin"],
	variable: "--font-montserrat",
});
const ibmPlexSans = IBM_Plex_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
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
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const merriweather = Merriweather({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-merriweather",
});

export type FontOption = {
	name: string;
	value: string;
	type: "sans" | "serif" | "mono";
	font: { style: { fontFamily: string } };
};

export const FONTS: readonly FontOption[] = [
	{ name: "Geist", value: "geist", type: "sans", font: geist },
	{ name: "Inter", value: "inter", type: "sans", font: inter },
	{ name: "Noto Sans", value: "noto-sans", type: "sans", font: notoSans },
	{ name: "Nunito Sans", value: "nunito-sans", type: "sans", font: nunitoSans },
	{ name: "Figtree", value: "figtree", type: "sans", font: figtree },
	{ name: "Roboto", value: "roboto", type: "sans", font: roboto },
	{ name: "Raleway", value: "raleway", type: "sans", font: raleway },
	{ name: "DM Sans", value: "dm-sans", type: "sans", font: dmSans },
	{ name: "Public Sans", value: "public-sans", type: "sans", font: publicSans },
	{ name: "Outfit", value: "outfit", type: "sans", font: outfit },
	{ name: "Manrope", value: "manrope", type: "sans", font: manrope },
	{
		name: "Space Grotesk",
		value: "space-grotesk",
		type: "sans",
		font: spaceGrotesk,
	},
	{ name: "Montserrat", value: "montserrat", type: "sans", font: montserrat },
	{
		name: "IBM Plex Sans",
		value: "ibm-plex-sans",
		type: "sans",
		font: ibmPlexSans,
	},
	{
		name: "Source Sans 3",
		value: "source-sans-3",
		type: "sans",
		font: sourceSans3,
	},
	{
		name: "Instrument Sans",
		value: "instrument-sans",
		type: "sans",
		font: instrumentSans,
	},
	{ name: "Geist Mono", value: "geist-mono", type: "mono", font: geistMono },
	{
		name: "JetBrains Mono",
		value: "jetbrains-mono",
		type: "mono",
		font: jetbrainsMono,
	},
	{ name: "Lora", value: "lora", type: "serif", font: lora },
	{
		name: "Merriweather",
		value: "merriweather",
		type: "serif",
		font: merriweather,
	},
];

export const FONT_HEADING_OPTIONS: readonly (
	| FontOption
	| { name: string; value: "inherit"; type: "default"; font: null }
)[] = [
	{ name: "Inherit", value: "inherit", type: "default", font: null },
	...FONTS,
];

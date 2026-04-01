import {
	DM_Sans,
	Figtree,
	Geist,
	Geist_Mono,
	IBM_Plex_Sans,
	Inter,
	JetBrains_Mono,
	Lora,
	Manrope,
	Merriweather,
	Montserrat,
	Noto_Sans,
	Outfit,
	Playfair_Display,
	Public_Sans,
	Raleway,
	Roboto,
	Roboto_Slab,
	Space_Grotesk,
} from "next/font/google";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSans = Noto_Sans({
	subsets: ["latin"],
	variable: "--font-noto-sans",
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
	variable: "--font-ibm-plex-sans",
	weight: ["400", "500", "600", "700"],
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
	variable: "--font-merriweather",
	weight: ["300", "400", "700", "900"],
});
const robotoSlab = Roboto_Slab({
	subsets: ["latin"],
	variable: "--font-roboto-slab",
});
const playfairDisplay = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-playfair-display",
});

export type FontOption = {
	name: string;
	value: string;
	type: "sans" | "serif" | "mono";
	font: { style: { fontFamily: string } };
};

export const FONTS: FontOption[] = [
	{ name: "Geist", value: "geist", type: "sans", font: geistSans },
	{ name: "Inter", value: "inter", type: "sans", font: inter },
	{ name: "Noto Sans", value: "noto-sans", type: "sans", font: notoSans },
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
	{
		name: "Montserrat",
		value: "montserrat",
		type: "sans",
		font: montserrat,
	},
	{
		name: "IBM Plex Sans",
		value: "ibm-plex-sans",
		type: "sans",
		font: ibmPlexSans,
	},
	{
		name: "Geist Mono",
		value: "geist-mono",
		type: "mono",
		font: geistMono,
	},
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
	{
		name: "Roboto Slab",
		value: "roboto-slab",
		type: "serif",
		font: robotoSlab,
	},
	{
		name: "Playfair Display",
		value: "playfair-display",
		type: "serif",
		font: playfairDisplay,
	},
];

export const FONT_HEADING_OPTIONS: (
	| FontOption
	| {
			name: string;
			value: "inherit";
			type: "default";
			font: null;
	  }
)[] = [
	{ name: "Inherit", value: "inherit", type: "default", font: null },
	...FONTS,
];

export type FontValue = string;
export type FontHeadingValue = string;

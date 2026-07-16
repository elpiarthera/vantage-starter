"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { routing, usePathname, useRouter } from "@/i18n/routing";

/**
 * Display metadata (label + flag) for known locale codes. This table is
 * NOT the source of truth for which locales are offered — that's always
 * `routing.locales` (see `localeList` below) — it only supplies a nicer
 * label/flag when one is known. A locale present in `routing.locales`
 * but absent here still renders, falling back to its raw code, so adding
 * a locale to `routing.ts` never silently drops it from this switcher.
 */
const localeMeta: Record<string, { label: string; flag: string }> = {
	en: { label: "English", flag: "🇺🇸" },
	fr: { label: "Français", flag: "🇫🇷" },
	de: { label: "Deutsch", flag: "🇩🇪" },
	it: { label: "Italiano", flag: "🇮🇹" },
	es: { label: "Español", flag: "🇪🇸" },
	pt: { label: "Português", flag: "🇵🇹🇧🇷" },
	ru: { label: "Русский", flag: "🇷🇺" },
};

const localeList = routing.locales.map((code) => ({
	code,
	label: localeMeta[code]?.label ?? code,
	flag: localeMeta[code]?.flag ?? "",
}));

export function LanguageSwitcher() {
	const router = useRouter();
	const pathname = usePathname();
	const locale = useLocale();
	const t = useTranslations("common");
	const { isSignedIn } = useAuth();
	const updateLanguagePreference = useMutation(
		api.users.updateLanguagePreference,
	);

	const currentLocale =
		localeList.find((l) => l.code === locale) || localeList[0];

	const handleChange = async (newLocale: string) => {
		// Save to Convex if user is signed in
		if (isSignedIn) {
			try {
				await updateLanguagePreference({ language: newLocale });
			} catch (error) {
				console.error("Failed to save language preference:", error);
			}
		}

		// Switch the app locale
		router.replace(pathname, { locale: newLocale });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="gap-2 min-h-[44px] text-sm"
					aria-label={t("change_language")}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="h-4 w-4"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="2" y1="12" x2="22" y2="12" />
						<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
					</svg>
					<span className="hidden sm:inline">
						{currentLocale.flag} {currentLocale.code.toUpperCase()}
					</span>
					<span className="sm:hidden">{currentLocale.flag}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="bg-card border-border">
				{localeList.map((loc) => (
					<DropdownMenuItem
						key={loc.code}
						onClick={() => handleChange(loc.code)}
						className={`cursor-pointer ${
							loc.code === locale
								? "bg-secondary text-foreground"
								: "text-muted-foreground hover:bg-secondary hover:text-foreground"
						}`}
					>
						<span className="mr-2">{loc.flag}</span>
						{loc.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

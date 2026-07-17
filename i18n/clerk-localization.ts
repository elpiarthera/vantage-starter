// i18n/clerk-localization.ts
//
// Clerk's <SignIn>/<SignUp> widgets render their OWN internal strings
// ("Email address", "Continue", "Password", etc.) independently of our
// next-intl `messages/*.json`. Passing only the hand-typed `brandOverrides`
// below (as this file used to do) covers the "start" screen title/subtitle
// but leaves every form field label in English -- exactly the gap Laurent's
// screenshots would have shown even after the routing/path fix. The fix is
// to load Clerk's OWN full locale packs from `@clerk/localizations` (one
// per locale, official translations of every widget string) and layer our
// brand copy ("VantageStarter") on top with a deep merge.
import { deDE, enUS, esES, frFR, itIT, ptBR, ruRU } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/types";
import { routing } from "@/i18n/routing";

// Keyed by next-intl locale code (routing.locales), NOT by Clerk's own
// BCP-47 codes -- this is the map next-intl's `locale` param looks up.
// If routing.locales ever gains an entry with no pack listed here, the
// `clerkLocalizations` build below throws loudly instead of silently
// falling back to English.
const CLERK_LOCALE_PACKS: Partial<
	Record<(typeof routing.locales)[number], LocalizationResource>
> = {
	en: enUS,
	fr: frFR,
	de: deDE,
	it: itIT,
	es: esES,
	pt: ptBR,
	ru: ruRU,
};

// Deep-merge is limited to the two nested groups we brand (signIn.start /
// signUp.start) -- every other key comes untouched from the official pack.
function deepMerge<T extends Record<string, unknown>>(
	base: T,
	override: Partial<T>,
): T {
	const result: Record<string, unknown> = { ...base };
	for (const key of Object.keys(override)) {
		const overrideValue = override[key];
		const baseValue = base[key];
		if (
			overrideValue &&
			typeof overrideValue === "object" &&
			!Array.isArray(overrideValue) &&
			baseValue &&
			typeof baseValue === "object" &&
			!Array.isArray(baseValue)
		) {
			result[key] = deepMerge(
				baseValue as Record<string, unknown>,
				overrideValue as Record<string, unknown>,
			);
		} else {
			result[key] = overrideValue;
		}
	}
	return result as T;
}

// Brand-specific copy for the "start" screens only. Every other widget
// string (field labels, buttons, errors, MFA, etc.) is Clerk's own official
// translation from CLERK_LOCALE_PACKS above -- never hand-retyped here.
const brandOverrides: Partial<
	Record<(typeof routing.locales)[number], Partial<LocalizationResource>>
> = {
	fr: {
		signIn: {
			start: {
				title: "Connexion",
				subtitle: "Connectez-vous pour continuer vers VantageStarter",
				actionText: "Pas encore de compte ?",
				actionLink: "S'inscrire",
			},
		},
		signUp: {
			start: {
				title: "Créer un compte",
				subtitle: "Inscrivez-vous pour commencer avec VantageStarter",
				actionText: "Déjà un compte ?",
				actionLink: "Se connecter",
			},
		},
	},
	de: {
		signIn: {
			start: {
				title: "Anmelden",
				subtitle: "Melden Sie sich an, um zu VantageStarter fortzufahren",
				actionText: "Noch kein Konto?",
				actionLink: "Registrieren",
			},
		},
		signUp: {
			start: {
				title: "Konto erstellen",
				subtitle: "Registrieren Sie sich, um mit VantageStarter zu beginnen",
				actionText: "Bereits ein Konto?",
				actionLink: "Anmelden",
			},
		},
	},
	it: {
		signIn: {
			start: {
				title: "Accedi",
				subtitle: "Accedi per continuare su VantageStarter",
				actionText: "Non hai un account?",
				actionLink: "Registrati",
			},
		},
		signUp: {
			start: {
				title: "Crea un account",
				subtitle: "Registrati per iniziare con VantageStarter",
				actionText: "Hai già un account?",
				actionLink: "Accedi",
			},
		},
	},
	es: {
		signIn: {
			start: {
				title: "Iniciar sesión",
				subtitle: "Inicia sesión para continuar a VantageStarter",
				actionText: "¿No tienes cuenta?",
				actionLink: "Regístrate",
			},
		},
		signUp: {
			start: {
				title: "Crear cuenta",
				subtitle: "Regístrate para comenzar con VantageStarter",
				actionText: "¿Ya tienes una cuenta?",
				actionLink: "Iniciar sesión",
			},
		},
	},
	pt: {
		signIn: {
			start: {
				title: "Entrar",
				subtitle: "Entre para continuar no VantageStarter",
				actionText: "Não tem uma conta?",
				actionLink: "Cadastre-se",
			},
		},
		signUp: {
			start: {
				title: "Criar conta",
				subtitle: "Cadastre-se para começar com VantageStarter",
				actionText: "Já tem uma conta?",
				actionLink: "Entrar",
			},
		},
	},
	ru: {
		signIn: {
			start: {
				title: "Вход",
				subtitle: "Войдите, чтобы продолжить в VantageStarter",
				actionText: "Нет аккаунта?",
				actionLink: "Зарегистрироваться",
			},
		},
		signUp: {
			start: {
				title: "Создать аккаунт",
				subtitle: "Зарегистрируйтесь, чтобы начать работу с VantageStarter",
				actionText: "Уже есть аккаунт?",
				actionLink: "Войти",
			},
		},
	},
};

function buildClerkLocalizations(): Record<string, LocalizationResource> {
	const result: Record<string, LocalizationResource> = {};
	const missingPacks: string[] = [];

	for (const locale of routing.locales) {
		const pack = CLERK_LOCALE_PACKS[locale];
		if (!pack) {
			missingPacks.push(locale);
			continue;
		}
		const override = brandOverrides[locale];
		result[locale] = override ? deepMerge(pack, override) : pack;
	}

	if (missingPacks.length > 0) {
		// Named loudly rather than silently falling back to English --
		// see .claude/rules/derive-never-type.md ("toute échappatoire
		// muette est interdite").
		throw new Error(
			`clerk-localization: no @clerk/localizations pack mapped for locale(s): ${missingPacks.join(
				", ",
			)}. Add an entry to CLERK_LOCALE_PACKS in i18n/clerk-localization.ts.`,
		);
	}

	return result;
}

export const clerkLocalizations: Record<string, LocalizationResource> =
	buildClerkLocalizations();

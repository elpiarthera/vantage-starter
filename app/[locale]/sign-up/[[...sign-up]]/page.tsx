"use client";

import { SignUp } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";

// See app/[locale]/sign-in/[[...sign-in]]/page.tsx for the full rationale:
// Clerk's routing="path" requires `path` to match the actual browser URL,
// and localePrefix: "as-needed" means the defaultLocale carries no prefix.
function localizedAuthPath(locale: string, page: "sign-in" | "sign-up") {
	return locale === routing.defaultLocale ? `/${page}` : `/${locale}/${page}`;
}

export default function SignUpPage() {
	const t = useTranslations("sign_up_page");
	const locale = useLocale();

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md">
				<div className="mb-6 text-center md:mb-8">
					<h1 className="mb-2 text-2xl font-bold leading-tight text-foreground md:text-3xl lg:text-4xl">
						{t("title")}
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground md:text-base">
						{t("subtitle")}
					</p>
				</div>

				<SignUp
					routing="path"
					path={localizedAuthPath(locale, "sign-up")}
					signInUrl={localizedAuthPath(locale, "sign-in")}
				/>
			</div>
		</div>
	);
}

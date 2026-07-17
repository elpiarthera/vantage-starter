"use client";

import { SignIn } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";

// With localePrefix: "as-needed", the defaultLocale carries NO url prefix,
// so the Clerk `path`/`signUpUrl` props must be derived the same way the
// middleware derives its redirect (see middleware.ts). Clerk's `routing="path"`
// mode requires the component's `path` prop to match the ACTUAL browser URL
// exactly -- on mismatch, clerk-js silently refuses to mount the widget
// (our own surrounding JSX still renders, which is why only the heading
// showed on non-default locales). Emitting "/en/sign-in" would also
// 307-loop under next-intl's "as-needed" rewrite.
function localizedAuthPath(locale: string, page: "sign-in" | "sign-up") {
	return locale === routing.defaultLocale ? `/${page}` : `/${locale}/${page}`;
}

export default function SignInPage() {
	const t = useTranslations("sign_in_page");
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

				<SignIn
					routing="path"
					path={localizedAuthPath(locale, "sign-in")}
					signUpUrl={localizedAuthPath(locale, "sign-up")}
				/>
			</div>
		</div>
	);
}

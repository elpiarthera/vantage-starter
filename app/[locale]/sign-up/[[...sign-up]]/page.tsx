"use client";

import { SignUp } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export default function SignUpPage() {
	const t = useTranslations("sign_up_page");

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

				<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
			</div>
		</div>
	);
}

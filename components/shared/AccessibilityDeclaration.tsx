import { getTranslations } from "next-intl/server";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

/**
 * Shared RGAA accessibility declaration content, rendered by both
 * `app/[locale]/accessibility/page.tsx` (canonical `/en/accessibility`) and
 * `app/[locale]/accessibilite/page.tsx` (canonical `/fr/accessibilite`).
 *
 * Both routes exist for SEO (the French RGAA declaration URL is a legal
 * convention search engines and auditors expect at `/accessibilite`) but the
 * CONTENT now resolves from the request locale via `t()` — so `/de/accessibilite`
 * renders German, not hardcoded French, closing the cross-locale mismatch the
 * two separate hardcoded pages used to produce.
 */
export async function AccessibilityDeclaration({ locale }: { locale: string }) {
	const t = await getTranslations({
		locale,
		namespace: "legal.accessibility_declaration",
	});

	return (
		<main className="max-w-3xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">
					{t("conformity_heading")}
				</h2>
				<p className="text-muted-foreground leading-relaxed">
					{t("conformity_intro")} <strong>{t("conformity_status")}</strong>{" "}
					{t("conformity_body")}
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">{t("scope_heading")}</h2>
				<p className="text-muted-foreground leading-relaxed">
					{t("scope_body")}{" "}
					<a href={BASE_URL} className="underline hover:text-foreground">
						{BASE_URL}
					</a>
					.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">
					{t("nonaccessible_heading")}
				</h2>
				<ul className="list-disc list-inside text-muted-foreground space-y-1">
					<li>{t("nonaccessible_item1")}</li>
					<li>{t("nonaccessible_item2")}</li>
				</ul>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">{t("prepared_heading")}</h2>
				<p className="text-muted-foreground leading-relaxed">
					{t("prepared_intro")}{" "}
					<time dateTime="2026-03-19">{t("prepared_date")}</time>
					{t("prepared_body")}
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">{t("feedback_heading")}</h2>
				<p className="text-muted-foreground leading-relaxed">
					{t("feedback_body")}
				</p>
				<ul className="mt-3 list-disc list-inside text-muted-foreground space-y-1">
					<li>
						{t("email_label")}{" "}
						{/* Email address literal — not a translation candidate */}
						<a
							href="mailto:support@vantagestarter.ai"
							className="underline hover:text-foreground"
						>
							support@vantagestarter.ai
						</a>
					</li>
				</ul>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">{t("recourse_heading")}</h2>
				<p className="text-muted-foreground leading-relaxed">
					{t("recourse_intro")}{" "}
					<a
						href="https://www.defenseurdesdroits.fr"
						className="underline hover:text-foreground"
						target="_blank"
						rel="noopener noreferrer"
					>
						{t("defenseur_label")}
					</a>
					.
				</p>
			</section>

			<p className="text-sm text-muted-foreground mt-12">
				{t("last_updated_label")}{" "}
				<time dateTime="2026-03-19">{t("last_updated_date")}</time>
			</p>
		</main>
	);
}

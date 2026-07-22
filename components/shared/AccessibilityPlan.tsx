import type { getTranslations } from "next-intl/server";

type AccessibilityPlanTranslator = Awaited<
	ReturnType<typeof getTranslations<"legal.accessibility_plan">>
>;

/**
 * Shared RGAA accessibility improvement plan, rendered by both
 * `app/[locale]/accessibility-plan/page.tsx` and
 * `app/[locale]/schema-accessibilite/page.tsx` — same cross-locale fix as
 * `AccessibilityDeclaration`: content resolves from the request locale.
 *
 * Synchronous Server Component: the page awaits `getTranslations` and passes
 * the resolved translator down as `t`, so this renders as JSX instead of
 * being invoked as a plain function.
 */
export function AccessibilityPlan({ t }: { t: AccessibilityPlanTranslator }) {
	const actions = [
		{ priority: "P0", issue: t("action1"), date: "Q2 2026" },
		{ priority: "P1", issue: t("action2"), date: "Q2 2026" },
		{ priority: "P1", issue: t("action3"), date: "Q3 2026" },
		{ priority: "P2", issue: t("action4"), date: "Q3 2026" },
	];

	return (
		<main className="max-w-3xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

			<p className="text-muted-foreground leading-relaxed mb-10">
				{t("description")}
			</p>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">{t("actions_heading")}</h2>
				<div className="overflow-x-auto">
					<table className="w-full text-sm border-collapse">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left py-2 pr-4 font-semibold">
									{t("priority")}
								</th>
								<th className="text-left py-2 pr-4 font-semibold">
									{t("issue")}
								</th>
								<th className="text-left py-2 pr-4 font-semibold">
									{t("target_date")}
								</th>
							</tr>
						</thead>
						<tbody className="text-muted-foreground">
							{actions.map((action) => (
								<tr key={action.issue} className="border-b border-border/50">
									<td className="py-2 pr-4">{action.priority}</td>
									<td className="py-2 pr-4">{action.issue}</td>
									<td className="py-2 pr-4">{action.date}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">{t("contact_heading")}</h2>
				<p className="text-muted-foreground leading-relaxed">
					{t("contact_intro")}{" "}
					{/* Email address literal — not a translation candidate */}
					<a
						href="mailto:support@vantagestarter.ai"
						className="underline hover:text-foreground"
					>
						support@vantagestarter.ai
					</a>
				</p>
			</section>

			<p className="text-sm text-muted-foreground mt-12">
				{t("last_updated_label")}{" "}
				<time dateTime="2026-03-19">{t("last_updated_date")}</time>
			</p>
		</main>
	);
}

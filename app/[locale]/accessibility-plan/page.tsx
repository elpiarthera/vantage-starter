import type { Metadata } from "next";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

export const metadata: Metadata = {
	title: "Accessibility Improvement Plan",
	description:
		"VantageStarter accessibility improvement roadmap — planned RGAA 4.1.2 fixes and timeline.",
	alternates: {
		canonical: `${BASE_URL}/en/accessibility-plan`,
		languages: {
			en: `${BASE_URL}/en/accessibility-plan`,
			fr: `${BASE_URL}/fr/schema-accessibilite`,
		},
	},
	robots: { index: true, follow: true },
};

export default function AccessibilityPlanPage() {
	return (
		<main className="max-w-3xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-8">
				Accessibility Improvement Plan
			</h1>

			<p className="text-muted-foreground leading-relaxed mb-10">
				This plan describes the actions planned to improve the accessibility of
				VantageStarter in line with RGAA 4.1.2.
			</p>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">2026 Actions</h2>
				<div className="overflow-x-auto">
					<table className="w-full text-sm border-collapse">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left py-2 pr-4 font-semibold">Priority</th>
								<th className="text-left py-2 pr-4 font-semibold">Issue</th>
								<th className="text-left py-2 pr-4 font-semibold">
									Target date
								</th>
							</tr>
						</thead>
						<tbody className="text-muted-foreground">
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">P0</td>
								<td className="py-2 pr-4">
									Complete ARIA labelling on all interactive components
								</td>
								<td className="py-2 pr-4">Q2 2026</td>
							</tr>
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">P1</td>
								<td className="py-2 pr-4">
									Improve keyboard navigation in dashboard views
								</td>
								<td className="py-2 pr-4">Q2 2026</td>
							</tr>
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">P1</td>
								<td className="py-2 pr-4">
									Audit and fix colour contrast ratios (WCAG 1.4.3)
								</td>
								<td className="py-2 pr-4">Q3 2026</td>
							</tr>
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">P2</td>
								<td className="py-2 pr-4">
									Add skip-to-content link on all public pages
								</td>
								<td className="py-2 pr-4">Q3 2026</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">Contact</h2>
				<p className="text-muted-foreground leading-relaxed">
					Questions about this plan:{" "}
					<a
						href="mailto:support@vantagestarter.ai"
						className="underline hover:text-foreground"
					>
						support@vantagestarter.ai
					</a>
				</p>
			</section>

			<p className="text-sm text-muted-foreground mt-12">
				Last updated: <time dateTime="2026-03-19">19 March 2026</time>
			</p>
		</main>
	);
}

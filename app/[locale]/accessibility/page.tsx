import type { Metadata } from "next";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

export const metadata: Metadata = {
	title: "Accessibility Declaration",
	description:
		"Accessibility declaration for VantageStarter — RGAA 4.1.2 conformity status.",
	alternates: {
		canonical: `${BASE_URL}/en/accessibility`,
		languages: {
			en: `${BASE_URL}/en/accessibility`,
			fr: `${BASE_URL}/fr/accessibilite`,
		},
	},
	robots: { index: true, follow: true },
};

export default function AccessibilityDeclarationPage() {
	return (
		<main className="max-w-3xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-8">Accessibility Declaration</h1>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">Conformity Status</h2>
				<p className="text-muted-foreground leading-relaxed">
					VantageStarter is <strong>partially compliant</strong> with the RGAA
					4.1.2 standard (Référentiel Général d&apos;Amélioration de
					l&apos;Accessibilité).
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">Scope</h2>
				<p className="text-muted-foreground leading-relaxed">
					This declaration applies to VantageStarter at{" "}
					<a href={BASE_URL} className="underline hover:text-foreground">
						{BASE_URL}
					</a>
					.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">Non-Accessible Content</h2>
				<ul className="list-disc list-inside text-muted-foreground space-y-1">
					<li>
						Third-party embedded content (Clerk authentication forms) may not
						fully conform to RGAA 4.1.2.
					</li>
					<li>
						Some dynamically generated content may have incomplete ARIA
						attributes.
					</li>
				</ul>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">
					Preparation of This Declaration
				</h2>
				<p className="text-muted-foreground leading-relaxed">
					This declaration was prepared on{" "}
					<time dateTime="2026-03-19">19 March 2026</time>. It is based on a
					self-assessment carried out by VantageStarter.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">Feedback and Contact</h2>
				<p className="text-muted-foreground leading-relaxed">
					If you encounter any accessibility barrier, please contact us so we
					can provide an accessible alternative or fix the issue:
				</p>
				<ul className="mt-3 list-disc list-inside text-muted-foreground space-y-1">
					<li>
						Email:{" "}
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
				<h2 className="text-xl font-semibold mb-3">Recourse</h2>
				<p className="text-muted-foreground leading-relaxed">
					If you do not receive a satisfactory response within 30 days, you may
					refer the matter to the{" "}
					<a
						href="https://www.defenseurdesdroits.fr"
						className="underline hover:text-foreground"
						target="_blank"
						rel="noopener noreferrer"
					>
						Défenseur des droits
					</a>
					.
				</p>
			</section>

			<p className="text-sm text-muted-foreground mt-12">
				Last updated: <time dateTime="2026-03-19">19 March 2026</time>
			</p>
		</main>
	);
}

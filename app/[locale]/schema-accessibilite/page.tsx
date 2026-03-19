import type { Metadata } from "next";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

export const metadata: Metadata = {
	title: "Schéma pluriannuel d'accessibilité",
	description:
		"Schéma pluriannuel d'amélioration de l'accessibilité de VantageStarter — conformité RGAA 4.1.2.",
	alternates: {
		canonical: `${BASE_URL}/fr/schema-accessibilite`,
		languages: {
			fr: `${BASE_URL}/fr/schema-accessibilite`,
			en: `${BASE_URL}/en/accessibility-plan`,
		},
	},
	robots: { index: true, follow: true },
};

export default function SchemaAccessibilitePage() {
	return (
		<main className="max-w-3xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-8">
				Schéma pluriannuel d&apos;amélioration de l&apos;accessibilité
			</h1>

			<p className="text-muted-foreground leading-relaxed mb-10">
				Ce schéma décrit les actions planifiées pour améliorer
				l&apos;accessibilité de VantageStarter, conformément au RGAA 4.1.2.
			</p>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">Actions 2026</h2>
				<div className="overflow-x-auto">
					<table className="w-full text-sm border-collapse">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left py-2 pr-4 font-semibold">Priorité</th>
								<th className="text-left py-2 pr-4 font-semibold">Problème</th>
								<th className="text-left py-2 pr-4 font-semibold">Échéance</th>
							</tr>
						</thead>
						<tbody className="text-muted-foreground">
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">P0</td>
								<td className="py-2 pr-4">
									Compléter l&apos;étiquetage ARIA sur tous les composants
									interactifs
								</td>
								<td className="py-2 pr-4">T2 2026</td>
							</tr>
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">P1</td>
								<td className="py-2 pr-4">
									Améliorer la navigation au clavier dans les vues tableau de
									bord
								</td>
								<td className="py-2 pr-4">T2 2026</td>
							</tr>
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">P1</td>
								<td className="py-2 pr-4">
									Auditer et corriger les ratios de contraste des couleurs (WCAG
									1.4.3)
								</td>
								<td className="py-2 pr-4">T3 2026</td>
							</tr>
							<tr className="border-b border-border/50">
								<td className="py-2 pr-4">P2</td>
								<td className="py-2 pr-4">
									Ajouter un lien « Aller au contenu » sur toutes les pages
									publiques
								</td>
								<td className="py-2 pr-4">T3 2026</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">Contact</h2>
				<p className="text-muted-foreground leading-relaxed">
					Questions relatives à ce schéma :{" "}
					<a
						href="mailto:support@vantagestarter.ai"
						className="underline hover:text-foreground"
					>
						support@vantagestarter.ai
					</a>
				</p>
			</section>

			<p className="text-sm text-muted-foreground mt-12">
				Dernière mise à jour : <time dateTime="2026-03-19">19 mars 2026</time>
			</p>
		</main>
	);
}

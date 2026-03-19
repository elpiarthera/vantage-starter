import type { Metadata } from "next";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

export const metadata: Metadata = {
	title: "Déclaration d'accessibilité",
	description:
		"Déclaration d'accessibilité de VantageStarter — conformité RGAA 4.1.2.",
	alternates: {
		canonical: `${BASE_URL}/fr/accessibilite`,
		languages: {
			fr: `${BASE_URL}/fr/accessibilite`,
			en: `${BASE_URL}/en/accessibility`,
		},
	},
	robots: { index: true, follow: true },
};

export default function DeclarationAccessibilitePage() {
	return (
		<main className="max-w-3xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-8">
				Déclaration d&apos;accessibilité
			</h1>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">État de conformité</h2>
				<p className="text-muted-foreground leading-relaxed">
					VantageStarter est <strong>partiellement conforme</strong> au
					référentiel général d&apos;amélioration de l&apos;accessibilité (RGAA)
					version 4.1.2.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">Périmètre</h2>
				<p className="text-muted-foreground leading-relaxed">
					Cette déclaration s&apos;applique à VantageStarter à l&apos;adresse{" "}
					<a href={BASE_URL} className="underline hover:text-foreground">
						{BASE_URL}
					</a>
					.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">Contenus non accessibles</h2>
				<ul className="list-disc list-inside text-muted-foreground space-y-1">
					<li>
						Les contenus intégrés de tiers (formulaires d&apos;authentification
						Clerk) peuvent ne pas être pleinement conformes au RGAA 4.1.2.
					</li>
					<li>
						Certains contenus générés dynamiquement peuvent avoir des attributs
						ARIA incomplets.
					</li>
				</ul>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">
					Établissement de cette déclaration
				</h2>
				<p className="text-muted-foreground leading-relaxed">
					Cette déclaration a été établie le{" "}
					<time dateTime="2026-03-19">19 mars 2026</time>. Elle est fondée sur
					une auto-évaluation réalisée par VantageStarter.
				</p>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-3">
					Retour d&apos;information et contact
				</h2>
				<p className="text-muted-foreground leading-relaxed">
					Si vous rencontrez un obstacle d&apos;accessibilité, veuillez nous
					contacter afin que nous puissions vous proposer une alternative
					accessible ou corriger le problème :
				</p>
				<ul className="mt-3 list-disc list-inside text-muted-foreground space-y-1">
					<li>
						Courriel :{" "}
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
				<h2 className="text-xl font-semibold mb-3">Voies de recours</h2>
				<p className="text-muted-foreground leading-relaxed">
					Si vous ne recevez pas de réponse satisfaisante dans un délai de 30
					jours, vous pouvez saisir le{" "}
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
				Dernière mise à jour : <time dateTime="2026-03-19">19 mars 2026</time>
			</p>
		</main>
	);
}

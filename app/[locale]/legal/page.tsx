import { Link } from "@/i18n/routing";

export default function LegalPage() {
	return (
		<main className="min-h-screen bg-background">
			<div className="max-w-3xl mx-auto px-6 py-20">
				<Link
					href="/"
					className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-8 inline-block"
				>
					&larr; Back to home
				</Link>
				<h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground mb-6">
					Legal Notice
				</h1>
				<p className="text-muted-foreground text-sm mb-8">
					Last updated: March 2026
				</p>
				<div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
					<p>
						This is a placeholder legal notice for VantageStarter. Replace this
						content with your actual legal information (SIRET, company address,
						hosting provider) before launching.
					</p>
					<h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
						Publisher
					</h2>
					<p>
						ElPi Corp — [YOUR_COMPANY_ADDRESS]
						<br />
						SIRET: [YOUR_SIRET]
					</p>
					<h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
						Hosting
					</h2>
					<p>
						Hosted on Vercel, Inc. — 340 Pine Street, Suite 400, San Francisco, CA
						94104, USA.
					</p>
					<h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
						Contact
					</h2>
					<p>
						<a
							href="mailto:[YOUR_SUPPORT_EMAIL]"
							className="text-primary hover:underline"
						>
							[YOUR_SUPPORT_EMAIL]
						</a>
					</p>
				</div>
			</div>
		</main>
	);
}

export async function generateMetadata() {
	return {
		title: "Legal Notice",
		description: "VantageStarter legal notice and company information.",
	};
}

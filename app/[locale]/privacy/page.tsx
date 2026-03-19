import { Link } from "@/i18n/routing";

export default function PrivacyPage() {
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
					Privacy Policy
				</h1>
				<p className="text-muted-foreground text-sm mb-8">
					Last updated: March 2026
				</p>
				<div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
					<p>
						This is a placeholder privacy policy for VantageStarter. Replace this
						content with your actual privacy policy before launching.
					</p>
					<h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
						Data we collect
					</h2>
					<p>
						VantageStarter collects only the data necessary to provide the service:
						account information, usage data, and payment information handled by
						Polar.sh.
					</p>
					<h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
						Contact
					</h2>
					<p>
						For privacy-related questions, contact{" "}
						<a
							href="mailto:[YOUR_SUPPORT_EMAIL]"
							className="text-primary hover:underline"
						>
							[YOUR_SUPPORT_EMAIL]
						</a>
						.
					</p>
				</div>
			</div>
		</main>
	);
}

export async function generateMetadata() {
	return {
		title: "Privacy Policy",
		description: "VantageStarter privacy policy.",
	};
}

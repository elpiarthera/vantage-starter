import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

type Props = {
	params: Promise<{ locale: string }>;
};

export default async function PrivacyPage({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "legal.privacy" });

	return (
		<main className="min-h-screen bg-background">
			<div className="max-w-3xl mx-auto px-6 py-20">
				<Link
					href={ROUTES.home}
					className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-8 inline-block"
				>
					{t("back_home")}
				</Link>
				<h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground mb-6">
					{t("title")}
				</h1>
				<p className="text-muted-foreground text-sm mb-8">
					{t("last_updated")}
				</p>
				<div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
					<p>{t("placeholder_notice")}</p>
					<h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
						{t("data_heading")}
					</h2>
					<p>{t("data_body")}</p>
					<h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
						{t("contact_heading")}
					</h2>
					<p>
						{t("contact_intro")}{" "}
						{/* Template placeholder for the site operator to fill in — a value,
						not translatable content, identical by design across every locale. */}
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

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "legal.privacy" });
	return {
		title: t("title"),
		description: "VantageStarter privacy policy.",
	};
}

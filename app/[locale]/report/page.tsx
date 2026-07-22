import { getTranslations } from "next-intl/server";
import { IssueReportFormSection } from "@/components/report/IssueReportFormSection";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "report" });
	return {
		title: t("meta_title"),
		description: t("meta_description"),
	};
}

export default async function ReportPage({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "report" });

	return (
		<main className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
			<div className="w-full max-w-xl">
				<Link
					href={ROUTES.home}
					className="mb-8 inline-block text-muted-foreground text-sm transition-colors duration-150 hover:text-foreground"
				>
					{t("back_home")}
				</Link>
			</div>
			<IssueReportFormSection />
		</main>
	);
}

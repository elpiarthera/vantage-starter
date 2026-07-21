"use client";

import { useTranslations } from "next-intl";
import { Customizer } from "@/components/design-system/customizer";

// NuqsAdapter + DesignSystemProvider are mounted once, above the whole
// dashboard, by app/[locale]/dashboard/layout.tsx (via
// DashboardDesignSystemMount) — see that provider's comment for why a
// second mount here would tear down the app-wide theme on route change
// (Day defect #3). The Customizer below reads/writes the same nuqs-backed
// useDesignSystem() state that provider reacts to, so live editing still
// works unchanged.
export default function ConfiguratorPage() {
	const t = useTranslations("configurator");
	return (
		<div className="flex min-h-screen flex-col gap-8 p-6 md:p-10">
			<header>
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					{t("title")}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
			</header>

			<div className="flex flex-col gap-6 md:flex-row md:items-start">
				{/* Sidebar: picker panel */}
				<Customizer className="shrink-0 md:sticky md:top-6" />

				{/* Preview area */}
				<div className="flex flex-1 flex-col gap-4">
					<div className="rounded-xl border border-border bg-card p-6">
						<h2 className="mb-3 text-lg font-medium text-foreground">
							{t("preview_heading")}
						</h2>
						<p className="text-sm text-muted-foreground">
							{t("preview_description")}
						</p>
					</div>

					{/* Color swatches preview */}
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{[
							{
								label: t("swatch_background"),
								cls: "bg-background border border-border",
							},
							{
								label: t("swatch_card"),
								cls: "bg-card border border-border",
							},
							{ label: t("swatch_primary"), cls: "bg-primary" },
							{ label: t("swatch_secondary"), cls: "bg-secondary" },
							{ label: t("swatch_muted"), cls: "bg-muted" },
							{ label: t("swatch_accent"), cls: "bg-accent" },
							{ label: t("swatch_chart1"), cls: "bg-chart-1" },
							{ label: t("swatch_chart2"), cls: "bg-chart-2" },
						].map(({ label, cls }) => (
							<div key={label} className="flex flex-col gap-1.5">
								<div className={`h-12 rounded-lg ${cls}`} />
								<span className="text-xs text-muted-foreground">{label}</span>
							</div>
						))}
					</div>

					{/* Button examples */}
					<div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-6">
						<button
							type="button"
							className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
						>
							{t("button_primary")}
						</button>
						<button
							type="button"
							className="rounded-[var(--radius)] bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90 transition-opacity"
						>
							{t("button_secondary")}
						</button>
						<button
							type="button"
							className="rounded-[var(--radius)] border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
						>
							{t("button_outline")}
						</button>
						<button
							type="button"
							className="rounded-[var(--radius)] bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
						>
							{t("button_ghost")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

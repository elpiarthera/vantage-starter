"use client";

import { Customizer } from "@/components/design-system/customizer";
import { DesignSystemProvider } from "@/providers/DesignSystemProvider";

export default function DesignPage() {
	return (
		<DesignSystemProvider>
			<div className="flex min-h-screen flex-col gap-8 p-6 md:p-10">
				<header>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Design Configurator
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Customize the look and feel of your application. Changes are
						reflected in real time.
					</p>
				</header>

				<div className="flex flex-col gap-6 md:flex-row md:items-start">
					{/* Sidebar: picker panel */}
					<Customizer className="shrink-0 md:sticky md:top-6" />

					{/* Preview area */}
					<div className="flex flex-1 flex-col gap-4">
						<div className="rounded-xl border border-border bg-card p-6">
							<h2 className="mb-3 text-lg font-medium text-foreground">
								Preview
							</h2>
							<p className="text-sm text-muted-foreground">
								Your design system tokens are applied live. Switch style, base
								color, font, and radius to see changes across all components.
							</p>
						</div>

						{/* Color swatches preview */}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							{[
								{
									label: "Background",
									cls: "bg-background border border-border",
								},
								{ label: "Card", cls: "bg-card border border-border" },
								{ label: "Primary", cls: "bg-primary" },
								{ label: "Secondary", cls: "bg-secondary" },
								{ label: "Muted", cls: "bg-muted" },
								{ label: "Accent", cls: "bg-accent" },
								{ label: "Chart 1", cls: "bg-chart-1" },
								{ label: "Chart 2", cls: "bg-chart-2" },
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
								className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
							>
								Primary
							</button>
							<button
								type="button"
								className="rounded-[var(--radius)] bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-90"
							>
								Secondary
							</button>
							<button
								type="button"
								className="rounded-[var(--radius)] border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
							>
								Outline
							</button>
							<button
								type="button"
								className="rounded-[var(--radius)] bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
							>
								Ghost
							</button>
						</div>
					</div>
				</div>
			</div>
		</DesignSystemProvider>
	);
}

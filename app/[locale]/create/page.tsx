"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Customizer } from "@/components/create/customizer";
import { DesignSystemProvider } from "@/components/create/design-system-provider";

export default function CreatePage() {
	return (
		<NuqsAdapter>
			<DesignSystemProvider>
				<CreatePageContent />
			</DesignSystemProvider>
		</NuqsAdapter>
	);
}

function CreatePageContent() {
	return (
		<div className="flex min-h-screen bg-background">
			{/* Sidebar customizer */}
			<aside className="hidden md:flex md:w-72 md:shrink-0 md:flex-col md:border-r md:border-border md:p-4">
				<Customizer />
			</aside>

			{/* Main preview area */}
			<main className="flex flex-1 flex-col">
				{/* Mobile: horizontal scrolling pickers at bottom */}
				<div className="md:hidden border-b border-border bg-background/80 backdrop-blur-sm p-3">
					<Customizer />
				</div>

				<div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
					<div className="max-w-2xl w-full space-y-6">
						<div className="space-y-2">
							<h1 className="text-3xl font-bold tracking-tight text-foreground">
								Design System
							</h1>
							<p className="text-muted-foreground">
								Customize your design system. Changes update in real-time via
								URL params.
							</p>
						</div>

						{/* Preview cards */}
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="rounded-[var(--radius)] border border-border bg-card p-6 space-y-3">
								<div className="h-2 w-24 rounded-full bg-primary" />
								<div className="h-2 w-full rounded-full bg-muted" />
								<div className="h-2 w-3/4 rounded-full bg-muted" />
								<div className="mt-4 flex gap-2">
									<button
										type="button"
										className="inline-flex h-9 items-center justify-center rounded-[var(--radius)] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
									>
										Primary
									</button>
									<button
										type="button"
										className="inline-flex h-9 items-center justify-center rounded-[var(--radius)] border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
									>
										Outline
									</button>
								</div>
							</div>

							<div className="rounded-[var(--radius)] border border-border bg-card p-6 space-y-3">
								<div className="text-sm font-medium text-card-foreground">
									Card title
								</div>
								<div className="text-xs text-muted-foreground">
									This is a preview of your design system tokens applied to real
									components.
								</div>
								<div className="flex items-center gap-2">
									<div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
										<div className="h-4 w-4 rounded-full bg-primary" />
									</div>
									<div className="space-y-1">
										<div className="h-2 w-20 rounded-full bg-foreground/20" />
										<div className="h-2 w-14 rounded-full bg-muted-foreground/20" />
									</div>
								</div>
							</div>

							<div className="rounded-[var(--radius)] border border-border bg-muted/50 p-6 col-span-full space-y-3">
								<div className="flex items-center justify-between">
									<div className="text-sm font-medium text-foreground">
										Color Tokens
									</div>
									<div className="text-xs text-muted-foreground">OKLCH</div>
								</div>
								<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
									{[
										"bg-primary",
										"bg-primary/80",
										"bg-secondary",
										"bg-accent",
										"bg-muted",
										"bg-border",
										"bg-card",
										"bg-background",
									].map((color) => (
										<div
											key={color}
											className={`h-8 rounded-[calc(var(--radius)/2)] ${color} border border-border/50`}
											title={color}
										/>
									))}
								</div>
							</div>
						</div>

						{/* Radius preview */}
						<div className="space-y-2">
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
								Border Radius — var(--radius)
							</p>
							<div className="flex items-end gap-3">
								{["w-8 h-8", "w-12 h-12", "w-16 h-16", "w-20 h-20"].map(
									(size) => (
										<div
											key={size}
											className={`${size} rounded-[var(--radius)] bg-primary/20 border-2 border-primary/40`}
										/>
									),
								)}
							</div>
						</div>

						{/* Typography preview */}
						<div className="space-y-2">
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
								Typography
							</p>
							<div className="space-y-1">
								<p className="text-2xl font-bold text-foreground">
									The quick brown fox
								</p>
								<p className="text-base text-muted-foreground">
									Jumps over the lazy dog — 0123456789
								</p>
								<p className="font-mono text-sm text-muted-foreground">
									const hello = "world"
								</p>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/routing";

function useRevealOnScroll(
	ref: React.RefObject<HTMLElement | null>,
	delay = 0,
) {
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			el.style.opacity = "1";
			el.style.transform = "none";
			return;
		}

		el.classList.add("reveal");
		if (delay > 0) {
			el.style.transitionDelay = `${delay}s`;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.classList.add("revealed");
					observer.disconnect();
				}
			},
			{ threshold: 0.2 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [ref, delay]);
}

export function CTASection() {
	const t = useTranslations("landing.cta");
	const [copied, setCopied] = useState(false);
	const command = "npx create-vantage-app my-saas";

	const eyebrowRef = useRef<HTMLParagraphElement>(null);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const sublineRef = useRef<HTMLParagraphElement>(null);
	const ctasRef = useRef<HTMLDivElement>(null);
	const terminalRef = useRef<HTMLDivElement>(null);

	useRevealOnScroll(eyebrowRef as React.RefObject<HTMLElement | null>);
	useRevealOnScroll(headingRef as React.RefObject<HTMLElement | null>, 0.05);
	useRevealOnScroll(sublineRef as React.RefObject<HTMLElement | null>, 0.1);
	useRevealOnScroll(ctasRef as React.RefObject<HTMLElement | null>, 0.15);
	useRevealOnScroll(terminalRef as React.RefObject<HTMLElement | null>, 0.2);

	function handleCopy() {
		navigator.clipboard.writeText(command).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1800);
		});
	}

	return (
		<section
			id="get-started"
			aria-labelledby="cta-heading"
			className="relative py-24 md:py-32 overflow-hidden"
		>
			{/* Grid pattern background */}
			<div
				className="pointer-events-none absolute inset-0 grid-pattern opacity-50"
				aria-hidden="true"
			/>

			{/* Gradient overlay — fades background in/out */}
			<div
				className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-background"
				aria-hidden="true"
			/>

			{/* Decorative floating blobs */}
			<div
				className="pointer-events-none absolute -left-48 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-muted opacity-40 blur-3xl animate-[pulse_20s_ease-in-out_infinite]"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute -right-48 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-muted opacity-40 blur-3xl animate-[pulse_25s_ease-in-out_infinite_5s]"
				aria-hidden="true"
			/>

			<div className="relative mx-auto max-w-6xl px-6 lg:px-12">
				<div className="text-center">
					{/* Eyebrow */}
					<p
						ref={eyebrowRef}
						className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground"
					>
						{t("eyebrow")}
					</p>

					{/* Heading */}
					<h2
						id="cta-heading"
						ref={headingRef}
						className="mb-6 text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl lg:text-5xl"
					>
						{t("heading")}
					</h2>

					{/* Subline */}
					<p
						ref={sublineRef}
						className="mx-auto mb-12 max-w-xl text-lg text-muted-foreground leading-relaxed"
					>
						{t("subline")}
					</p>

					{/* CTA buttons */}
					<div
						ref={ctasRef}
						className="flex flex-col items-center justify-center gap-4 sm:flex-row"
					>
						<Link href="/sign-up">
							<ui-button variant="primary" size="lg">
								{t("cta_primary")}
								<span slot="icon-end" className="flex items-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
										className="w-4 h-4"
									>
										<path d="M5 12h14" />
										<path d="m12 5 7 7-7 7" />
									</svg>
								</span>
							</ui-button>
						</Link>

						<a
							href="https://github.com/vantage-starter"
							target="_blank"
							rel="noopener noreferrer"
						>
							<ui-button variant="outline" size="lg">
								<span slot="icon-start">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="currentColor"
										aria-hidden="true"
									>
										<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
									</svg>
								</span>
								{t("cta_secondary")}
							</ui-button>
						</a>
					</div>

					{/* Terminal command */}
					<div ref={terminalRef} className="mt-14">
						<p className="mb-4 text-sm font-medium text-muted-foreground">
							{t("quick_label")}
						</p>
						<div className="inline-flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-3 shadow-sm transition-all hover:shadow-md hover:border-border/60">
							<code className="font-mono text-sm">
								<span className="text-muted-foreground/60" aria-hidden="true">
									$
								</span>{" "}
								<span className="font-semibold text-foreground">npx</span>{" "}
								<span className="text-muted-foreground">
									create-vantage-app my-saas
								</span>
							</code>
							<button
								type="button"
								onClick={handleCopy}
								aria-label={copied ? t("copied") : t("copy_command")}
								className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
							>
								{copied ? (
									<>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											aria-hidden="true"
										>
											<path d="M20 6 9 17l-5-5" />
										</svg>
										{t("copied")}
									</>
								) : (
									<>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											aria-hidden="true"
										>
											<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
											<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
										</svg>
										{t("copy")}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

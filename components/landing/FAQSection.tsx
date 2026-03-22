"use client";

import { useTranslations } from "next-intl";

const FAQ_KEYS = [
	"q1",
	"q2",
	"q3",
	"q4",
	"q5",
	"q6",
	"q7",
	"q8",
	"q9",
	"q10",
	"q11",
	"q12",
	"q13",
	"q14",
	"q15",
];

export function FAQSection() {
	const t = useTranslations("landing.faq");

	return (
		<section id="faq" aria-labelledby="faq-heading" className="py-24 md:py-32">
			<div className="max-w-6xl mx-auto px-6 lg:px-12">
				<div className="max-w-3xl">
					<h2
						id="faq-heading"
						className="font-heading font-bold text-foreground text-3xl md:text-4xl leading-[1.15] tracking-[-0.03em] mb-10"
					>
						{t("heading")}
					</h2>

					<lui-accordion collapsible class="w-full border-t border-border">
						{FAQ_KEYS.map((key) => (
							<lui-accordion-item key={key} class="border-b border-border">
								<span
									slot="header"
									className="font-medium text-foreground text-sm"
								>
									{t(`${key}_q`)}
								</span>
								<p className="text-sm text-muted-foreground leading-relaxed pb-5">
									{t(`${key}_a`)}
								</p>
							</lui-accordion-item>
						))}
					</lui-accordion>
				</div>
			</div>
		</section>
	);
}

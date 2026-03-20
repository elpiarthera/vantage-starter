"use client";

import { useTranslations } from "next-intl";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

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
		<section
			id="faq"
			aria-labelledby="faq-heading"
			className="py-24"
		>
			<div className="max-w-6xl mx-auto px-6 lg:px-12">
				<div className="max-w-3xl">
					<h2
						id="faq-heading"
						className="font-heading font-bold text-foreground text-3xl md:text-4xl leading-[1.15] tracking-[-0.02em] mb-10"
					>
						{t("heading")}
					</h2>

					<Accordion type="single" collapsible className="w-full">
						{FAQ_KEYS.map((key) => (
							<AccordionItem
								key={key}
								value={key}
								className="border-b border-border"
							>
								<AccordionTrigger className="text-left font-medium text-foreground text-sm py-5 hover:no-underline hover:text-foreground [&[data-state=open]]:text-foreground transition-colors duration-150 ease-out">
									{t(`${key}_q`)}
								</AccordionTrigger>
								<AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
									{t(`${key}_a`)}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</section>
	);
}

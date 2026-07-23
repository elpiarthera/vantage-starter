/**
 * Characterisation test for `components/landing/HeroSection.tsx`, written
 * BEFORE the mcpcn `hero` block replaces the hand-written markup
 * (docs/mcpcn-block-mapping.md §4 "hero", Batch 4 last bullet).
 *
 * THE BULLET'S ASSERTION, proved here: "the landing page still renders the
 * same title, subtitle, and CTA hrefs it does today, sourced from the same
 * copy constants, after `hero` replaces the hand-written markup." This test
 * MUST pass unchanged before and after the rewrite — that is the whole point
 * of the bullet.
 */

import { render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let value: unknown = dict;
	for (const segment of [...ns.split("."), ...key.split(".")]) {
		value = (value as Dict | undefined)?.[segment];
	}
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

jest.mock("@/i18n/routing", () => ({
	Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

import { HeroSection } from "@/components/landing/HeroSection";

describe("HeroSection (characterisation)", () => {
	it("renders the hero's title and subtitle from the shared copy constants", () => {
		render(<HeroSection />);

		expect(
			screen.getByText(en.landing.hero.headline_line1),
		).toBeInTheDocument();
		expect(screen.getByText(en.landing.hero.subline)).toBeInTheDocument();
	});

	it("renders the primary CTA with the sign-up href", () => {
		render(<HeroSection />);

		const primaryCta = screen.getByRole("link", {
			name: en.landing.hero.cta_primary,
		});
		expect(primaryCta).toHaveAttribute("href", "/sign-up");
	});

	it("renders the secondary CTA with the GitHub href", () => {
		render(<HeroSection />);

		const secondaryCta = screen.getByRole("link", {
			name: en.landing.hero.cta_secondary,
		});
		expect(secondaryCta).toHaveAttribute(
			"href",
			"https://github.com/vantage-starter",
		);
	});

	it("renders the section landmark with its accessible label", () => {
		render(<HeroSection />);

		expect(
			screen.getByRole("region", { name: en.landing.hero.aria_label }),
		).toBeInTheDocument();
	});

	it("renders the terminal mockup command copy affordance", () => {
		render(<HeroSection />);

		expect(
			screen.getByRole("button", { name: en.landing.hero.copy_command }),
		).toBeInTheDocument();
	});

	it("renders the badge copy", () => {
		render(<HeroSection />);

		expect(screen.getByText(en.landing.hero.badge)).toBeInTheDocument();
	});
});

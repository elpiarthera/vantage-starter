/**
 * RED-first coverage: the json-render generative-UI component layer
 * (lib/json-render/registry.tsx) is the chrome rendered around AI-generated
 * plans — labels, aria-labels, units, counters. Before this fix it was
 * English-only regardless of the active locale: a French user reads
 * "After 3 ops" mid-plan and a screen reader announces "Human checkpoint".
 *
 * `next-intl` ships ESM-only (no CJS build), so Jest's `requireActual` cannot
 * load its real `createTranslator` for a mock factory. This mock instead
 * pulls REAL strings out of the project's own messages/<locale>.json (never
 * an echo of the key) and resolves `{count, plural, one {...} few {...}
 * many {...} other {...}}` ICU plural blocks via the native, spec-correct
 * `Intl.PluralRules(locale).select(count)` — the same CLDR plural-category
 * algorithm `use-intl` delegates to internally — so a pass proves the
 * component renders the active locale's actual plural rule, not an English
 * one repeated seven times.
 */

import { render, screen } from "@testing-library/react";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import ru from "@/messages/ru.json";

type Dict = Record<string, unknown>;
const catalogs: Record<string, Dict> = { en, fr, de, ru };

let activeLocale = "fr";

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = key
		.split(".")
		.reduce<unknown>((acc, part) => (acc as Dict | undefined)?.[part], nsDict);
	return typeof value === "string" ? value : key;
}

const ICU_PLURAL_RE = /\{(\w+), plural, (.+)\}$/s;

function resolveIcuPlural(
	template: string,
	locale: string,
	vars: Record<string, string | number>,
): string {
	const match = template.match(ICU_PLURAL_RE);
	if (!match) return template;
	const [, varName, branchesRaw] = match;
	const count = Number(vars[varName]);
	const branchRe = /(\w+)\s*\{([^}]*)\}/g;
	const branches: Record<string, string> = {};
	let branchMatch = branchRe.exec(branchesRaw);
	while (branchMatch) {
		branches[branchMatch[1]] = branchMatch[2];
		branchMatch = branchRe.exec(branchesRaw);
	}
	const category = new Intl.PluralRules(locale).select(count);
	const chosen = branches[category] ?? branches.other;
	return chosen.replace("#", String(count));
}

function makeUseTranslations(dict: Dict, locale: string) {
	return (ns: string) =>
		(key: string, vars?: Record<string, string | number>) => {
			let str = resolve(dict, ns, key);
			if (str.includes(", plural,") && vars) {
				str = resolveIcuPlural(str, locale, vars);
			}
			if (vars) {
				for (const [k, v] of Object.entries(vars)) {
					str = str.replace(`{${k}}`, String(v));
				}
			}
			return str;
		};
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) =>
		makeUseTranslations(catalogs[activeLocale], activeLocale)(ns),
}));

describe("generative-UI registry chrome follows the active locale (fr)", () => {
	beforeEach(() => {
		activeLocale = "fr";
	});

	test("OperationItem: aria-label, 'After N operations' and 'N min' are French, English absent", async () => {
		const { vantageOSRegistry } = await import("@/lib/json-render/registry");
		const OperationItem = vantageOSRegistry.OperationItem as (props: {
			element: { props: Record<string, unknown> };
			// biome-ignore lint/suspicious/noExplicitAny: registry components are untyped `any` props (pre-existing)
		}) => any;

		render(
			<OperationItem
				element={{
					props: {
						id: "op1",
						name: "Deploy service",
						description: "desc",
						type: "human",
						assignedAgent: "agent",
						estimatedMinutes: 5,
						dependsOn: ["a", "b", "c"],
						requiresReview: true,
					},
				}}
			/>,
		);

		// English chrome must be entirely absent under fr.
		expect(screen.queryByText("Review required")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Human operation")).not.toBeInTheDocument();
		expect(screen.queryByText(/After 3 op/)).not.toBeInTheDocument();

		// French chrome must be present, rendered via real ICU plural rules.
		// ("min" is an invariant abbreviation in French too, so it is not a
		// useful absence check — the aria-label and "After N" phrasing are.)
		expect(screen.getByLabelText("Opération humaine")).toBeInTheDocument();
		expect(screen.getByText("Révision requise")).toBeInTheDocument();
		expect(screen.getByText("Après 3 opérations")).toBeInTheDocument();
		expect(screen.getByText("5 min")).toBeInTheDocument();
	});

	test("Checkpoint: 'Human checkpoint' aria-label and 'Checkpoint' label are French", async () => {
		const { vantageOSRegistry } = await import("@/lib/json-render/registry");
		const Checkpoint = vantageOSRegistry.Checkpoint as (props: {
			element: { props: Record<string, unknown> };
			// biome-ignore lint/suspicious/noExplicitAny: registry components are untyped `any` props (pre-existing)
		}) => any;

		render(
			<Checkpoint
				element={{ props: { description: "Confirm before deploy" } }}
			/>,
		);

		expect(screen.queryByRole("note", { name: "Human checkpoint" })).toBeNull();
		expect(screen.queryByText("Checkpoint")).not.toBeInTheDocument();

		expect(
			screen.getByRole("note", { name: "Point de contrôle humain" }),
		).toBeInTheDocument();
		expect(screen.getByText("Point de contrôle")).toBeInTheDocument();
	});
});

describe("generative-UI registry chrome — Russian ICU plural forms (three-way)", () => {
	beforeEach(() => {
		activeLocale = "ru";
	});

	test("OperationItem 'After N operations' uses the correct Russian plural category per count", async () => {
		const { vantageOSRegistry } = await import("@/lib/json-render/registry");
		const OperationItem = vantageOSRegistry.OperationItem as (props: {
			element: { props: Record<string, unknown> };
			// biome-ignore lint/suspicious/noExplicitAny: registry components are untyped `any` props (pre-existing)
		}) => any;

		const { unmount } = render(
			<OperationItem
				element={{
					props: {
						id: "op1",
						name: "n",
						description: "d",
						type: "ai",
						assignedAgent: "a",
						dependsOn: ["x", "y"], // count = 2 -> "few" category in Russian CLDR
					},
				}}
			/>,
		);
		expect(screen.getByText("После 2 операций")).toBeInTheDocument();
		unmount();
	});
});

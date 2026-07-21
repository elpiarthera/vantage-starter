/**
 * Consumer coverage for the M9 Radix -> Base UI `button.tsx` migration
 * (docs/migration-base-ui.md §M9). `@radix-ui/react-slot`'s `Slot` merged the
 * component's own props (className, ref, handlers) onto a single child
 * element for `asChild`; this repo now does that merge via `useRender`
 * (`components/ui/button.tsx`'s internal `useAsChildRender` helper). The one
 * real risk of this migration is that merge silently regressing to a
 * wrapping `<button>` around the child instead of merging onto it —
 * `app/[locale]/error.tsx` (a real, unmodified consumer) is mounted here
 * end-to-end to prove the merge, not a synthetic isolated `<Button>`.
 *
 * MUTATION THAT REDDENS THIS SUITE (documented, not left to the reader):
 * in `components/ui/button.tsx`, changing the `asChild` branch of
 * `useAsChildRender` from
 *   `render: React.Children.only(children) as React.ReactElement`
 * to a plain wrapper, e.g.
 *   `defaultTagName: "button"` (dropping the `render` branch entirely so
 *   `asChild` renders a `<button>` host with `children` nested inside it,
 *   the exact regression this migration must not reintroduce)
 * makes `getByRole("link")` below return a `<button><a>...</a></button>`
 * shape and the `tagName === "A"` assertion fails (the anchor is no longer
 * the outermost/only rendered element, and `toHaveClass("inline-flex")` no
 * longer matches the anchor itself). Restoring the real `render:` branch
 * turns the suite green again with an empty `git diff`.
 */

import { render, screen } from "@testing-library/react";
import LocaleError from "@/app/[locale]/error";

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

describe("Button asChild (Slot -> useRender migration, button.tsx)", () => {
	test("merges Button's className and props onto the child element instead of wrapping it", () => {
		render(<LocaleError error={new Error("boom")} reset={jest.fn()} />);

		// LocaleError renders `<Button variant="ghost" asChild><Link href="/dashboard">...</Link></Button>`.
		const link = screen.getByRole("link", {
			name: "dashboard.go_to_dashboard",
		});

		// The rendered element IS the anchor — not a `<button>` wrapping an `<a>`.
		expect(link.tagName).toBe("A");
		expect(link.closest("button")).toBeNull();

		// buttonVariants' className landed ON the anchor itself (a stable token
		// from `inline-flex items-center justify-center ...` in buttonVariants).
		expect(link).toHaveClass("inline-flex");
		expect(link).toHaveClass("w-full");

		// The child's own prop (href, via next/link -> a real anchor) survived.
		expect(link).toHaveAttribute("href", "/dashboard");
	});

	test("non-asChild Button still renders a real <button>", () => {
		const handleReset = jest.fn();
		render(<LocaleError error={new Error("boom")} reset={handleReset} />);

		const button = screen.getByRole("button", {
			name: "errors.try_again_button",
		});

		expect(button.tagName).toBe("BUTTON");
		expect(button).toHaveClass("inline-flex");
	});
});

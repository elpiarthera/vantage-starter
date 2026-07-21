/**
 * Consumer coverage for the M4 Radix -> Base UI `tabs.tsx` migration
 * (docs/migration-base-ui.md). `AdaptiveNavigation` is the second of
 * `tabs.tsx`'s two consumers in the repo (desktop branch) — this test proves
 * the migrated `Tabs` still renders real `role="tab"` buttons and drives the
 * consumer's real `onItemChange` handler on click, with
 * `AdaptiveNavigation`'s own source left untouched except for the
 * `data-[state=active]` -> `data-[active]` selector rename.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = nsDict?.[key];
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: false }),
}));

import { AdaptiveNavigation } from "@/components/adaptive/AdaptiveNavigation";

describe("AdaptiveNavigation (Tabs migrated to Base UI, desktop branch)", () => {
	test("renders real tab buttons and fires the real onItemChange handler on click", async () => {
		const user = userEvent.setup();
		const onItemChange = jest.fn();

		render(
			<AdaptiveNavigation
				items={[
					{ id: "intro", title: "Intro" },
					{ id: "outro", title: "Outro" },
				]}
				activeItem="intro"
				onItemChange={onItemChange}
			/>,
		);

		const introTab = screen.getByRole("tab", { name: /Intro/ });
		expect(introTab).toHaveAttribute("aria-selected", "true");

		// Guard the exact migration risk: the active tab must carry BOTH the
		// `data-active` presence attribute Base UI stamps AND the utility class
		// keyed on it. `aria-selected` alone (set independently by Base UI) left
		// the active styling unguarded — a wrong selector token passed silently.
		expect(introTab).toHaveAttribute("data-active");
		expect(introTab).toHaveClass("data-[active]:bg-primary");

		const outroTab = screen.getByRole("tab", { name: /Outro/ });
		expect(outroTab).not.toHaveAttribute("data-active");
		await user.click(outroTab);

		expect(onItemChange).toHaveBeenCalledWith("outro", expect.anything());
	});
});

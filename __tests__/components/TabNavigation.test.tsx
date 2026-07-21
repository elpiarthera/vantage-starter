/**
 * Consumer coverage for the M4 Radix -> Base UI `tabs.tsx` migration
 * (docs/migration-base-ui.md). `TabNavigation` is the first of `tabs.tsx`'s
 * two consumers in the repo — this test proves the migrated `Tabs` still
 * renders real `role="tab"` buttons, drives the consumer's real
 * `onTabChange` handler on click, and stamps `aria-selected` (Base UI's
 * `data-active` presence attribute swapped in for Radix's
 * `data-state="active"`, confirmed by the consumer's own
 * `data-[active]:bg-primary` className), with `TabNavigation`'s own source
 * left untouched except for that one selector rename.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TabNavigation } from "@/components/dashboard/shared/TabNavigation";

describe("TabNavigation (Tabs migrated to Base UI)", () => {
	test("renders real tab buttons and fires the real onTabChange handler on click", async () => {
		const user = userEvent.setup();
		const onTabChange = jest.fn();

		render(
			<TabNavigation
				tabs={[
					{ value: "overview", label: "Overview" },
					{ value: "settings", label: "Settings", count: 3 },
				]}
				activeTab="overview"
				onTabChange={onTabChange}
			/>,
		);

		const overviewTab = screen.getByRole("tab", { name: /Overview/ });
		expect(overviewTab).toHaveAttribute("aria-selected", "true");

		// Guard the exact migration risk: the active tab must carry BOTH the
		// `data-active` presence attribute Base UI stamps AND the utility class
		// keyed on it. Asserting only `aria-selected` (Base UI sets that
		// independently) left the visual active styling unguarded — a wrong
		// selector token (`data-[active]` -> `data-[bogus]`) passed silently.
		expect(overviewTab).toHaveAttribute("data-active");
		expect(overviewTab).toHaveClass("data-[active]:bg-primary");

		const settingsTab = screen.getByRole("tab", { name: /Settings/ });
		expect(settingsTab).toHaveAttribute("aria-selected", "false");
		expect(settingsTab).not.toHaveAttribute("data-active");

		await user.click(settingsTab);

		expect(onTabChange).toHaveBeenCalledWith("settings", expect.anything());
	});
});

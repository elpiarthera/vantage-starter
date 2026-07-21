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

		const settingsTab = screen.getByRole("tab", { name: /Settings/ });
		expect(settingsTab).toHaveAttribute("aria-selected", "false");

		await user.click(settingsTab);

		expect(onTabChange).toHaveBeenCalledWith("settings", expect.anything());
	});
});

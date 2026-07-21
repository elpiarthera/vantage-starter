/**
 * Consumer coverage for the M8 Radix -> Base UI `picker.tsx` migration
 * (docs/migration-base-ui.md §M8). Mounts `Picker`/`PickerTrigger`/
 * `PickerContent`/`PickerGroup`/`PickerItem` exactly as the real
 * `radius-picker.tsx`/`theme-picker.tsx`/etc. consumers compose them.
 *
 * The migration risk under test is the `Portal > Positioner > Popup`
 * structural insertion in `PickerContent`: Base UI requires a `Positioner`
 * between `Portal` and `Popup` (unlike Radix's single `Content` part). If
 * `Positioner` is dropped, the popup either fails to mount or renders
 * unpositioned — this test asserts the real item content becomes queryable
 * after opening the trigger, which fails if the popup never mounts.
 *
 * BIPOLAR MUTATION that reddens this test: in `components/create/picker.tsx`,
 * remove the `<DropdownMenu.Positioner>` wrapper from `PickerContent` (render
 * `Popup` directly as a child of `Portal`). `align`/`sideOffset`/`side` are
 * `Positioner`-only props in Base UI's menu package (confirmed in
 * `MenuPositionerProps`) — passing them straight to `Popup` throws a
 * prop-type mismatch/renders nothing, and the item text queried below never
 * appears.
 *
 * DECLARED COVERAGE LIMIT (honest, per docs/migration-base-ui.md's M6
 * scroll-area precedent): jsdom performs no real layout/floating-ui
 * positioning math, so this test cannot prove the popup is visually
 * positioned correctly relative to the trigger — only that the structural
 * insertion is present and does not prevent the popup from mounting and
 * exposing its real content. Visual positioning is a human/browser
 * verification item.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerItem,
	PickerTrigger,
} from "@/components/create/picker";

describe("Picker (DropdownMenu migrated to Base UI)", () => {
	test("opening PickerTrigger reveals real PickerItem content behind the Positioner > Popup structure", async () => {
		const user = userEvent.setup();

		render(
			<Picker>
				<PickerTrigger>Open picker</PickerTrigger>
				<PickerContent side="right" align="start" sideOffset={12}>
					<PickerGroup>
						<PickerItem>Rounded</PickerItem>
						<PickerItem>Sharp</PickerItem>
					</PickerGroup>
				</PickerContent>
			</Picker>,
		);

		expect(screen.queryByText("Rounded")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Open picker" }));

		expect(await screen.findByText("Rounded")).toBeInTheDocument();
		expect(screen.getByText("Sharp")).toBeInTheDocument();
	});
});

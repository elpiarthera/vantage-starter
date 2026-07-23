/**
 * Coverage for the tracking control on the `payment-confirmed` branch of
 * `/dashboard/account/order-confirmed` (mcpcn `payment-confirmed` block,
 * docs/mcpcn-block-mapping.md §4 line 178, Batch 4).
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockToastSuccess = jest.fn();
jest.mock("sonner", () => ({
	toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

import { TrackingButton } from "@/components/dashboard/account/TrackingButton";

// `@testing-library/user-event`'s `setup()` installs its OWN clipboard stub
// on `navigator.clipboard` (confirmed by hand: a custom `writeText` mock
// assigned before `setup()` is silently replaced) — this suite exercises the
// component's own `navigator.clipboard.writeText` call directly via
// `fireEvent`, never through `userEvent`, so the assertion below observes
// the real call this component makes rather than user-event's substitute.
const mockWriteText = jest.fn().mockResolvedValue(undefined);

beforeAll(() => {
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText: mockWriteText },
		configurable: true,
	});
});

beforeEach(() => {
	jest.clearAllMocks();
	mockWriteText.mockResolvedValue(undefined);
});

describe("TrackingButton", () => {
	test("clicking copies the tracking reference to the clipboard and toasts the confirmation", async () => {
		render(
			<TrackingButton
				trackingRef="TRACK-1234567890"
				label="Copy tracking number"
				copiedToastMessage="Tracking number copied"
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: /Copy tracking number/i }),
		);

		await waitFor(() => {
			expect(mockToastSuccess).toHaveBeenCalledWith("Tracking number copied");
		});
		expect(mockWriteText).toHaveBeenCalledWith("TRACK-1234567890");
	});
});

/**
 * Coverage for the shared presentational block behind the confirmation
 * route (mcpcn `order-confirm` / `payment-confirmed` blocks,
 * docs/mcpcn-block-mapping.md §4 "Commerce / confirmation", Batch 4).
 */

import { render, screen } from "@testing-library/react";
import { OrderConfirmation } from "@/components/ui/order-confirmation";

const labels = {
	heading: "Thanks for your purchase!",
	description: "Your download is ready.",
	productLabel: "Product",
	purchasedOnLabel: "Purchased on",
	trackingRefLabel: "Tracking reference",
};

describe("OrderConfirmation — order-confirm (digital) branch", () => {
	test("renders product info and purchase date, no tracking reference row", () => {
		render(
			<OrderConfirmation
				kind="digital"
				productKey="exported_report"
				purchasedOnLabel="July 1, 2026"
				labels={labels}
			/>,
		);

		expect(screen.getByText("Thanks for your purchase!")).toBeInTheDocument();
		expect(screen.getByText("exported_report")).toBeInTheDocument();
		expect(screen.getByText("July 1, 2026")).toBeInTheDocument();
		expect(screen.queryByText("Tracking reference")).not.toBeInTheDocument();
	});
});

describe("OrderConfirmation — payment-confirmed (trackable) branch", () => {
	test("renders the tracking reference row and the passed trackingAction slot", () => {
		render(
			<OrderConfirmation
				kind="trackable"
				productKey="physical_addon"
				purchasedOnLabel="July 1, 2026"
				labels={labels}
				trackingRef="TRACK-1234567890"
				trackingAction={<button type="button">Copy tracking number</button>}
			/>,
		);

		expect(screen.getByText("Tracking reference")).toBeInTheDocument();
		expect(screen.getByText("TRACK-1234567890")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Copy tracking number" }),
		).toBeInTheDocument();
	});

	test("no trackingAction slot renders no action even on the trackable branch", () => {
		render(
			<OrderConfirmation
				kind="trackable"
				productKey="physical_addon"
				purchasedOnLabel="July 1, 2026"
				labels={labels}
				trackingRef="TRACK-1234567890"
			/>,
		);

		expect(
			screen.queryByRole("button", { name: /Copy/i }),
		).not.toBeInTheDocument();
	});
});

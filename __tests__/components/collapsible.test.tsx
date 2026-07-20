import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

describe("Collapsible (Base UI)", () => {
	test("reveals content on trigger click", async () => {
		const user = userEvent.setup();
		render(
			<Collapsible>
				<CollapsibleTrigger>Toggle details</CollapsibleTrigger>
				<CollapsibleContent>Hidden details revealed</CollapsibleContent>
			</Collapsible>,
		);

		expect(
			screen.queryByText("Hidden details revealed"),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Toggle details" }));

		expect(screen.getByText("Hidden details revealed")).toBeInTheDocument();
	});
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

describe("Accordion (Base UI)", () => {
	test("expands and reveals panel content on trigger click", async () => {
		const user = userEvent.setup();
		render(
			<Accordion>
				<AccordionItem value="item-1">
					<AccordionTrigger>Question one</AccordionTrigger>
					<AccordionContent>Answer one content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);

		expect(screen.queryByText("Answer one content")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Question one" }));

		expect(screen.getByText("Answer one content")).toBeInTheDocument();
	});
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

describe("RadioGroup (Base UI)", () => {
	test("selects a radio item and deselects the previous one", async () => {
		const user = userEvent.setup();
		render(
			<RadioGroup defaultValue="a" aria-label="Plan">
				<RadioGroupItem value="a" aria-label="Plan A" />
				<RadioGroupItem value="b" aria-label="Plan B" />
			</RadioGroup>,
		);

		const optionA = screen.getByRole("radio", { name: "Plan A" });
		const optionB = screen.getByRole("radio", { name: "Plan B" });

		expect(optionA).toHaveAttribute("aria-checked", "true");
		expect(optionB).toHaveAttribute("aria-checked", "false");

		await user.click(optionB);

		expect(optionB).toHaveAttribute("aria-checked", "true");
		expect(optionA).toHaveAttribute("aria-checked", "false");
	});
});

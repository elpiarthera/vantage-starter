import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox (Base UI)", () => {
	test("toggles checked state and reflects it via aria-checked", async () => {
		const user = userEvent.setup();
		render(<Checkbox aria-label="Accept terms" />);

		const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
		expect(checkbox).toHaveAttribute("aria-checked", "false");

		await user.click(checkbox);

		expect(checkbox).toHaveAttribute("aria-checked", "true");
	});
});

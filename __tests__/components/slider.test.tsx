import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Slider } from "@/components/ui/slider";

describe("Slider (Base UI)", () => {
	test("increments value via keyboard arrow on the focused thumb", async () => {
		const user = userEvent.setup();
		render(<Slider defaultValue={[10]} min={0} max={100} step={1} />);

		const thumbInput = screen.getByRole("slider");
		expect(thumbInput).toHaveAttribute("aria-valuenow", "10");

		act(() => {
			thumbInput.focus();
		});
		await user.keyboard("{ArrowRight}");

		expect(thumbInput).toHaveAttribute("aria-valuenow", "11");
	});
});

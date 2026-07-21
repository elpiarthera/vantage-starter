/**
 * Consumer coverage for the M7 Radix -> Base UI `dialog.tsx` migration
 * (docs/migration-base-ui.md §M7). `InsufficientCreditsModal` is a real
 * consumer of `Dialog`/`DialogContent`/`DialogTitle`/`DialogDescription` on
 * the desktop (non-mobile) branch. The migration risk is the
 * `Content`->`Popup` / `Overlay`->`Backdrop` swap plus the in-component close
 * button wiring (`DialogPrimitive.Close` + `t("close")` sr-only label).
 *
 * What would redden this test: if `DialogContent` still referenced the
 * removed `DialogPrimitive.Content`/`Overlay` parts, or if the close button's
 * `data-[open]:`/`data-[closed]:` selectors were left as stale
 * `data-[state=...]` tokens causing the popup to never mount open, the
 * `getByText` title/description queries below would fail to find the popup
 * content, and the close button query would fail to resolve to a real
 * clickable button.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string, vars?: Dict): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = nsDict?.[key];
	if (typeof value !== "string") return key;
	if (!vars) return value;
	return Object.entries(vars).reduce(
		(acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
		value,
	);
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string, vars?: Dict) =>
		resolve(en, ns, key, vars),
}));

jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: false }),
}));

jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";

describe("InsufficientCreditsModal (Dialog migrated to Base UI)", () => {
	test("renders the migrated Dialog popup with title/description and a clickable close button", () => {
		render(
			<InsufficientCreditsModal
				isOpen={true}
				onClose={jest.fn()}
				required={20}
				available={5}
				actionName="Generate Video"
			/>,
		);

		// Popup content (Content -> Popup swap landed and rendered while open).
		expect(screen.getByText("Insufficient Credits")).toBeInTheDocument();
		expect(
			screen.getByText("You don't have enough credits for Generate Video"),
		).toBeInTheDocument();

		// Close button (sr-only "Close" label) is present and clickable.
		const closeButton = screen.getByRole("button", { name: "Close" });
		expect(closeButton).toBeInTheDocument();
		expect(closeButton.tagName).toBe("BUTTON");
	});

	test("clicking the close button fires onClose", async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		render(
			<InsufficientCreditsModal
				isOpen={true}
				onClose={onClose}
				required={20}
				available={5}
				actionName="Generate Video"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalled();
	});
});

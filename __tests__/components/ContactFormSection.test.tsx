/**
 * Coverage for the mcpcn `contact-form` block wired into
 * `ContactFormSection` (docs/mcpcn-block-mapping.md §4 "contact-form",
 * Batch 4).
 *
 * TDD assertion this file proves (the client-side half — the server-side
 * half is __tests__/convex/contactSubmissions.test.ts): an invalid email is
 * refused BEFORE the mutation runs. Submitting the form with a malformed
 * email must NOT call `api.contactSubmissions.create` at all.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let value: unknown = (dict[ns] as Dict | undefined) ?? {};
	for (const segment of key.split(".")) {
		value = (value as Dict | undefined)?.[segment];
	}
	if (typeof value !== "string") {
		return key;
	}
	return value;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

const mockCreate = jest.fn();
jest.mock("convex/react", () => ({
	useMutation: () => mockCreate,
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		contactSubmissions: { create: "contactSubmissions.create" },
	},
}));

import { ContactFormSection } from "@/components/contact/ContactFormSection";

function fillRequiredFields() {
	fireEvent.change(screen.getByLabelText("First Name"), {
		target: { value: "Ada" },
	});
	fireEvent.change(screen.getByLabelText("Last Name"), {
		target: { value: "Lovelace" },
	});
	fireEvent.change(screen.getByLabelText("Tell us about your project"), {
		target: { value: "I need help with X." },
	});
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("ContactFormSection — contact-form block", () => {
	test("RED: an invalid email never calls the mutation", async () => {
		render(<ContactFormSection />);
		fillRequiredFields();
		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "not-an-email" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

		// The browser's own `type="email"` constraint validation may intercept
		// the submit event before React's `onSubmit` handler ever runs (jsdom
		// implements this) — either way, the mutation must never be reached.
		// A short wait covers the case where validation is bypassed and the
		// handler's own `isValidEmail` gate has to catch it instead.
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(mockCreate).not.toHaveBeenCalled();
	});

	test("a valid submission calls the mutation exactly once with the submitted values", async () => {
		mockCreate.mockResolvedValue({ success: true, submissionId: "sub_1" });

		render(<ContactFormSection />);
		fillRequiredFields();
		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "ada@example.com" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

		await waitFor(() => {
			expect(mockCreate).toHaveBeenCalledTimes(1);
		});
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				firstName: "Ada",
				lastName: "Lovelace",
				email: "ada@example.com",
				message: "I need help with X.",
			}),
		);

		await waitFor(() => {
			expect(screen.getByText("Message sent")).toBeInTheDocument();
		});
	});
});

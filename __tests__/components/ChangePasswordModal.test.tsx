/**
 * RED-first coverage for the defect: `ChangePasswordModal` validated the
 * form, then on submit only ran `console.log("[v0] Changing password")`
 * with a `// TODO: Implement actual password change logic` — no call ever
 * reached Clerk. The user believes their account is re-secured; it is not.
 *
 * Fix: wire submit to Clerk's `useUser().user.updatePassword({
 * currentPassword, newPassword, signOutOfOtherSessions: true })`.
 *
 * Two poles are asserted:
 * - Happy path: a valid submission actually invokes
 *   `user.updatePassword` with the typed values, surfaces a success toast,
 *   and closes the modal.
 * - Legitimate-failure pole: when Clerk rejects (wrong current password —
 *   `form_password_incorrect`), the modal shows the error to the user,
 *   does NOT close, and does NOT claim success.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let value: unknown = (dict[ns] as Dict | undefined) ?? {};
	for (const segment of key.split(".")) {
		value = (value as Dict | undefined)?.[segment];
	}
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: false }),
}));

jest.mock("sonner", () => ({
	toast: { success: jest.fn(), error: jest.fn() },
}));

const updatePasswordMock = jest.fn();
jest.mock("@clerk/nextjs", () => ({
	useUser: () => ({
		user: { updatePassword: updatePasswordMock },
	}),
}));

import { ChangePasswordModal } from "@/components/dashboard/account/modals/ChangePasswordModal";

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText(/current password/i), "old-pass-123");
	await user.type(screen.getByLabelText(/^new password/i), "new-pass-456");
	await user.type(
		screen.getByLabelText(/confirm new password/i),
		"new-pass-456",
	);
	await user.click(
		screen.getByRole("button", {
			name: en.change_password_modal.change_password_button,
		}),
	);
}

describe("ChangePasswordModal", () => {
	beforeEach(() => {
		updatePasswordMock.mockReset();
		(toast.success as jest.Mock).mockClear();
		(toast.error as jest.Mock).mockClear();
	});

	test("a valid submission actually invokes Clerk's user.updatePassword", async () => {
		updatePasswordMock.mockResolvedValue({});
		const onClose = jest.fn();
		const user = userEvent.setup();
		render(<ChangePasswordModal isOpen onClose={onClose} />);

		await fillAndSubmit(user);

		await waitFor(() => {
			expect(updatePasswordMock).toHaveBeenCalledWith({
				currentPassword: "old-pass-123",
				newPassword: "new-pass-456",
				signOutOfOtherSessions: true,
			});
		});
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(toast.success).toHaveBeenCalled();
	});

	test("a wrong current password is refused with a visible error, not swallowed", async () => {
		updatePasswordMock.mockRejectedValue({
			errors: [
				{
					code: "form_password_incorrect",
					message: "Incorrect password",
					longMessage: "Incorrect password",
				},
			],
		});
		const onClose = jest.fn();
		const user = userEvent.setup();
		render(<ChangePasswordModal isOpen onClose={onClose} />);

		await fillAndSubmit(user);

		await waitFor(() => {
			expect(
				screen.getByText(
					en.change_password_modal.validation.current_password_incorrect,
				),
			).toBeInTheDocument();
		});
		expect(onClose).not.toHaveBeenCalled();
		expect(toast.success).not.toHaveBeenCalled();
	});

	test("a confirmation mismatch never reaches Clerk", async () => {
		const onClose = jest.fn();
		const user = userEvent.setup();
		render(<ChangePasswordModal isOpen onClose={onClose} />);

		await user.type(screen.getByLabelText(/current password/i), "old-pass-123");
		await user.type(screen.getByLabelText(/^new password/i), "new-pass-456");
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"does-not-match",
		);
		await user.click(
			screen.getByRole("button", {
				name: en.change_password_modal.change_password_button,
			}),
		);

		expect(updatePasswordMock).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	test("each password field stays associated with its label after the label.tsx native-<label> migration (M5)", () => {
		render(<ChangePasswordModal isOpen onClose={jest.fn()} />);

		expect(screen.getByLabelText(/current password/i).tagName).toBe("INPUT");
		expect(screen.getByLabelText(/^new password/i).tagName).toBe("INPUT");
		expect(screen.getByLabelText(/confirm new password/i).tagName).toBe(
			"INPUT",
		);
	});
});

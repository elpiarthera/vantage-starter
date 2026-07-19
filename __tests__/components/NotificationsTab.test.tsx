/**
 * RED-first coverage for the defect: `NotificationsTab.handleSave` writes
 * `user.update({ unsafeMetadata: { ...user.unsafeMetadata, emailNotifications,
 * pushNotifications, marketingEmails } })`. The leading `...user.unsafeMetadata`
 * spread is what stops this write from DELETING keys another surface owns —
 * `ProfileTab.tsx` persists `theme`, `language`, and `notifications` in that
 * same `unsafeMetadata` object. Without the spread, saving a notification
 * preference silently erases the user's theme and language.
 *
 * The central assertion is on the REAL argument passed to `user.update`,
 * never on component state: foreign keys already present in `unsafeMetadata`
 * (here `theme` and `language`) must still be present, unchanged, alongside
 * the updated notification flags.
 *
 * Also covered:
 * - preferences initialise FROM `unsafeMetadata` rather than hardcoded
 *   defaults when a saved value already exists;
 * - a rejected `user.update` surfaces the error instead of resolving
 *   silently.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = nsDict?.[key];
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

import type { UserResource } from "@clerk/types";
import { NotificationsTab } from "@/components/dashboard/account/tabs/NotificationsTab";

function buildUser(
	updateMock: jest.Mock,
	unsafeMetadata: Record<string, unknown>,
): UserResource {
	return {
		unsafeMetadata,
		update: updateMock,
	} as unknown as UserResource;
}

describe("NotificationsTab", () => {
	beforeEach(() => {
		(toast.success as jest.Mock).mockClear();
		(toast.error as jest.Mock).mockClear();
	});

	test("saving a notification preference preserves foreign unsafeMetadata keys owned by other tabs", async () => {
		const updateMock = jest.fn().mockResolvedValue({});
		const user = buildUser(updateMock, {
			theme: "midnight-blue",
			language: "fr",
			notifications: { digest: "weekly" },
			emailNotifications: true,
			pushNotifications: false,
			marketingEmails: true,
		});
		const events = userEvent.setup();

		render(<NotificationsTab user={user} />);

		await events.click(
			screen.getByRole("switch", {
				name: en.notifications_tab.toggle_push_aria,
			}),
		);
		await events.click(
			screen.getByRole("button", {
				name: en.notifications_tab.save_preferences,
			}),
		);

		await waitFor(() => {
			expect(updateMock).toHaveBeenCalledWith({
				unsafeMetadata: expect.objectContaining({
					theme: "midnight-blue",
					language: "fr",
					notifications: { digest: "weekly" },
					emailNotifications: true,
					pushNotifications: true,
					marketingEmails: true,
				}),
			});
		});
		expect(toast.success).toHaveBeenCalled();
	});

	test("preferences initialise from unsafeMetadata rather than hardcoded defaults", () => {
		const updateMock = jest.fn();
		const user = buildUser(updateMock, {
			theme: "midnight-blue",
			language: "fr",
			emailNotifications: false,
			pushNotifications: true,
			marketingEmails: false,
		});

		render(<NotificationsTab user={user} />);

		expect(
			screen.getByRole("switch", {
				name: en.notifications_tab.toggle_email_aria,
			}),
		).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("switch", {
				name: en.notifications_tab.toggle_push_aria,
			}),
		).toHaveAttribute("aria-checked", "true");
		expect(
			screen.getByRole("switch", {
				name: en.notifications_tab.toggle_marketing_aria,
			}),
		).toHaveAttribute("aria-checked", "false");
	});

	test("a rejected user.update surfaces the error instead of resolving silently", async () => {
		const updateMock = jest
			.fn()
			.mockRejectedValue(new Error("Network error saving preferences"));
		const user = buildUser(updateMock, {
			theme: "midnight-blue",
			language: "fr",
		});
		const events = userEvent.setup();

		render(<NotificationsTab user={user} />);

		await events.click(
			screen.getByRole("button", {
				name: en.notifications_tab.save_preferences,
			}),
		);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Network error saving preferences",
			);
		});
		expect(toast.success).not.toHaveBeenCalled();
	});
});

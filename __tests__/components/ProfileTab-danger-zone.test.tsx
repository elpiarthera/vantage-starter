/**
 * Consumer coverage for the M4 Radix -> Base UI `alert-dialog.tsx` and
 * `avatar.tsx` migrations (docs/migration-base-ui.md). `ProfileTab` is the
 * second of both wrappers' two consumers in the repo — this test proves the
 * migrated `Avatar` still renders the user's fallback initials, and that the
 * migrated `AlertDialog`'s destructive `AlertDialogAction` still fires the
 * real `deleteAccount` action before the dialog closes, with `ProfileTab`'s
 * own source left untouched.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let nsDict: Dict | undefined = dict;
	for (const segment of ns.split(".")) {
		nsDict = nsDict?.[segment] as Dict | undefined;
	}
	const value = nsDict?.[key];
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
	useLocale: () => "en",
}));

jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: false }),
}));

jest.mock("sonner", () => ({
	toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const signOutMock = jest.fn().mockResolvedValue(undefined);
jest.mock("@clerk/nextjs", () => ({
	useClerk: () => ({ signOut: signOutMock }),
	useUser: () => ({ user: null }),
}));

const deleteAccountMock = jest.fn().mockResolvedValue(undefined);

jest.mock("convex/react", () => ({
	useQuery: () => undefined,
	useMutation: () => jest.fn().mockResolvedValue(undefined),
	useAction: () => deleteAccountMock,
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		users: {
			updateLanguagePreference: "users.updateLanguagePreference",
			updatePreferences: "users.updatePreferences",
			deleteAccount: "users.deleteAccount",
		},
		subscriptions: { getByClerkUserId: "subscriptions.getByClerkUserId" },
		credits: { getUserCredits: "credits.getUserCredits" },
	},
}));

jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ replace: jest.fn() }),
	usePathname: () => "/dashboard/account",
}));

import type { UserResource } from "@clerk/shared/types";
import { ProfileTab } from "@/components/dashboard/account/tabs/ProfileTab";

function buildUser(): UserResource {
	return {
		id: "user_1",
		fullName: "Ada Lovelace",
		firstName: "Ada",
		lastName: "Lovelace",
		imageUrl: "",
		primaryEmailAddress: { emailAddress: "ada@example.com" },
		unsafeMetadata: {},
	} as unknown as UserResource;
}

describe("ProfileTab (Avatar + AlertDialog migrated to Base UI)", () => {
	beforeEach(() => {
		deleteAccountMock.mockClear();
		signOutMock.mockClear();
	});

	test("renders the migrated Avatar fallback with the user's initials", () => {
		render(<ProfileTab user={buildUser()} />);

		expect(screen.getByText("AL")).toBeInTheDocument();
	});

	test("opens the delete-account confirmation as a real alertdialog and fires the real deleteAccount action on confirm", async () => {
		const user = userEvent.setup();
		render(<ProfileTab user={buildUser()} />);

		await user.click(screen.getByRole("button", { name: /delete account/i }));

		const dialog = await screen.findByRole("alertdialog");
		expect(dialog).toBeInTheDocument();

		const confirmButton = screen.getByRole("button", {
			name: /delete permanently/i,
		});
		await user.click(confirmButton);

		expect(deleteAccountMock).toHaveBeenCalled();
	});
});

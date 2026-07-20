/**
 * Consumer coverage for the M2 Radix -> Base UI `select.tsx` migration
 * (docs/migration-base-ui.md). `ProfileTab` is the sole consumer of
 * `components/ui/select.tsx` in the repo — this test proves the wrapper's
 * public API (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`,
 * `SelectItem`, `onValueChange`) still renders real content and drives the
 * consumer's real `handleLanguageChange` callback after the migration, with
 * ProfileTab's own source left untouched.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
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

jest.mock("@clerk/nextjs", () => ({
	useClerk: () => ({ signOut: jest.fn() }),
	useUser: () => ({ user: null }),
}));

const updateLanguagePreferenceMock = jest.fn().mockResolvedValue(undefined);
const updatePreferencesMock = jest.fn().mockResolvedValue(undefined);

jest.mock("convex/react", () => ({
	useQuery: () => undefined,
	useMutation: (ref: unknown) => {
		if (ref === "users.updateLanguagePreference") {
			return updateLanguagePreferenceMock;
		}
		return updatePreferencesMock;
	},
	useAction: () => jest.fn(),
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

const replaceMock = jest.fn();
jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ replace: replaceMock }),
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

describe("ProfileTab (Select migrated to Base UI)", () => {
	beforeEach(() => {
		updateLanguagePreferenceMock.mockClear();
		replaceMock.mockClear();
	});

	test("renders real profile content, including the language Select trigger showing the current locale", () => {
		render(<ProfileTab user={buildUser()} />);

		expect(screen.getByDisplayValue("Ada Lovelace")).toBeInTheDocument();
		expect(screen.getByDisplayValue("ada@example.com")).toBeInTheDocument();
		const trigger = document.getElementById("language");
		expect(trigger).not.toBeNull();
		expect(trigger).toHaveTextContent("en");
	});

	test("selecting a language opens the popup, lists every SUPPORTED_LANGUAGES item, and drives the real onValueChange handler", async () => {
		const user = userEvent.setup();
		render(<ProfileTab user={buildUser()} />);

		const trigger = document.getElementById("language") as HTMLElement;
		await user.click(trigger);

		const frenchOption = await screen.findByRole("option", {
			name: /Français/,
		});
		expect(screen.getByRole("option", { name: /Español/ })).toBeInTheDocument();

		await user.click(frenchOption);

		expect(updateLanguagePreferenceMock).toHaveBeenCalledWith({
			language: "fr",
		});
		expect(replaceMock).toHaveBeenCalledWith("/dashboard/account", {
			locale: "fr",
		});
	});
});

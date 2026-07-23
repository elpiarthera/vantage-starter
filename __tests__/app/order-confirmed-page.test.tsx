/**
 * Coverage for `/dashboard/account/order-confirmed` (mcpcn `order-confirm` /
 * `payment-confirmed` blocks, docs/mcpcn-block-mapping.md §4 "Commerce /
 * confirmation", lines 173-181, Batch 4).
 *
 * `OrderConfirmedPage` is an async Server Component — it is called directly
 * (not through `render()`) and its returned element tree is rendered
 * synchronously, same idiom this repo already uses for
 * `ChangelogDetailSection` (see `__tests__/components/ChangelogDetailSection.test.tsx`)
 * adapted for an `async` function component.
 */

import { render, screen } from "@testing-library/react";

const mockAuth = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({
	auth: () => mockAuth(),
}));

const mockFetchQuery = jest.fn();
jest.mock("convex/nextjs", () => ({
	fetchQuery: (...args: unknown[]) => mockFetchQuery(...args),
}));

jest.mock("@/convex/_generated/api", () => ({
	api: { purchases: { getLatestForUser: "purchases.getLatestForUser" } },
}));

const mockNotFound = jest.fn();
const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
	notFound: () => mockNotFound(),
	redirect: (...args: unknown[]) => mockRedirect(...args),
}));

jest.mock("next-intl/server", () => ({
	getTranslations: async ({ namespace }: { namespace: string }) => {
		// biome-ignore lint/suspicious/noExplicitAny: dynamic require of the real dictionary in tests
		const en = require("@/messages/en.json") as any;
		const dict = en[namespace] as Record<string, string>;
		return (key: string) => dict?.[key] ?? key;
	},
}));

// TrackingButton is a Client Component using navigator.clipboard/sonner —
// not under test here (see its own suite); stub it to a plain, assertable
// marker so this suite only asserts the SERVER branch decision.
jest.mock("@/components/dashboard/account/TrackingButton", () => ({
	TrackingButton: ({ trackingRef }: { trackingRef: string }) => (
		<button type="button" data-testid="tracking-button">
			{trackingRef}
		</button>
	),
}));

import OrderConfirmedPage from "@/app/[locale]/dashboard/account/order-confirmed/page";

const params = Promise.resolve({ locale: "en" });

beforeEach(() => {
	jest.clearAllMocks();
});

describe("OrderConfirmedPage — auth gate", () => {
	test("no signed-in userId redirects to sign-in and never queries Convex", async () => {
		mockAuth.mockResolvedValue({ userId: null, getToken: jest.fn() });

		await OrderConfirmedPage({ params });

		expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
		expect(mockFetchQuery).not.toHaveBeenCalled();
	});
});

describe("OrderConfirmedPage — 404 on no purchase (RED proof: see PR body)", () => {
	test("a signed-in user with no purchases row calls notFound(), never renders a 200 page", async () => {
		mockAuth.mockResolvedValue({
			userId: "user_1",
			getToken: jest.fn().mockResolvedValue("token_1"),
		});
		mockFetchQuery.mockResolvedValue(null);

		const element = await OrderConfirmedPage({ params });

		expect(mockNotFound).toHaveBeenCalledTimes(1);
		// notFound() in the real Next.js runtime throws NEXT_HTTP_ERROR_FALLBACK;
		// the mock above does not, so the function keeps running past it — the
		// element returned in that case must never be rendered as a real page,
		// proven here by asserting the mock fired rather than by inspecting a
		// tree that a real notFound() would never let exist.
		expect(element).toBeUndefined();
	});
});

describe("OrderConfirmedPage — digital branch (order-confirm)", () => {
	test("kind: digital renders the digital heading/description and no tracking control", async () => {
		mockAuth.mockResolvedValue({
			userId: "user_1",
			getToken: jest.fn().mockResolvedValue("token_1"),
		});
		mockFetchQuery.mockResolvedValue({
			_id: "purchase_1",
			userId: "user_1",
			productKey: "exported_report",
			kind: "digital",
			purchasedAt: Date.parse("2026-07-01"),
			polarOrderId: "order_1",
		});

		const element = await OrderConfirmedPage({ params });
		render(element);

		expect(
			screen.getAllByText("Thanks for your purchase!").length,
		).toBeGreaterThan(0);
		expect(screen.getByText("Your download is ready.")).toBeInTheDocument();
		expect(screen.getByText("exported_report")).toBeInTheDocument();
		expect(screen.queryByTestId("tracking-button")).not.toBeInTheDocument();
	});
});

describe("OrderConfirmedPage — trackable branch (payment-confirmed)", () => {
	test("kind: trackable renders the trackable heading and a tracking control carrying trackingRef", async () => {
		mockAuth.mockResolvedValue({
			userId: "user_1",
			getToken: jest.fn().mockResolvedValue("token_1"),
		});
		mockFetchQuery.mockResolvedValue({
			_id: "purchase_2",
			userId: "user_1",
			productKey: "physical_addon",
			kind: "trackable",
			trackingRef: "TRACK-1234567890",
			purchasedAt: Date.parse("2026-07-01"),
			polarOrderId: "order_2",
		});

		const element = await OrderConfirmedPage({ params });
		render(element);

		expect(screen.getAllByText("Payment confirmed").length).toBeGreaterThan(0);
		const trackingButton = screen.getByTestId("tracking-button");
		expect(trackingButton).toHaveTextContent("TRACK-1234567890");
	});
});

describe("OrderConfirmedPage — Convex read wiring", () => {
	test("fetchQuery is called with the signed-in userId and the Clerk convex-template token", async () => {
		mockAuth.mockResolvedValue({
			userId: "user_42",
			getToken: jest.fn().mockResolvedValue("token_42"),
		});
		mockFetchQuery.mockResolvedValue({
			_id: "purchase_3",
			userId: "user_42",
			productKey: "exported_report",
			kind: "digital",
			purchasedAt: Date.parse("2026-07-01"),
			polarOrderId: "order_3",
		});

		await OrderConfirmedPage({ params });

		expect(mockFetchQuery).toHaveBeenCalledWith(
			"purchases.getLatestForUser",
			{ userId: "user_42" },
			{ token: "token_42" },
		);
	});
});

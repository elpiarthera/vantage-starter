/**
 * Tests for GitHub issue #188: "After buying credits, user is redirected to
 * profile page instead of original workflow step."
 *
 * This is a UX improvement: after a successful Polar credit purchase the user
 * should return to the exact guided workflow step they came from, not the
 * generic account page.
 *
 * Implementation:
 * 1. InsufficientCreditsModal — smart default navigates to ?tab=usage&returnTo=<url>
 * 2. UsageCreditsTab — reads returnTo from URL, passes as successUrl to PurchaseCreditsModal
 * 3. PurchaseCreditsModal — uses useAction(generateCheckoutLink) with explicit successUrl
 *    (replaces hardcoded <CheckoutLink> which had successUrl: window.location.href)
 * 4. usePurchaseSuccessToast — shows "Credits added" toast on return (reads ?creditsAdded=1)
 * 5. AccountTabs — auto-selects tab from ?tab= query param
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const insufficientCreditsModalSource = fs.readFileSync(
	path.join(process.cwd(), "components/credits/InsufficientCreditsModal.tsx"),
	"utf-8",
);

const purchaseCreditsModalSource = fs.readFileSync(
	path.join(
		process.cwd(),
		"components/dashboard/account/modals/PurchaseCreditsModal.tsx",
	),
	"utf-8",
);

const usageCreditsTabSource = fs.readFileSync(
	path.join(
		process.cwd(),
		"components/dashboard/account/tabs/UsageCreditsTab.tsx",
	),
	"utf-8",
);

const accountTabsSource = fs.readFileSync(
	path.join(process.cwd(), "components/dashboard/account/AccountTabs.tsx"),
	"utf-8",
);

const purchaseSuccessToastSource = fs.readFileSync(
	path.join(process.cwd(), "hooks/business-logic/usePurchaseSuccessToast.ts"),
	"utf-8",
);

describe("Issue #188 — return to workflow after credit purchase", () => {
	// ── InsufficientCreditsModal ────────────────────────────────────────────

	test("InsufficientCreditsModal accepts a returnUrl prop", () => {
		expect(insufficientCreditsModalSource).toContain("returnUrl?:");
	});

	test("InsufficientCreditsModal uses useRouter from next/navigation", () => {
		expect(insufficientCreditsModalSource).toContain('from "next/navigation"');
		expect(insufficientCreditsModalSource).toContain("useRouter");
	});

	test("InsufficientCreditsModal smart default navigates with returnTo param", () => {
		expect(insufficientCreditsModalSource).toContain("returnTo");
		// tab value is set via URLSearchParams({ tab: "usage" })
		expect(insufficientCreditsModalSource).toContain('"usage"');
		expect(insufficientCreditsModalSource).toContain("dashboard/account");
	});

	test("InsufficientCreditsModal still calls onPurchase when provided (backward compat)", () => {
		expect(insufficientCreditsModalSource).toContain("if (onPurchase)");
		expect(insufficientCreditsModalSource).toContain("onPurchase()");
	});

	// ── PurchaseCreditsModal ────────────────────────────────────────────────

	test("PurchaseCreditsModal no longer imports CheckoutLink from @convex-dev/polar", () => {
		expect(purchaseCreditsModalSource).not.toContain("@convex-dev/polar");
	});

	test("PurchaseCreditsModal uses useAction to call generateCheckoutLink directly", () => {
		expect(purchaseCreditsModalSource).toContain("useAction");
		expect(purchaseCreditsModalSource).toContain("generateCheckoutLink");
	});

	test("PurchaseCreditsModal accepts a successUrl prop", () => {
		expect(purchaseCreditsModalSource).toContain("successUrl?:");
	});

	test("PurchaseCreditsModal passes successUrl to generateCheckoutLink", () => {
		expect(purchaseCreditsModalSource).toContain("successUrl:");
		expect(purchaseCreditsModalSource).toContain("generateCheckoutLink({");
	});

	test("PurchaseCreditsModal appends creditsAdded=1 to success URL", () => {
		expect(purchaseCreditsModalSource).toContain("creditsAdded");
	});

	test("PurchaseCreditsModal redirects via window.location.href after checkout", () => {
		expect(purchaseCreditsModalSource).toContain("window.location.href = url");
	});

	// ── UsageCreditsTab ─────────────────────────────────────────────────────

	test("UsageCreditsTab reads returnTo from useSearchParams", () => {
		expect(usageCreditsTabSource).toContain("useSearchParams");
		expect(usageCreditsTabSource).toContain('searchParams.get("returnTo")');
	});

	test("UsageCreditsTab passes returnTo as successUrl to PurchaseCreditsModal", () => {
		expect(usageCreditsTabSource).toContain("successUrl={returnTo}");
	});

	// ── AccountTabs ─────────────────────────────────────────────────────────

	test("AccountTabs reads tab from useSearchParams to auto-select on redirect", () => {
		expect(accountTabsSource).toContain("useSearchParams");
		expect(accountTabsSource).toContain('searchParams.get("tab")');
	});

	test("AccountTabs initialises with the tab from the URL param", () => {
		expect(accountTabsSource).toContain("initialTab");
		expect(accountTabsSource).toContain("useState<TabId>(initialTab)");
	});

	// ── usePurchaseSuccessToast ─────────────────────────────────────────────

	test("usePurchaseSuccessToast detects creditsAdded=1 param", () => {
		expect(purchaseSuccessToastSource).toContain("creditsAdded");
		expect(purchaseSuccessToastSource).toContain('"1"');
	});

	test("usePurchaseSuccessToast uses i18n key purchase_success_toast", () => {
		expect(purchaseSuccessToastSource).toContain("purchase_success_toast");
	});

	test("usePurchaseSuccessToast removes creditsAdded from URL after showing toast", () => {
		expect(purchaseSuccessToastSource).toContain(
			'url.searchParams.delete("creditsAdded")',
		);
		expect(purchaseSuccessToastSource).toContain("replaceState");
	});

	test("usePurchaseSuccessToast supports both custom callback and global sonner toast", () => {
		expect(purchaseSuccessToastSource).toContain("showToast(message)");
		expect(purchaseSuccessToastSource).toContain("toast.success(message)");
	});

	// ── i18n key ────────────────────────────────────────────────────────────

	test("en.json contains the purchase_success_toast i18n key", () => {
		const enJson = fs.readFileSync(
			path.join(process.cwd(), "messages/en.json"),
			"utf-8",
		);
		expect(enJson).toContain("purchase_success_toast");
	});
});

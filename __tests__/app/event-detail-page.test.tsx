/**
 * Coverage for `/events/[slug]` (mcpcn `event-detail` / `event-confirmation`
 * blocks, docs/mcpcn-block-mapping.md §4 "Events", Batch 4 fourth bullet).
 *
 * REAL 404, NOT A 200 "NOT FOUND" SENTENCE: this suite is the RED-then-green
 * proof that a missing slug never reaches a client `useQuery` soft-404
 * anymore — `EventDetailPage` reads server-side via `fetchQuery` and calls
 * `notFound()` BEFORE any render, same contract already proved for
 * `OrderConfirmedPage` in `__tests__/app/order-confirmed-page.test.tsx`.
 *
 * `EventDetailPage` is an async Server Component — called directly (not
 * through `render()`), same idiom as `OrderConfirmedPage`'s suite.
 */

import { render, screen } from "@testing-library/react";
import type React from "react";

const mockFetchQuery = jest.fn();
jest.mock("convex/nextjs", () => ({
	fetchQuery: (...args: unknown[]) => mockFetchQuery(...args),
}));

jest.mock("@/convex/_generated/api", () => ({
	api: { events: { getBySlug: "events.getBySlug" } },
}));

const mockNotFound = jest.fn();
jest.mock("next/navigation", () => ({
	notFound: () => mockNotFound(),
}));

jest.mock("@/i18n/routing", () => ({
	Link: ({ href, children, ...rest }: { href: string; children: unknown }) => (
		<a href={href} {...rest}>
			{children as React.ReactNode}
		</a>
	),
}));

jest.mock("next-intl/server", () => ({
	getTranslations: async ({ namespace }: { namespace: string }) => {
		// biome-ignore lint/suspicious/noExplicitAny: dynamic require of the real dictionary in tests
		const en = require("@/messages/en.json") as any;
		const dict = en[namespace] as Record<string, string>;
		return (key: string) => dict?.[key] ?? key;
	},
}));

// EventDetailSection is a Client Component driving its own Convex/Clerk
// live-query registration flow — not under test here (see its own suite,
// `__tests__/components/EventDetailSection.test.tsx`); stub it to a plain,
// assertable marker so this suite only asserts the SERVER 404 decision.
jest.mock("@/components/events/EventDetailSection", () => ({
	EventDetailSection: ({ slug }: { slug: string }) => (
		<div data-testid="event-detail-section">{slug}</div>
	),
}));

import EventDetailPage, {
	generateMetadata,
} from "@/app/[locale]/events/[slug]/page";

const BASE_EVENT = {
	_id: "event_1",
	slug: "underground-techno-night",
	title: "Underground Techno Night",
	description: "Raw, unfiltered techno in a warehouse setting.",
	agenda: ["Doors 7pm", "Opening set 8pm", "Headliner 10pm"],
	startDateTime: "2026-08-01T22:00:00-04:00",
	timezone: "America/New_York",
	capacity: 50,
	registeredCount: 3,
};

function paramsFor(slug: string) {
	return Promise.resolve({ locale: "en", slug });
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("EventDetailPage — 404 on missing slug (RED proof: see PR body)", () => {
	test("a slug matching no event calls notFound(), never renders a 200 page", async () => {
		mockFetchQuery.mockResolvedValue(null);

		const element = await EventDetailPage({
			params: paramsFor("does-not-exist"),
		});

		expect(mockNotFound).toHaveBeenCalledTimes(1);
		// notFound() in the real Next.js runtime throws
		// NEXT_HTTP_ERROR_FALLBACK;404; the mock above does not, so the
		// function keeps running past it — the element returned in that
		// case must never be rendered as a real page, proven here by
		// asserting the mock fired rather than by inspecting a tree that a
		// real notFound() would never let exist.
		expect(element).toBeUndefined();
		expect(mockFetchQuery).toHaveBeenCalledWith("events.getBySlug", {
			slug: "does-not-exist",
		});
	});

	test("generateMetadata for a missing slug returns not-found metadata, not the generic title", async () => {
		mockFetchQuery.mockResolvedValue(null);

		const metadata = await generateMetadata({
			params: paramsFor("does-not-exist"),
		});

		expect(metadata.title).toBe("Event not found.");
		expect(metadata.title).not.toBe("Events");
	});
});

describe("EventDetailPage — valid slug renders the registration journey", () => {
	test("a real event renders EventDetailSection with the slug, no notFound() call", async () => {
		mockFetchQuery.mockResolvedValue(BASE_EVENT);

		const element = await EventDetailPage({
			params: paramsFor("underground-techno-night"),
		});
		render(element);

		expect(mockNotFound).not.toHaveBeenCalled();
		expect(screen.getByTestId("event-detail-section")).toHaveTextContent(
			"underground-techno-night",
		);
	});

	test("generateMetadata for a valid slug returns the real event metadata", async () => {
		mockFetchQuery.mockResolvedValue(BASE_EVENT);

		const metadata = await generateMetadata({
			params: paramsFor("underground-techno-night"),
		});

		expect(metadata.title).toBe("Events");
		expect(metadata.description).toBe(
			"Browse upcoming webinars and workshops and register for a seat.",
		);
	});
});

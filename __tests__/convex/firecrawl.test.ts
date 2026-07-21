/**
 * Firecrawl client — unit tests (no real network call).
 *
 * convex/actions/scrapeClient.ts used to fetch raw HTML with native
 * `fetch()` and parse it with regexes, which sees nothing of a
 * JavaScript-rendered site. These tests prove the fetch layer itself
 * (convex/lib/firecrawl.ts):
 *
 *   RED 1: a JS-rendered page (native fetch would see an empty shell, but
 *   Firecrawl renders it server-side) yields the fully-rendered HTML back
 *   to the caller — non-empty extraction becomes possible downstream.
 *   RED 3: FIRECRAWL_API_KEY absent throws a NAMED error
 *   (FirecrawlKeyMissingError) rather than silently falling back to a
 *   worse extraction path.
 *
 * `global.fetch` is stubbed in every test — no real network call is ever
 * made by this suite.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
	FirecrawlKeyMissingError,
	FirecrawlRequestError,
	firecrawlScrape,
} from "../../convex/lib/firecrawl";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

// A "JS-shell" page: what native `fetch()` sees before render — an empty
// <div id="root"> and a script tag, no actual content. Regex extraction
// over this yields nothing (no <h1>, no <p>, no meta description).
const JS_SHELL_HTML =
	'<html><head><script src="/app.js"></script></head><body><div id="root"></div></body></html>';

// What Firecrawl returns for the SAME url: the page after client-side JS
// has run — the content a headless browser sees, which is what a
// consultant visiting the site in a real browser sees.
const RENDERED_HTML =
	"<html><head><title>Acme Inc</title></head><body><h1>Acme builds rockets</h1><p>Acme Inc is the leading rocket manufacturer for the modern era, trusted by agencies worldwide.</p></body></html>";

describe("firecrawlScrape", () => {
	it("RED 1 (fixed): returns the fully-rendered HTML, not the JS shell native fetch would see", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");

		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						html: RENDERED_HTML,
						metadata: { url: "https://acme.example/" },
					},
				}),
				{ status: 200 },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await firecrawlScrape("https://acme.example");

		// Proves the CALLER receives rendered content, not the empty shell a
		// native fetch() would have returned for the same URL.
		expect(result.html).not.toBe(JS_SHELL_HTML);
		expect(result.html).toContain("<h1>Acme builds rockets</h1>");
		expect(result.finalUrl).toBe("https://acme.example/");

		// Proves the request actually went to Firecrawl's API, not the target
		// site directly (that would be the un-fixed native-fetch behavior).
		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.firecrawl.dev/v1/scrape",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer fc-test-key",
				}),
			}),
		);
	});

	it("RED 3 (fixed): throws a named FirecrawlKeyMissingError when the key is absent — never falls back silently", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "");
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			firecrawlScrape("https://acme.example"),
		).rejects.toBeInstanceOf(FirecrawlKeyMissingError);

		// Proves no fetch of any kind was attempted — no silent fallback path.
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("throws a named FirecrawlRequestError on a non-2xx Firecrawl response (distinguishable from key-missing)", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })),
		);

		await expect(
			firecrawlScrape("https://acme.example"),
		).rejects.toBeInstanceOf(FirecrawlRequestError);
	});

	it("throws FirecrawlRequestError when Firecrawl responds success:false", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					new Response(
						JSON.stringify({ success: false, error: "Unable to render page" }),
						{ status: 200 },
					),
				),
		);

		await expect(firecrawlScrape("https://acme.example")).rejects.toThrow(
			"Unable to render page",
		);
	});
});

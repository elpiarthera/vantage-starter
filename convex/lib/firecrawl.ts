/**
 * Firecrawl client — JS-rendered page extraction via the Firecrawl REST API.
 *
 * Closes the "upgrade path" architectural intent that was written as a
 * comment and never built: `convex/actions/scrapeClient.ts` and
 * `convex/actions/scrapeCompetitor.ts` used to fetch raw HTML with native
 * `fetch()` and parse it with regexes. A regex over raw HTML sees nothing of
 * a JavaScript-rendered site — which is most company sites — so a consultant
 * got an empty or partial profile with no explanation. Firecrawl renders the
 * page server-side (headless browser) and returns the fully hydrated HTML.
 *
 * DECISION (regex parsing kept, only the FETCH layer changes): the regex
 * extraction functions in scrapeClient.ts/scrapeCompetitor.ts are not what
 * was broken — the file's own docstring named "native fetch" as the thing to
 * replace ("Uses native fetch + HTML parsing (no Firecrawl dependency —
 * upgrade path noted)"). Firecrawl's `formats: ["html"]` response is real
 * HTML text, so the same regex-based extractors work unchanged against it,
 * now with a fully-rendered page instead of a JS shell. Rewriting the
 * extractors themselves is a different, larger problem (structured
 * extraction / NLP) already tracked by separate TODOs in those files — out
 * of scope here.
 *
 * FIRECRAWL_API_KEY absence is a NAMED, SURFACED state
 * (`FirecrawlKeyMissingError`) — callers MUST propagate it to the user
 * rather than silently falling back to native fetch. There is no fallback
 * path in this module: an unconfigured key means "extraction did not run",
 * never "extraction ran a worse way in silence".
 */

export class FirecrawlKeyMissingError extends Error {
	constructor() {
		super("FIRECRAWL_API_KEY is not configured — extraction unavailable.");
		this.name = "FirecrawlKeyMissingError";
	}
}

export class FirecrawlRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FirecrawlRequestError";
	}
}

export interface FirecrawlScrapeResult {
	html: string;
	finalUrl: string;
}

const FIRECRAWL_SCRAPE_ENDPOINT = "https://api.firecrawl.dev/v1/scrape";

interface FirecrawlScrapeResponse {
	success?: boolean;
	error?: string;
	data?: {
		html?: string;
		metadata?: {
			sourceURL?: string;
			url?: string;
		};
	};
}

/**
 * Scrape a URL through Firecrawl, returning fully-rendered HTML.
 *
 * Throws `FirecrawlKeyMissingError` when `FIRECRAWL_API_KEY` is absent, and
 * `FirecrawlRequestError` when Firecrawl responds with an error or a
 * non-2xx status. Callers must surface both as a visible state — never
 * swallow them into a silent regex-only fallback.
 */
export async function firecrawlScrape(
	url: string,
	timeoutMs = 20_000,
): Promise<FirecrawlScrapeResult> {
	const apiKey = process.env.FIRECRAWL_API_KEY;
	if (!apiKey) {
		throw new FirecrawlKeyMissingError();
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	let response: Response;
	try {
		response = await fetch(FIRECRAWL_SCRAPE_ENDPOINT, {
			method: "POST",
			signal: controller.signal,
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				url,
				formats: ["html"],
				onlyMainContent: false,
			}),
		});
	} catch (err) {
		throw new FirecrawlRequestError(
			err instanceof Error ? err.message : "Unknown Firecrawl fetch error",
		);
	} finally {
		clearTimeout(timeoutId);
	}

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new FirecrawlRequestError(
			`Firecrawl HTTP ${response.status}: ${response.statusText}${
				body ? ` — ${body.slice(0, 200)}` : ""
			}`,
		);
	}

	const data = (await response.json()) as FirecrawlScrapeResponse;

	if (data.success === false || !data.data?.html) {
		throw new FirecrawlRequestError(
			data.error ?? "Firecrawl returned no HTML content.",
		);
	}

	return {
		html: data.data.html,
		finalUrl: data.data.metadata?.url ?? data.data.metadata?.sourceURL ?? url,
	};
}

"use node";
/**
 * scrapeCompetitor — Fetch and extract competitive intelligence from a competitor URL.
 *
 * Extracts: positioning statement, pricing tiers, key offers, differentiators.
 * Fetches through Firecrawl (see ../lib/firecrawl.ts) so JS-rendered
 * competitor sites are seen; regex parsing below runs on the rendered HTML.
 * FIRECRAWL_API_KEY absent is a named, surfaced failure on the competitor
 * profile — never a silent fallback to native fetch.
 *
 * Stores results via internal.consultantProjects.updateCompetitorProfile.
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { requireUser } from "../lib/auth";
import {
	FirecrawlKeyMissingError,
	FirecrawlRequestError,
	firecrawlScrape,
} from "../lib/firecrawl";

// ============================================================================
// PRICING PAGE DETECTION
// ============================================================================

const PRICING_PATH_PATTERNS = [
	/\/pricing/i,
	/\/plans/i,
	/\/price/i,
	/\/tarif/i,
	/\/abonnement/i,
];

function findPricingLinks(internalLinks: string[], baseUrl: string): string[] {
	const origin = new URL(baseUrl).origin;
	return internalLinks.filter((link) => {
		try {
			const parsed = new URL(link, baseUrl);
			if (!parsed.href.startsWith(origin)) return false;
			return PRICING_PATH_PATTERNS.some((p) => p.test(parsed.pathname));
		} catch {
			return false;
		}
	});
}

// ============================================================================
// HTML PARSING UTILITIES
// ============================================================================

function extractMetaContent(html: string, name: string): string | null {
	const patterns = [
		new RegExp(
			`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
			"i",
		),
		new RegExp(
			`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
			"i",
		),
		new RegExp(
			`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`,
			"i",
		),
		new RegExp(
			`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`,
			"i",
		),
	];
	for (const pattern of patterns) {
		const m = html.match(pattern);
		if (m?.[1]) return m[1].trim();
	}
	return null;
}

function extractHeadings(html: string): string[] {
	return [...html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)]
		.map((m) => m[1].replace(/<[^>]+>/g, "").trim())
		.filter((text) => text.length > 0)
		.slice(0, 15);
}

function extractLinks(html: string, baseUrl: string): string[] {
	const links: string[] = [];
	const origin = new URL(baseUrl).origin;
	const matches = [...html.matchAll(/href=["']([^"'#?]+)["']/gi)];
	for (const match of matches) {
		const href = match[1].trim();
		if (!href || href.startsWith("javascript:") || href.startsWith("mailto:"))
			continue;
		try {
			const absolute = href.startsWith("http")
				? href
				: new URL(href, baseUrl).href;
			if (absolute.startsWith(origin) && !links.includes(absolute)) {
				links.push(absolute);
			}
		} catch {
			// Malformed href — skip
		}
	}
	return links.slice(0, 30);
}

function extractParagraphs(html: string): string[] {
	return [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gi)]
		.map((m) => m[1].replace(/<[^>]+>/g, "").trim())
		.filter((text) => text.length > 30)
		.slice(0, 20);
}

// ============================================================================
// POSITIONING EXTRACTION
// ============================================================================

/**
 * Extract a positioning statement from the page.
 * Priority: og:description > meta description > first H1 + H2 combination.
 */
function extractPositioning(html: string, headings: string[]): string | null {
	const ogDesc = extractMetaContent(html, "og:description");
	if (ogDesc && ogDesc.length > 20) return ogDesc;

	const metaDesc = extractMetaContent(html, "description");
	if (metaDesc && metaDesc.length > 20) return metaDesc;

	// Combine first H1 + H2 as positioning statement
	if (headings.length >= 2) return `${headings[0]} — ${headings[1]}`;
	if (headings.length === 1) return headings[0];

	return null;
}

/**
 * Extract pricing information from a pricing page.
 * Looks for common price indicators: $, €, £, "free", "per month", plan names.
 */
function extractPricingContent(html: string): string | null {
	const pricePatterns = [
		// Currency amounts
		/[$€£]\s*\d+(?:[.,]\d{2})?(?:\s*\/\s*(?:mo|month|year|yr|an|mois))?/gi,
		// "Free" tier
		/\bfree\b.*?(?:plan|tier|forever|always)/gi,
		// Per-month text
		/\d+\s*(?:per|\/)\s*(?:month|mo|year|yr)/gi,
	];

	const found: string[] = [];
	for (const pattern of pricePatterns) {
		const matches = [...html.matchAll(pattern)];
		for (const match of matches) {
			const price = match[0].trim();
			if (!found.includes(price)) found.push(price);
		}
	}

	if (found.length === 0) return null;
	return found.slice(0, 10).join(", ");
}

/**
 * Extract key offers / features from bullet points and feature lists.
 */
function extractOffers(html: string): string | null {
	const listItems = [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gi)]
		.map((m) => m[1].replace(/<[^>]+>/g, "").trim())
		.filter((text) => text.length > 10 && text.length < 200);

	if (listItems.length === 0) return null;
	return listItems.slice(0, 10).join(" | ");
}

/**
 * Extract potential differentiators from "Why us" / "Why choose" sections.
 */
function extractDifferentiators(
	paragraphs: string[],
	headings: string[],
): string | null {
	const differentiatorKeywords =
		/\b(unique|unlike|only|first|best|leading|trusted|award|certified|proven|guarantee|fastest|easiest|most|#1|number one)\b/i;

	const relevant = [...headings, ...paragraphs].filter((text) =>
		differentiatorKeywords.test(text),
	);

	if (relevant.length === 0) return null;
	return relevant.slice(0, 5).join(" | ");
}

// ============================================================================
// FETCH HELPER
// ============================================================================

async function fetchHtml(
	url: string,
): Promise<{ html: string; finalUrl: string }> {
	return await firecrawlScrape(url);
}

/**
 * Normalize a thrown Firecrawl error (or anything else) into a message
 * string. Named error classes (FirecrawlKeyMissingError,
 * FirecrawlRequestError) are surfaced verbatim — never swallowed into a
 * generic "scrape failed" that would hide a config gap from the consultant.
 */
function describeFetchError(err: unknown): string {
	return err instanceof FirecrawlKeyMissingError ||
		err instanceof FirecrawlRequestError ||
		err instanceof Error
		? err.message
		: "Unknown Firecrawl error";
}

// ============================================================================
// ACTION
// ============================================================================

export const run = action({
	args: {
		projectId: v.id("consultantProjects"),
		competitorIndex: v.number(),
		url: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		error: v.optional(v.string()),
		// True only when FIRECRAWL_API_KEY is absent — see scrapeClient.ts run's
		// `returns` validator for the same field and rationale.
		configMissing: v.optional(v.boolean()),
	}),
	handler: async (ctx, args) => {
		// Auth check
		const identity = await requireUser(ctx);

		// Ownership check — only the project creator may trigger a competitor scrape
		const project = await ctx.runQuery(
			internal.consultantProjects.getForOwnerCheck,
			{ projectId: args.projectId },
		);
		if (!project || project.createdBy !== identity.subject) {
			return { success: false, error: "Forbidden" };
		}

		const scrapedAt = Date.now();

		// ---- Scrape main page ----
		let mainHtml: string;
		let mainFinalUrl: string;

		try {
			const result = await fetchHtml(args.url);
			mainHtml = result.html;
			mainFinalUrl = result.finalUrl;
		} catch (err) {
			const configMissing = err instanceof FirecrawlKeyMissingError;
			const errorMsg = describeFetchError(err);

			await ctx.runMutation(
				internal.consultantProjects.updateCompetitorProfile,
				{
					projectId: args.projectId,
					competitorIndex: args.competitorIndex,
					profile: {
						error: errorMsg,
						configMissing,
						scrapedAt,
					},
				},
			);
			return { success: false, error: errorMsg, configMissing };
		}

		// ---- Parse main page ----
		const headings = extractHeadings(mainHtml);
		const paragraphs = extractParagraphs(mainHtml);
		const internalLinks = extractLinks(mainHtml, mainFinalUrl);

		const positioning = extractPositioning(mainHtml, headings);
		const offers = extractOffers(mainHtml);
		const differentiators = extractDifferentiators(paragraphs, headings);

		// ---- Attempt pricing page scrape ----
		let pricing: string | null = null;

		const pricingLinks = findPricingLinks(internalLinks, mainFinalUrl);
		if (pricingLinks.length > 0) {
			try {
				const pricingResult = await fetchHtml(pricingLinks[0]);
				pricing = extractPricingContent(pricingResult.html);
				// Fallback: extract from headings/paragraphs if no price patterns found
				if (!pricing) {
					const pricingHeadings = extractHeadings(pricingResult.html);
					const pricingParagraphs = extractParagraphs(pricingResult.html);
					pricing =
						extractOffers(pricingResult.html) ??
						[...pricingHeadings, ...pricingParagraphs]
							.slice(0, 5)
							.join(" | ") ??
						null;
				}
			} catch {
				// Pricing page failed — leave as null, it's optional
			}
		} else {
			// Try to find pricing info on the main page
			pricing = extractPricingContent(mainHtml);
		}

		// ---- Store results ----
		await ctx.runMutation(internal.consultantProjects.updateCompetitorProfile, {
			projectId: args.projectId,
			competitorIndex: args.competitorIndex,
			profile: {
				positioning: positioning ?? undefined,
				pricing: pricing ?? undefined,
				offers: offers ?? undefined,
				differentiators: differentiators ?? undefined,
				scrapedAt,
			},
		});

		return { success: true };
	},
});

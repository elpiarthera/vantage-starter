"use node";
/**
 * scrapeClient — Fetch and extract brand intelligence from a client website.
 *
 * Called after project creation to auto-populate brandKit and knowledgeBase.
 * Uses native fetch + HTML parsing (no Firecrawl dependency — upgrade path noted).
 *
 * Upgrade path: when Firecrawl MCP is available, replace the fetch+parse block
 * with a Firecrawl API call for better JS-rendered content extraction.
 *
 * Stores results via internal.consultantProjects.updateBrandKit.
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { requireUser } from "../lib/auth";

// ============================================================================
// TYPES
// ============================================================================

interface BrandKit {
	name: string | null;
	tagline: string | null;
	description: string | null;
	domain: string;
	headings: string[];
	metaKeywords: string | null;
	detectedColors: string[];
	logoUrl: string | null;
	socialLinks: string[];
	scrapedAt: number;
	scrapedUrl: string;
}

interface KnowledgeBase {
	title: string | null;
	description: string | null;
	mainHeadings: string[];
	internalLinks: string[];
	externalLinks: string[];
	paragraphs: string[];
	rawTextLength: number;
}

// ============================================================================
// HTML PARSING UTILITIES
// ============================================================================

function extractMetaContent(html: string, name: string): string | null {
	// Matches both name= and property= variants (Open Graph)
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

function extractTitle(html: string): string | null {
	const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	return m?.[1]?.trim() ?? null;
}

function extractHeadings(html: string, tag: "h1" | "h2" | "h3"): string[] {
	const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "gi");
	return [...html.matchAll(regex)]
		.map((m) => m[1].replace(/<[^>]+>/g, "").trim())
		.filter((text) => text.length > 0)
		.slice(0, 10);
}

function extractLinks(
	html: string,
	baseUrl: string,
): { internal: string[]; external: string[] } {
	const internalLinks: string[] = [];
	const externalLinks: string[] = [];
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
			if (absolute.startsWith(origin)) {
				if (!internalLinks.includes(absolute)) internalLinks.push(absolute);
			} else {
				if (!externalLinks.includes(absolute)) externalLinks.push(absolute);
			}
		} catch {
			// Malformed href — skip
		}
	}
	return {
		internal: internalLinks.slice(0, 20),
		external: externalLinks.slice(0, 10),
	};
}

function extractSocialLinks(externalLinks: string[]): string[] {
	const socialDomains = [
		"twitter.com",
		"x.com",
		"linkedin.com",
		"facebook.com",
		"instagram.com",
		"youtube.com",
		"github.com",
		"tiktok.com",
	];
	return externalLinks.filter((link) =>
		socialDomains.some((d) => link.includes(d)),
	);
}

function extractLogoUrl(html: string, baseUrl: string): string | null {
	// Try og:image first
	const ogImage = extractMetaContent(html, "og:image");
	if (ogImage) {
		try {
			return new URL(ogImage, baseUrl).href;
		} catch {
			return ogImage;
		}
	}
	// Try common logo img patterns
	const logoPatterns = [
		/<img[^>]+(?:id|class|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
		/<img[^>]+src=["']([^"']*logo[^"']*)["']/i,
	];
	for (const pattern of logoPatterns) {
		const m = html.match(pattern);
		if (m?.[1]) {
			try {
				return new URL(m[1], baseUrl).href;
			} catch {
				return m[1];
			}
		}
	}
	return null;
}

function extractColors(html: string): string[] {
	// Extract hex colors from inline styles and style tags
	const matches = [...html.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)];
	const colors: string[] = [];
	for (const match of matches) {
		const color = `#${match[1].toUpperCase()}`;
		if (!colors.includes(color)) colors.push(color);
	}
	// Return top 8 most likely brand colors (skip near-white and near-black)
	return colors
		.filter((c) => {
			const hex =
				c.length === 4
					? c
							.slice(1)
							.split("")
							.map((x) => x + x)
							.join("")
					: c.slice(1);
			const r = Number.parseInt(hex.slice(0, 2), 16);
			const g = Number.parseInt(hex.slice(2, 4), 16);
			const b = Number.parseInt(hex.slice(4, 6), 16);
			const luminance = (r + g + b) / 3;
			return luminance > 20 && luminance < 235;
		})
		.slice(0, 8);
}

function extractParagraphs(html: string): string[] {
	return [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gi)]
		.map((m) => m[1].replace(/<[^>]+>/g, "").trim())
		.filter((text) => text.length > 40)
		.slice(0, 15);
}

// ============================================================================
// ACTION
// ============================================================================

export const run = action({
	args: {
		projectId: v.id("consultantProjects"),
		url: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		error: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		// Auth check
		await requireUser(ctx);

		// Mark project as scraping
		await ctx.runMutation(internal.consultantProjects.updateBrandKit, {
			projectId: args.projectId,
			brandKit: null,
			status: "scraping",
		});

		let html: string;
		let finalUrl = args.url;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 15_000);

			const response = await fetch(args.url, {
				signal: controller.signal,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (compatible; VantageBot/1.0; +https://vantagestarter.com/bot)",
					Accept:
						"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
					"Accept-Language": "en-US,en;q=0.5",
				},
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const contentType = response.headers.get("content-type") ?? "";
			if (!contentType.includes("text/html")) {
				throw new Error(
					`Unexpected content type: ${contentType}. Expected text/html.`,
				);
			}

			html = await response.text();
			finalUrl = response.url; // Capture post-redirect URL
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : "Unknown fetch error";

			// Store failure state — brandKit records the error, advance to competitors phase
			await ctx.runMutation(internal.consultantProjects.updateBrandKit, {
				projectId: args.projectId,
				brandKit: {
					error: errorMsg,
					scrapedUrl: args.url,
					scrapedAt: Date.now(),
				},
				status: "competitors",
			});

			return { success: false, error: errorMsg };
		}

		// Parse extracted data
		const parsedUrl = new URL(finalUrl);
		const domain = parsedUrl.hostname;
		const links = extractLinks(html, finalUrl);
		const h1s = extractHeadings(html, "h1");
		const h2s = extractHeadings(html, "h2");
		const paragraphs = extractParagraphs(html);

		const brandKit: BrandKit = {
			name:
				extractMetaContent(html, "og:site_name") ??
				extractTitle(html)
					?.split(/[-|–—]/)[0]
					?.trim() ??
				null,
			tagline:
				extractMetaContent(html, "og:description") ??
				extractMetaContent(html, "description") ??
				h1s[0] ??
				null,
			description:
				extractMetaContent(html, "description") ??
				extractMetaContent(html, "og:description") ??
				null,
			domain,
			headings: [...h1s, ...h2s].slice(0, 10),
			metaKeywords: extractMetaContent(html, "keywords"),
			detectedColors: extractColors(html),
			logoUrl: extractLogoUrl(html, finalUrl),
			socialLinks: extractSocialLinks(links.external),
			scrapedAt: Date.now(),
			scrapedUrl: finalUrl,
		};

		const knowledgeBase: KnowledgeBase = {
			title: extractTitle(html),
			description:
				extractMetaContent(html, "description") ??
				extractMetaContent(html, "og:description") ??
				null,
			mainHeadings: [...h1s, ...extractHeadings(html, "h2")].slice(0, 15),
			internalLinks: links.internal,
			externalLinks: links.external,
			paragraphs,
			rawTextLength: html.replace(/<[^>]+>/g, "").length,
		};

		await ctx.runMutation(internal.consultantProjects.updateBrandKit, {
			projectId: args.projectId,
			brandKit,
			knowledgeBase,
			status: "competitors",
		});

		return { success: true };
	},
});

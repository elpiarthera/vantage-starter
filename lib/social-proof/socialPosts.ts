/**
 * Example/config social-proof data for the landing page's "as seen on" strip
 * (docs/mcpcn-block-mapping.md §"Social embeds", Batch 4 social bullet —
 * `x-post` / `instagram-post` / `linkedin-post` / `youtube-post`).
 *
 * NO HARDCODED BUSINESS KNOWLEDGE: this file is a fork-replaceable content
 * fixture, not a testimonial baked into component source. A forker deleting
 * this repo's own social proof edits ONLY this array — `SocialPostCard` and
 * `SocialProofSection` never change. Each entry is shaped exactly like the
 * network's own public oEmbed response (author, text, engagement metrics,
 * optional media) — per docs/mcpcn-block-mapping.md line ~394/210/215/220/225,
 * there is no Convex table and no runtime fetch to x.com / instagram.com /
 * linkedin.com / youtube.com: the data is passed in, not fetched.
 */

export type SocialNetwork = "x" | "instagram" | "linkedin" | "youtube";

export type SocialPostMetricKind = "likes" | "comments" | "shares" | "views";

export interface SocialPostMetric {
	kind: SocialPostMetricKind;
	/** Pre-formatted count, e.g. "1.2K" — display value, not a raw number. */
	value: string;
}

export interface SocialPostAuthor {
	name: string;
	/** Handle/username shown under the author name, e.g. "@handle". */
	handle?: string;
	avatarUrl?: string;
}

export interface SocialPostMedia {
	/** Image or video thumbnail this card renders. */
	thumbnailUrl: string;
	alt: string;
}

export interface SocialPostData {
	id: string;
	network: SocialNetwork;
	author: SocialPostAuthor;
	text: string;
	/** Canonical URL of the original post — the card links out here. */
	url: string;
	publishedAt: string;
	metrics: SocialPostMetric[];
	media?: SocialPostMedia;
}

/**
 * Replace these four entries with your own project's real posts before
 * shipping. Each `id` must stay unique; `network` drives the card's icon,
 * accent, and accessible label — it does not change any other field's shape.
 */
export const SOCIAL_PROOF_POSTS: SocialPostData[] = [
	{
		id: "x-launch-week",
		network: "x",
		author: {
			name: "Alex Rivera",
			handle: "@alexbuilds",
		},
		text: "Shipped a full SaaS backend in a weekend with VantageStarter — Convex + Clerk + Polar wired out of the box. This is the boilerplate I wish existed two years ago.",
		url: "https://x.com/alexbuilds/status/1234567890",
		publishedAt: "2026-05-12",
		metrics: [
			{ kind: "likes", value: "482" },
			{ kind: "comments", value: "37" },
			{ kind: "shares", value: "96" },
		],
	},
	{
		id: "instagram-studio-tour",
		network: "instagram",
		author: {
			name: "Nadia Chen",
			handle: "@nadia.codes",
		},
		text: "Behind the scenes: our indie team's dashboard, built entirely on VantageStarter's dashboard shell. Real-time everything, zero backend boilerplate.",
		url: "https://instagram.com/p/CxSampleShortcode/",
		publishedAt: "2026-04-03",
		metrics: [
			{ kind: "likes", value: "1.1K" },
			{ kind: "comments", value: "58" },
		],
		media: {
			thumbnailUrl: "/placeholder.svg",
			alt: "A small studio team gathered around a laptop showing a live dashboard",
		},
	},
	{
		id: "linkedin-case-study",
		network: "linkedin",
		author: {
			name: "Marcus Ohene",
			handle: "Founder, Ledgerly",
		},
		text: "We replaced a 6-week custom auth + billing build with VantageStarter's Clerk and Polar integration. Our team shipped the actual product instead of plumbing — highly recommend for any B2B SaaS team evaluating a starting point.",
		url: "https://www.linkedin.com/posts/marcusohene_saas-buildinpublic-activity-1234567890",
		publishedAt: "2026-03-21",
		metrics: [
			{ kind: "likes", value: "312" },
			{ kind: "comments", value: "24" },
			{ kind: "shares", value: "41" },
		],
	},
	{
		id: "youtube-walkthrough",
		network: "youtube",
		author: {
			name: "VantageStarter",
			handle: "@vantagestarter",
		},
		text: "5-minute walkthrough: from `npx create-vantage-app` to a deployed, authenticated, billable SaaS.",
		url: "https://www.youtube.com/watch?v=sampleVideoId",
		publishedAt: "2026-02-14",
		metrics: [
			{ kind: "views", value: "18.4K" },
			{ kind: "likes", value: "742" },
		],
		media: {
			thumbnailUrl: "/placeholder.svg",
			alt: "Video thumbnail: a terminal window running the create-vantage-app command",
		},
	},
];

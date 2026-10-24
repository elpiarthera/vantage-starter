/**
 * Fork-supplied social-proof data for the landing page's "as seen on" strip
 * (docs/mcpcn-block-mapping.md §"Social embeds", Batch 4 social bullet —
 * `x-post` / `instagram-post` / `linkedin-post` / `youtube-post`).
 *
 * NO HARDCODED BUSINESS KNOWLEDGE: this file is a fork-replaceable content
 * slot, not a testimonial baked into component source. A forker adding
 * their own social proof edits ONLY this array — `SocialPostCard` and
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
 * Ships EMPTY on purpose. The template carries no social content: invented
 * endorsements naming real people, or links to real profiles, would be
 * fabricated testimonials. A fork fills this array with ITS OWN real, consented
 * posts; each `id` must stay unique, and `network` drives the card's icon,
 * accent, and accessible label. While the array is empty,
 * `SocialProofSection` renders nothing at all.
 */
export const SOCIAL_PROOF_POSTS: SocialPostData[] = [];

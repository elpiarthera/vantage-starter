/**
 * Guards the shipped `SOCIAL_PROOF_POSTS` list. `SocialProofSection.test.tsx`
 * renders the card from its own fixtures, so it cannot notice a network being
 * dropped from the data the landing page actually ships. This file can.
 * Pure data assertions: no render, no network call.
 */
import {
	SOCIAL_PROOF_POSTS,
	type SocialNetwork,
} from "@/lib/social-proof/socialPosts";

const PROMISED_NETWORKS: SocialNetwork[] = [
	"x",
	"instagram",
	"linkedin",
	"youtube",
];

describe("SOCIAL_PROOF_POSTS", () => {
	test("covers exactly the four promised networks, one card each", () => {
		const networks = SOCIAL_PROOF_POSTS.map((post) => post.network);
		expect([...networks].sort()).toEqual([...PROMISED_NETWORKS].sort());
	});

	test("ids are unique", () => {
		const ids = SOCIAL_PROOF_POSTS.map((post) => post.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	test.each(
		SOCIAL_PROOF_POSTS.map((post) => [post.network, post] as const),
	)("%s entry carries every field the card renders", (_network, post) => {
		expect(post.author.name.trim()).not.toBe("");
		expect(post.text.trim()).not.toBe("");
		expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
		expect(post.metrics.length).toBeGreaterThan(0);
		for (const metric of post.metrics) {
			expect(metric.value.trim()).not.toBe("");
		}
		// Link-out only: a canonical https URL, never fetched at runtime.
		expect(new URL(post.url).protocol).toBe("https:");
		if (post.media) {
			expect(post.media.thumbnailUrl.trim()).not.toBe("");
			expect(post.media.alt.trim()).not.toBe("");
		}
	});
});

/**
 * Guards the shipped `SOCIAL_PROOF_POSTS` default. The template ships NO
 * social content: invented endorsements naming real people or linking to real
 * profiles would be fabricated testimonials. A fork fills the list with its
 * own real, consented posts; `validateSocialPosts` is the reusable shape check
 * a fork can run against whatever it adds. Pure data assertions: no render,
 * no network call.
 */
import {
	SOCIAL_PROOF_POSTS,
	type SocialPostData,
} from "@/lib/social-proof/socialPosts";

function validateSocialPosts(posts: SocialPostData[]): void {
	const ids = posts.map((post) => post.id);
	expect(new Set(ids).size).toBe(ids.length);
	for (const post of posts) {
		expect(post.author.name.trim()).not.toBe("");
		expect(post.text.trim()).not.toBe("");
		expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
		expect(post.metrics.length).toBeGreaterThan(0);
		for (const metric of post.metrics) {
			expect(metric.value.trim()).not.toBe("");
		}
		expect(new URL(post.url).protocol).toBe("https:");
		if (post.media) {
			expect(post.media.thumbnailUrl.trim()).not.toBe("");
			expect(post.media.alt.trim()).not.toBe("");
		}
	}
}

describe("SOCIAL_PROOF_POSTS", () => {
	test("ships empty: no fabricated testimonials in the template", () => {
		expect(SOCIAL_PROOF_POSTS).toHaveLength(0);
	});

	test("whatever a fork adds satisfies the shape and https rules", () => {
		validateSocialPosts(SOCIAL_PROOF_POSTS);
	});

	test("the validator rejects a non-https url", () => {
		const bad: SocialPostData = {
			id: "example-bad",
			network: "x",
			author: { name: "Example Author", handle: "@example" },
			text: "Example text.",
			url: "http://example.com/post/1",
			publishedAt: "2026-01-01",
			metrics: [{ kind: "likes", value: "1" }],
		};
		expect(() => validateSocialPosts([bad])).toThrow();
	});
});

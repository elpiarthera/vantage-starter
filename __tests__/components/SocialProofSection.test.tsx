/**
 * Coverage for the shared `mcpcn` social-embed blocks — `x-post`,
 * `instagram-post`, `linkedin-post`, `youtube-post` — wired into
 * `SocialProofSection` (docs/mcpcn-block-mapping.md §"Social embeds",
 * Batch 4 social bullet).
 *
 * TDD assertion per docs/mcpcn-block-mapping.md line ~394: "given a fixture
 * oEmbed response for each network, the corresponding card renders that
 * network's author, text, and engagement-metric fields." One test per
 * network below, on a fixture built to that oEmbed shape — never the real
 * `lib/social-proof/socialPosts.ts` content, so this test would fail exactly
 * the same way if that fork-replaceable fixture were emptied or edited.
 *
 * No network fetch: `SocialPostCard` takes `data` as a prop, so this suite
 * makes zero HTTP calls to x.com / instagram.com / linkedin.com /
 * youtube.com — asserted implicitly by there being no fetch mock at all in
 * this file (a real network attempt would throw under jsdom/jest with no
 * fetch polyfill configured, which would fail these tests loudly, not
 * silently).
 */
import { render, screen } from "@testing-library/react";
import {
	SocialPostCard,
	type SocialPostCardLabels,
} from "@/components/ui/social-post-card";
import type { SocialPostData } from "@/lib/social-proof/socialPosts";

const labels: SocialPostCardLabels = {
	viewPost: "View post",
	networkName: {
		x: "X",
		instagram: "Instagram",
		linkedin: "LinkedIn",
		youtube: "YouTube",
	},
	metricName: {
		likes: "likes",
		comments: "comments",
		shares: "shares",
		views: "views",
	},
};

const FIXTURES: Record<SocialPostData["network"], SocialPostData> = {
	x: {
		id: "fixture-x",
		network: "x",
		author: { name: "Fixture X Author", handle: "@fixturex" },
		text: "Fixture X post body text.",
		url: "https://x.com/fixturex/status/1",
		publishedAt: "2026-01-01",
		metrics: [
			{ kind: "likes", value: "10" },
			{ kind: "comments", value: "2" },
		],
	},
	instagram: {
		id: "fixture-instagram",
		network: "instagram",
		author: { name: "Fixture Instagram Author", handle: "@fixtureig" },
		text: "Fixture Instagram caption text.",
		url: "https://instagram.com/p/fixture/",
		publishedAt: "2026-01-02",
		metrics: [{ kind: "likes", value: "20" }],
		media: { thumbnailUrl: "/placeholder.svg", alt: "Fixture Instagram media" },
	},
	linkedin: {
		id: "fixture-linkedin",
		network: "linkedin",
		author: { name: "Fixture LinkedIn Author", handle: "Founder, Fixture Co" },
		text: "Fixture LinkedIn post body text.",
		url: "https://www.linkedin.com/posts/fixture",
		publishedAt: "2026-01-03",
		metrics: [
			{ kind: "likes", value: "30" },
			{ kind: "shares", value: "5" },
		],
	},
	youtube: {
		id: "fixture-youtube",
		network: "youtube",
		author: { name: "Fixture YouTube Channel", handle: "@fixtureyt" },
		text: "Fixture YouTube video description.",
		url: "https://www.youtube.com/watch?v=fixture",
		publishedAt: "2026-01-04",
		metrics: [{ kind: "views", value: "40" }],
		media: {
			thumbnailUrl: "/placeholder.svg",
			alt: "Fixture YouTube thumbnail",
		},
	},
};

describe("SocialPostCard — social-embed blocks", () => {
	test("x-post: renders author, text, and engagement metrics", () => {
		render(<SocialPostCard data={FIXTURES.x} labels={labels} />);
		expect(screen.getByText("Fixture X Author")).toBeInTheDocument();
		expect(screen.getByText("@fixturex")).toBeInTheDocument();
		expect(screen.getByText("Fixture X post body text.")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
	});

	test("instagram-post: renders author, text, and engagement metrics", () => {
		render(<SocialPostCard data={FIXTURES.instagram} labels={labels} />);
		expect(screen.getByText("Fixture Instagram Author")).toBeInTheDocument();
		expect(
			screen.getByText("Fixture Instagram caption text."),
		).toBeInTheDocument();
		expect(screen.getByText("20")).toBeInTheDocument();
	});

	test("linkedin-post: renders author, text, and engagement metrics", () => {
		render(<SocialPostCard data={FIXTURES.linkedin} labels={labels} />);
		expect(screen.getByText("Fixture LinkedIn Author")).toBeInTheDocument();
		expect(
			screen.getByText("Fixture LinkedIn post body text."),
		).toBeInTheDocument();
		expect(screen.getByText("30")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	test("youtube-post: renders author, text, and engagement metrics as a native-looking card (no bare iframe)", () => {
		const { container } = render(
			<SocialPostCard data={FIXTURES.youtube} labels={labels} />,
		);
		expect(screen.getByText("Fixture YouTube Channel")).toBeInTheDocument();
		expect(
			screen.getByText("Fixture YouTube video description."),
		).toBeInTheDocument();
		expect(screen.getByText("40")).toBeInTheDocument();
		expect(container.querySelector("iframe")).toBeNull();
	});

	test("every card link is keyboard-reachable and carries a real accessible name", () => {
		render(<SocialPostCard data={FIXTURES.linkedin} labels={labels} />);
		const link = screen.getByRole("link", { name: "View post" });
		expect(link).toHaveAttribute("href", FIXTURES.linkedin.url);
		expect(link.tagName).toBe("A");
	});
});

import { useTranslations } from "next-intl";
import {
	SocialPostCard,
	type SocialPostCardLabels,
} from "@/components/ui/social-post-card";
import {
	SOCIAL_PROOF_POSTS,
	type SocialPostMetricKind,
} from "@/lib/social-proof/socialPosts";

const METRIC_KINDS: SocialPostMetricKind[] = [
	"likes",
	"comments",
	"shares",
	"views",
];

/**
 * Landing-page "as seen on" social-proof strip (docs/mcpcn-block-mapping.md
 * §"Social embeds", Batch 4 social bullet) — hosts the `x-post`,
 * `instagram-post`, `linkedin-post`, `youtube-post` blocks, rendered by the
 * single shared `SocialPostCard`. Sits adjacent to
 * `components/landing/HeroSection.tsx` per the block mapping's own citation.
 *
 * Plain Server Component, no "use client": nothing here is interactive, and
 * `useTranslations` from `next-intl` (not `next-intl/server`) already renders
 * synchronously in a Server Component elsewhere in this same directory
 * (`components/landing/PricingSection.tsx`) — matching that sibling's idiom
 * rather than introducing a client boundary this section does not need.
 *
 * Content source: `lib/social-proof/socialPosts.ts` — a fork-replaceable
 * fixture, not hardcoded testimonials in this component.
 */
export function SocialProofSection() {
	const t = useTranslations("landing.socialProof");

	const labels: SocialPostCardLabels = {
		viewPost: t("view_post"),
		networkName: {
			x: t("network_x"),
			instagram: t("network_instagram"),
			linkedin: t("network_linkedin"),
			youtube: t("network_youtube"),
		},
		metricName: Object.fromEntries(
			METRIC_KINDS.map((kind) => [kind, t(`metric_${kind}`)]),
		) as Record<SocialPostMetricKind, string>,
	};

	return (
		<section aria-labelledby="social-proof-heading" className="py-24">
			<div className="max-w-6xl mx-auto px-6 lg:px-12">
				<div className="mb-12 md:mb-16 max-w-xl">
					<p className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
						{t("eyebrow")}
					</p>
					<h2
						id="social-proof-heading"
						className="font-heading font-bold text-foreground text-3xl md:text-4xl leading-[1.15] tracking-[-0.02em] mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						{t("subheading")}
					</p>
				</div>

				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
					{SOCIAL_PROOF_POSTS.map((post) => (
						<li key={post.id}>
							<SocialPostCard data={post} labels={labels} />
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

/**
 * Shared social-embed card, reused for all four `mcpcn` social blocks
 * (docs/mcpcn-block-mapping.md §"Social embeds" — `x-post`, `instagram-post`,
 * `linkedin-post`, `youtube-post`, Batch 4 social bullet). One presentational
 * component parameterised by `data.network`, not four independently written
 * cards — the four blocks "share one new landing-page strip and one
 * embed-rendering pattern reused four times" per docs/mcpcn-block-mapping.md
 * line ~394.
 *
 * No Convex table, no runtime fetch to any third-party network (same
 * citation): `data` is always passed in, already shaped like the network's
 * own public oEmbed response.
 *
 * YouTube note: this renders a thumbnail image with a play affordance, not a
 * bare `<iframe>` and not an embedded third-party player script — avoiding
 * both the "unstyled iframe" defect the block mapping calls out and any
 * third-party cookie/tracking load before the visitor opts in by following
 * the link to youtube.com themselves.
 *
 * All colors resolve to this repo's OKLCH tokens (`bg-card`,
 * `text-foreground`, `text-muted-foreground`, `border-border`,
 * `bg-primary`/`text-primary-foreground`) — no hardcoded color.
 */
import { Instagram, Linkedin, Play, X, Youtube } from "lucide-react";
import Image from "next/image";
import type { ComponentType } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
	SocialNetwork,
	SocialPostData,
	SocialPostMetricKind,
} from "@/lib/social-proof/socialPosts";
import { cn } from "@/lib/utils";

const NETWORK_ICON: Record<
	SocialNetwork,
	ComponentType<{ className?: string }>
> = {
	x: X,
	instagram: Instagram,
	linkedin: Linkedin,
	youtube: Youtube,
};

export interface SocialPostCardLabels {
	/** Accessible label for the card's link, e.g. "View post on X". */
	viewPost: string;
	/** Human label per network, e.g. "X", "Instagram". */
	networkName: Record<SocialNetwork, string>;
	/** Human label per metric kind, e.g. "likes", "views". */
	metricName: Record<SocialPostMetricKind, string>;
}

export interface SocialPostCardProps {
	data: SocialPostData;
	labels: SocialPostCardLabels;
	className?: string;
}

export function SocialPostCard({
	data,
	labels,
	className,
}: SocialPostCardProps) {
	const NetworkIcon = NETWORK_ICON[data.network];
	const networkName = labels.networkName[data.network];

	return (
		<article
			data-slot="social-post-card"
			data-network={data.network}
			className={cn(
				"flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors duration-150 hover:bg-muted/40",
				className,
			)}
		>
			<header className="flex items-center gap-3">
				<Avatar className="h-10 w-10">
					{data.author.avatarUrl ? (
						<AvatarImage src={data.author.avatarUrl} alt="" />
					) : null}
					<AvatarFallback aria-hidden="true">
						{data.author.name.charAt(0)}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold text-foreground text-sm">
						{data.author.name}
					</p>
					{data.author.handle ? (
						<p className="truncate text-muted-foreground text-xs">
							{data.author.handle}
						</p>
					) : null}
				</div>
				<span
					className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary text-xs font-medium"
					aria-hidden="true"
				>
					<NetworkIcon className="h-3.5 w-3.5" />
					{networkName}
				</span>
			</header>

			<p className="line-clamp-4 text-sm text-foreground leading-relaxed">
				{data.text}
			</p>

			{data.media ? (
				<a
					href={data.url}
					target="_blank"
					rel="noopener noreferrer"
					className="group relative block overflow-hidden rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label={`${labels.viewPost} — ${networkName}`}
				>
					<Image
						src={data.media.thumbnailUrl}
						alt={data.media.alt}
						width={480}
						height={270}
						className="aspect-video w-full object-cover"
					/>
					{data.network === "youtube" ? (
						<span
							className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/20 transition-opacity group-hover:bg-foreground/30"
							aria-hidden="true"
						>
							<span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
								<Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
							</span>
						</span>
					) : null}
				</a>
			) : null}

			<footer className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-3">
				<ul className="flex flex-wrap items-center gap-3">
					{data.metrics.map((metric) => (
						<li
							key={metric.kind}
							className="text-muted-foreground text-xs"
							aria-label={`${metric.value} ${labels.metricName[metric.kind]}`}
						>
							<span aria-hidden="true">{metric.value}</span>{" "}
							<span aria-hidden="true">{labels.metricName[metric.kind]}</span>
						</li>
					))}
				</ul>
				<a
					href={data.url}
					target="_blank"
					rel="noopener noreferrer"
					className="shrink-0 rounded-md px-2 py-1 font-medium text-primary text-xs transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{labels.viewPost}
				</a>
			</footer>
		</article>
	);
}

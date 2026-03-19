"use client";

import { useQuery } from "convex/react";
import {
	AlertCircle,
	Copy,
	Facebook,
	Loader2,
	MessageCircle,
	Share2,
	Sparkles,
	Twitter,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/routing";

interface PublicWatchClientProps {
	projectId: Id<"projects">;
}

export function PublicWatchClient({ projectId }: PublicWatchClientProps) {
	const t = useTranslations("watch_page");

	// Fetch public project data (no auth required!)
	const project = useQuery(api.projects.getPublic, { projectId });
	const [copyToast, setCopyToast] = useState(false);

	// Loading state
	if (project === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
					<p className="text-sm text-muted-foreground">{t("video_loading")}</p>
				</div>
			</div>
		);
	}

	// Not found or not public
	if (project === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background px-4">
				<Card className="max-w-md border-border bg-card">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<AlertCircle className="h-12 w-12 text-destructive mb-4" />
						<h3 className="text-lg font-semibold mb-2">
							{t("video_not_found_title")}
						</h3>
						<p className="text-sm text-muted-foreground mb-6">
							{t("video_not_found_description")}
						</p>
						<Button asChild>
							<Link href="/">{t("go_home")}</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Share handlers
	const shareUrl = typeof window !== "undefined" ? window.location.href : "";

	const shareToWhatsApp = () => {
		const message = t("share_whatsapp_message", { name: project.name });
		window.open(
			`https://wa.me/?text=${encodeURIComponent(`${message} ${shareUrl}`)}`,
			"_blank",
		);
	};

	const shareToTwitter = () => {
		const text = t("share_twitter_message", { name: project.name });
		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
			"_blank",
		);
	};

	const shareToFacebook = () => {
		window.open(
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
			"_blank",
		);
	};

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopyToast(true);
			setTimeout(() => setCopyToast(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<main className="flex flex-col items-center px-4 py-6 md:py-10">
				<div className="w-full max-w-4xl space-y-6 md:space-y-8">
					{/* Video Player Section */}
					<div className="relative w-full overflow-hidden rounded-lg bg-black">
						<div className="relative aspect-video">
							<video
								src={project.finalVideoUrl}
								controls
								preload="metadata"
								poster={project.thumbnailUrl || undefined}
								className="w-full h-full object-contain"
								aria-label={`Video: ${project.eventDetails.eventTitle}`}
							>
								<track kind="captions" />
							</video>
						</div>
					</div>

					{/* Event Details */}
					<Card className="border-border bg-card">
						<CardHeader className="space-y-3">
							<CardTitle className="text-3xl md:text-4xl font-bold leading-tight">
								{project.eventDetails.eventTitle}
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								{t("created_with")}
							</p>
						</CardHeader>
						{project.eventDetails.description && (
							<CardContent>
								<p className="text-base leading-relaxed text-muted-foreground">
									{project.eventDetails.description}
								</p>
							</CardContent>
						)}
					</Card>

					{/* Share Actions */}
					<Card className="border-border bg-card">
						<CardHeader>
							<CardTitle className="text-xl flex items-center gap-2">
								<Share2 className="h-5 w-5" />
								{t("share_title")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{/* biome-ignore lint/a11y/useSemanticElements: Using div with role=group for share buttons is acceptable for this layout - fieldset would add unnecessary semantic weight */}
							<div
								className="flex flex-wrap gap-3"
								role="group"
								aria-label={t("share_title")}
							>
								<Button
									variant="outline"
									className="min-h-[44px] border-border hover:bg-secondary transition-smooth"
									onClick={shareToWhatsApp}
								>
									<MessageCircle className="h-5 w-5 mr-2" />
									{t("share_whatsapp")}
								</Button>
								<Button
									variant="outline"
									className="min-h-[44px] border-border hover:bg-secondary transition-smooth"
									onClick={shareToTwitter}
								>
									<Twitter className="h-5 w-5 mr-2" />
									{t("share_twitter")}
								</Button>
								<Button
									variant="outline"
									className="min-h-[44px] border-border hover:bg-secondary transition-smooth"
									onClick={shareToFacebook}
								>
									<Facebook className="h-5 w-5 mr-2" />
									{t("share_facebook")}
								</Button>
								<Button
									variant="outline"
									className="min-h-[44px] border-border hover:bg-secondary transition-smooth"
									onClick={copyLink}
								>
									<Copy className="h-5 w-5 mr-2" />
									{copyToast ? t("link_copied") : t("copy_link")}
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Create Your Own CTA */}
					<div className="flex flex-col items-center gap-4 py-8 md:py-12 text-center">
						<div className="space-y-2">
							<h2 className="text-2xl md:text-3xl font-bold">
								{t("cta_title")}
							</h2>
							<p className="text-base text-muted-foreground leading-relaxed">
								{t("cta_description")}
							</p>
						</div>
						<Button
							size="lg"
							className="min-h-[56px] px-8 text-lg font-semibold bg-primary hover:bg-primary/90 transition-smooth active:scale-98"
							asChild
						>
							<Link href="/guided/step-1">
								<Sparkles className="h-5 w-5 mr-2" />
								{t("cta_button")}
							</Link>
						</Button>
					</div>
				</div>
			</main>
		</div>
	);
}

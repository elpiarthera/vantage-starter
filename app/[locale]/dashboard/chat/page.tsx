"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

function SkeletonRow() {
	return (
		<div className="flex items-center justify-between px-4 py-3 border-b border-border">
			<div className="h-4 w-48 rounded bg-muted animate-pulse" />
			<div className="h-4 w-24 rounded bg-muted animate-pulse" />
		</div>
	);
}

function PinIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
		</svg>
	);
}

function formatDate(ts: number): string {
	const d = new Date(ts);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffDays === 0) {
		return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}
	if (diffDays < 7) {
		return d.toLocaleDateString([], { weekday: "short" });
	}
	return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatListPage() {
	const t = useTranslations("chat");
	const router = useRouter();
	const params = useParams();
	const locale = typeof params?.locale === "string" ? params.locale : "en";

	const [search, setSearch] = useState("");
	const [creating, setCreating] = useState(false);

	const result = useQuery(api.chats.list, { limit: 30 });
	const createChat = useMutation(api.chats.create);
	const defaultWorkspaceId = useQuery(api.workspaces.getDefault);

	const isLoading = result === undefined;
	const chats = result?.chats ?? [];

	const filtered = search.trim()
		? chats.filter((c) =>
				c.title.toLowerCase().includes(search.trim().toLowerCase()),
			)
		: chats;

	const pinnedChats = filtered.filter((c) => c.isPinned);
	const unpinnedChats = filtered.filter((c) => !c.isPinned);
	const sorted = [...pinnedChats, ...unpinnedChats];

	async function handleNewChat() {
		if (!defaultWorkspaceId || creating) return;
		setCreating(true);
		try {
			const chatId = await createChat({
				workspaceId: defaultWorkspaceId,
				title: t("newChat"),
			});
			router.push(`/${locale}/dashboard/chat/${chatId}`);
		} finally {
			setCreating(false);
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-3xl px-4 py-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-semibold text-foreground font-[var(--font-space-grotesk)]">
						{t("title")}
					</h1>
					<button
						type="button"
						onClick={handleNewChat}
						disabled={creating || !defaultWorkspaceId}
						className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						{t("newChat")}
					</button>
				</div>

				{/* Search */}
				<div className="relative mb-6">
					<div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-muted-foreground"
							aria-hidden="true"
						>
							<circle cx="11" cy="11" r="8" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
					</div>
					<input
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("searchPlaceholder")}
						className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow duration-150"
					/>
				</div>

				{/* Chat list */}
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					{isLoading ? (
						<>
							<SkeletonRow />
							<SkeletonRow />
							<SkeletonRow />
							<SkeletonRow />
							<SkeletonRow />
						</>
					) : sorted.length === 0 ? (
						/* Empty state */
						<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
							<div className="mb-4 rounded-full bg-muted p-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-muted-foreground"
									aria-hidden="true"
								>
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
								</svg>
							</div>
							<p className="text-muted-foreground text-sm mb-4">
								{t("noChats")}
							</p>
							<button
								type="button"
								onClick={handleNewChat}
								disabled={creating || !defaultWorkspaceId}
								className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							>
								{t("newChat")}
							</button>
						</div>
					) : (
						<ul>
							{sorted.map((chat, idx) => (
								<li
									key={chat._id}
									className={
										idx < sorted.length - 1
											? "border-b border-border"
											: undefined
									}
								>
									<Link
										href={`/${locale}/dashboard/chat/${chat._id}`}
										className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
									>
										<div className="flex items-center gap-2 min-w-0">
											{chat.isPinned && (
												<span
													className="text-primary shrink-0"
													title={t("pinned")}
												>
													<PinIcon />
												</span>
											)}
											<span className="truncate text-sm font-medium text-foreground">
												{chat.title}
											</span>
										</div>
										<span className="shrink-0 text-xs text-muted-foreground">
											{formatDate(chat.updatedAt ?? chat._creationTime)}
										</span>
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}

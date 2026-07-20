"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Link, useRouter } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

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

function FolderIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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

	const [search, setSearch] = useState("");
	const [creating, setCreating] = useState(false);
	const [selectedProjectId, setSelectedProjectId] = useState<
		Id<"projects"> | ""
	>("");
	const [renamingChatId, setRenamingChatId] = useState<Id<"chats"> | null>(
		null,
	);
	const [renameValue, setRenameValue] = useState("");
	const updateChat = useMutation(api.chats.update);

	// All chats — used when no project filter is active
	const allChatsResult = useQuery(
		api.chats.list,
		selectedProjectId === "" ? { limit: 30 } : "skip",
	);

	// Project-filtered chats — used when a project is selected
	const projectChatsResult = useQuery(
		api.chats.listByProject,
		selectedProjectId !== ""
			? { projectId: selectedProjectId, limit: 30 }
			: "skip",
	);

	const createChat = useMutation(api.chats.create);
	const defaultWorkspaceId = useQuery(api.workspaces.getDefault);

	// Projects list — no args needed, resolves default workspace automatically
	const projects = useQuery(api.projects.list, {});

	const activeResult =
		selectedProjectId === "" ? allChatsResult : projectChatsResult;
	const isLoading = activeResult === undefined;
	const chats = activeResult?.chats ?? [];

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
				// No title constant burned in at creation — the chat's first
				// exchange derives its own name (see convex/messages.ts save()).
				// The UI falls back to a translated placeholder until then.
				title: "",
				projectId: selectedProjectId !== "" ? selectedProjectId : undefined,
			});
			router.push(ROUTES.dashboardChatSession(chatId));
		} finally {
			setCreating(false);
		}
	}

	function startRenaming(chatId: Id<"chats">, currentTitle: string) {
		setRenamingChatId(chatId);
		setRenameValue(currentTitle);
	}

	async function commitRename(chatId: Id<"chats">) {
		const trimmed = renameValue.trim();
		setRenamingChatId(null);
		if (trimmed.length === 0) return;
		await updateChat({ id: chatId, title: trimmed });
	}

	const hasProjects = projects !== undefined && projects.length > 0;

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

				{/* Search + Project filter */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
					<div className="relative flex-1">
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

					{/* Project filter — only shown when projects exist */}
					{hasProjects && (
						<div className="relative sm:w-48 shrink-0">
							<div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
								<FolderIcon />
							</div>
							<select
								value={selectedProjectId}
								onChange={(e) => {
									const val = e.target.value;
									setSelectedProjectId(
										val === "" ? "" : (val as Id<"projects">),
									);
								}}
								aria-label={t("filterByProject")}
								className="w-full appearance-none rounded-lg border border-border bg-card pl-9 pr-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow duration-150 cursor-pointer data-[active=false]:text-muted-foreground"
							>
								<option value="">{t("allProjects")}</option>
								{projects.map((project) => (
									<option key={project._id} value={project._id}>
										{project.icon ? `${project.icon} ` : ""}
										{project.name}
									</option>
								))}
							</select>
							{/* Custom chevron */}
							<div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<polyline points="6 9 12 15 18 9" />
								</svg>
							</div>
						</div>
					)}
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
									<div className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50 transition-colors duration-100">
										{renamingChatId === chat._id ? (
											<input
												type="text"
												value={renameValue}
												onChange={(e) => setRenameValue(e.target.value)}
												onBlur={() => commitRename(chat._id)}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.currentTarget.blur();
													} else if (e.key === "Escape") {
														setRenamingChatId(null);
													}
												}}
												ref={(el) => el?.focus()}
												aria-label={t("rename")}
												className="flex-1 min-w-0 rounded-md border border-primary bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
											/>
										) : (
											<Link
												href={ROUTES.dashboardChatSession(chat._id)}
												className="flex flex-1 items-center gap-2 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded-md"
											>
												{chat.isPinned && (
													<span
														className="text-primary shrink-0"
														title={t("pinned")}
													>
														<PinIcon />
													</span>
												)}
												<span className="truncate text-sm font-medium text-foreground">
													{chat.title || t("newChat")}
												</span>
											</Link>
										)}
										<span className="shrink-0 text-xs text-muted-foreground">
											{formatDate(chat.updatedAt ?? chat._creationTime)}
										</span>
										{renamingChatId !== chat._id && (
											<button
												type="button"
												onClick={() =>
													startRenaming(chat._id, chat.title || "")
												}
												aria-label={t("rename")}
												className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
													aria-hidden="true"
												>
													<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
													<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
												</svg>
											</button>
										)}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}

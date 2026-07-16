"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type ViewType = "board" | "list" | "timeline";

interface ViewOptionsProps {
	viewType: ViewType;
	onChange: (viewType: ViewType) => void;
	allowedViews?: ViewType[];
}

// Inline SVGs replacing lucide-react icons

function IconSettings({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

function IconList({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<line x1="8" x2="21" y1="6" y2="6" />
			<line x1="8" x2="21" y1="12" y2="12" />
			<line x1="8" x2="21" y1="18" y2="18" />
			<line x1="3" x2="3.01" y1="6" y2="6" />
			<line x1="3" x2="3.01" y1="12" y2="12" />
			<line x1="3" x2="3.01" y1="18" y2="18" />
		</svg>
	);
}

function IconLayoutGrid({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<rect width="7" height="7" x="3" y="3" rx="1" />
			<rect width="7" height="7" x="14" y="3" rx="1" />
			<rect width="7" height="7" x="14" y="14" rx="1" />
			<rect width="7" height="7" x="3" y="14" rx="1" />
		</svg>
	);
}

function IconBarChart({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<line x1="18" x2="18" y1="20" y2="10" />
			<line x1="12" x2="12" y1="20" y2="4" />
			<line x1="6" x2="6" y1="20" y2="14" />
		</svg>
	);
}

type ViewConfig = {
	id: ViewType;
	Icon: (props: { className?: string }) => React.ReactElement;
};

const VIEW_TYPES: ViewConfig[] = [
	{ id: "board", Icon: IconLayoutGrid },
	{ id: "list", Icon: IconList },
	{ id: "timeline", Icon: IconBarChart },
];

export function ViewOptions({
	viewType,
	onChange,
	allowedViews,
}: ViewOptionsProps) {
	const t = useTranslations("missions.view_options");
	const [open, setOpen] = useState(false);

	const availableViews = VIEW_TYPES.filter(
		(v) => !allowedViews || allowedViews.includes(v.id),
	);

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted min-h-[44px]"
			>
				<IconSettings className="size-4" />
				<span className="hidden sm:inline">{t("view")}</span>
			</button>

			{open && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setOpen(false)}
						aria-hidden="true"
					/>

					{/* Popover panel */}
					<div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-3 shadow-lg">
						<div className="flex rounded-lg bg-muted p-1">
							{availableViews.map((type) => (
								<button
									key={type.id}
									type="button"
									onClick={() => {
										onChange(type.id);
										setOpen(false);
									}}
									className={cn(
										"flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 px-3 text-xs font-medium transition-colors",
										viewType === type.id
											? "bg-accent text-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<type.Icon className="size-5" />
									{t(type.id)}
								</button>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

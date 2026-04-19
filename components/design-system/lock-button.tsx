"use client";

import { type LockableParam, useLocks } from "@/hooks/use-locks";
import { cn } from "@/lib/utils";

export function LockButton({
	param,
	className,
}: {
	param: LockableParam;
	className?: string;
}) {
	const { isLocked, toggleLock } = useLocks();
	const locked = isLocked(param);

	return (
		<button
			type="button"
			title={locked ? "Unlock" : "Lock"}
			aria-label={locked ? "Unlock" : "Lock"}
			onClick={() => toggleLock(param)}
			data-locked={locked}
			className={cn(
				"flex size-4 cursor-pointer items-center justify-center rounded opacity-0 ring-foreground/60 transition-opacity outline-none",
				"group-focus-within/picker:opacity-100 group-hover/picker:opacity-100 focus:opacity-100 focus-visible:ring-1",
				"data-[locked=true]:opacity-100 pointer-coarse:hidden",
				className,
			)}
		>
			{locked ? (
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
					className="text-foreground"
					aria-hidden="true"
				>
					<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
					<path d="M7 11V7a5 5 0 0 1 10 0v4" />
				</svg>
			) : (
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
					className="text-foreground"
					aria-hidden="true"
				>
					<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
					<path d="M7 11V7a5 5 0 0 1 9.9-1" />
				</svg>
			)}
		</button>
	);
}

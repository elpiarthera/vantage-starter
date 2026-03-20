"use client";

/**
 * WorkspaceSwitcher — VantageStarter
 *
 * Clerk OrganizationSwitcher wired into the AppSidebar footer.
 * Allows users to switch between personal workspace and Clerk organizations.
 *
 * Task 4.3 (backend workspace model / Convex workspaces.ts) is scoped to
 * dev-convex-expert. This component covers the UI layer only.
 *
 * Design gate applied:
 * - rounded-none (0px) matches editorial design system sharp corners
 * - OKLCH tokens via CSS vars (Clerk appearance API uses CSS classes)
 */

import { OrganizationSwitcher, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSwitcher() {
	const { isLoaded, isSignedIn } = useUser();

	if (!isLoaded) {
		return (
			<div className="flex items-center gap-2 px-3 py-1.5">
				<Skeleton className="size-6 rounded-none" />
				<Skeleton className="h-4 w-28" />
			</div>
		);
	}

	if (!isSignedIn) return null;

	return (
		<div className="w-full px-1">
			<OrganizationSwitcher
				hidePersonal={false}
				afterCreateOrganizationUrl="/dashboard"
				afterLeaveOrganizationUrl="/dashboard"
				afterSelectOrganizationUrl="/dashboard"
				afterSelectPersonalUrl="/dashboard"
				createOrganizationMode="modal"
				appearance={{
					elements: {
						rootBox: "w-full",
						organizationSwitcherTrigger:
							"w-full min-h-[44px] justify-between px-3 py-2 rounded-none hover:bg-sidebar-accent transition-colors duration-150 ease-out text-sm",
						organizationSwitcherPopoverCard:
							"rounded-none border border-border shadow-md",
						organizationSwitcherPopoverActions: "rounded-none",
					},
				}}
			/>
		</div>
	);
}

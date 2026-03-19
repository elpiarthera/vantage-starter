"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { usePathname, useRouter } from "@/i18n/routing";

/**
 * Context for tracking user sync status
 */
interface UserSyncContextType {
	isUserSynced: boolean;
	isSyncing: boolean;
}

const UserSyncContext = createContext<UserSyncContextType>({
	isUserSynced: false,
	isSyncing: false,
});

/**
 * Hook to access user sync status
 */
export function useUserSync() {
	return useContext(UserSyncContext);
}

/**
 * CRITICAL: Automatically syncs authenticated Clerk users to Convex database
 *
 * Problem Solved: Users signing up weren't being created in Convex,
 * causing "User not found" errors when creating projects.
 *
 * How it works:
 * 1. Detects when user is authenticated via Clerk
 * 2. Calls syncUser mutation with user data from Clerk
 * 3. Only syncs once per session (prevents duplicate calls)
 * 4. Resets on sign-out (allows sync on next sign-in)
 * 5. Exposes sync status via context for dependent components
 *
 * @see docs/Guides/updated clerk users in convex.md for full analysis
 */
export function UserSyncProvider({ children }: { children: React.ReactNode }) {
	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const syncUser = useMutation(api.users.syncUser);
	const storedLanguage = useQuery(
		api.users.getLanguagePreference,
		isSignedIn ? {} : "skip",
	);
	const router = useRouter();
	const pathname = usePathname();
	const currentLocale = useLocale();

	const [hasSynced, setHasSynced] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [hasAppliedLanguage, setHasAppliedLanguage] = useState(false);

	// Sync user when authenticated (once per session)
	// biome-ignore lint/correctness/useExhaustiveDependencies: user object changes every render, only track user.id to prevent infinite loop
	useEffect(() => {
		// Guard: Only sync if signed in, user data loaded, and hasn't synced yet
		if (isSignedIn && user && !hasSynced && !isSyncing) {
			console.log("[UserSync] 🔄 Syncing user to Convex:", {
				userId: user.id,
				email: user.primaryEmailAddress?.emailAddress,
				timestamp: new Date().toISOString(),
			});

			setIsSyncing(true);

			syncUser({
				clerkUserId: user.id,
				email: user.primaryEmailAddress?.emailAddress || "",
				firstName: user.firstName || undefined,
				lastName: user.lastName || undefined,
				username: user.username || undefined,
				imageUrl: user.imageUrl || undefined,
			})
				.then(() => {
					console.log("[UserSync] ✅ User synced successfully:", {
						userId: user.id,
						timestamp: new Date().toISOString(),
					});
					setHasSynced(true);
					setIsSyncing(false);
				})
				.catch((err) => {
					console.error("[UserSync] ❌ Failed to sync user:", {
						error: err instanceof Error ? err.message : String(err),
						userId: user.id,
						timestamp: new Date().toISOString(),
					});
					setIsSyncing(false);
					// Don't set hasSynced = true, allowing retry on next render
				});
		}
	}, [isSignedIn, user?.id, hasSynced, isSyncing, syncUser]);

	// Apply stored language preference after sync (once per session)
	useEffect(() => {
		if (
			isSignedIn &&
			hasSynced &&
			!hasAppliedLanguage &&
			storedLanguage &&
			storedLanguage !== currentLocale
		) {
			console.log("[UserSync] 🌐 Applying stored language preference:", {
				storedLanguage,
				currentLocale,
			});
			setHasAppliedLanguage(true);
			router.replace(pathname, { locale: storedLanguage });
		}
	}, [
		isSignedIn,
		hasSynced,
		hasAppliedLanguage,
		storedLanguage,
		currentLocale,
		router,
		pathname,
	]);

	// Reset sync flag when user signs out
	useEffect(() => {
		if (!isSignedIn && hasSynced) {
			console.log("[UserSync] 🔄 User signed out, resetting sync state");
			setHasSynced(false);
			setIsSyncing(false);
			setHasAppliedLanguage(false);
		}
	}, [isSignedIn, hasSynced]);

	return (
		<UserSyncContext.Provider value={{ isUserSynced: hasSynced, isSyncing }}>
			{children}
		</UserSyncContext.Provider>
	);
}

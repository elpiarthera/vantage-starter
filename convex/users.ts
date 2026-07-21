import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
	action,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		// Get the authenticated user's identity from Clerk JWT
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return null;
		}

		// Look up user in our database by Clerk ID
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		return user;
	},
});

/**
 * Sync user from Clerk to Convex database.
 * Creates or updates user record, then ensures a default workspace exists.
 * Called automatically when user signs in/up via UserSyncProvider.
 */
export const syncUser = mutation({
	args: {
		clerkUserId: v.string(),
		email: v.string(),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		username: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
	},
	returns: v.id("users"),
	handler: async (ctx, args) => {
		// Caller must be syncing THEMSELVES — reject any attempt to write a
		// user row for a different Clerk identity. Without this check, any
		// signed-in caller (or anyone spoofing a JWT-less request) could
		// create/overwrite an arbitrary user's profile by ID.
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Authentication required");
		}
		if (identity.subject !== args.clerkUserId) {
			throw new Error("Unauthorized: cannot sync a different user's account");
		}

		// Check if user already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.unique();

		const now = Date.now();

		if (existingUser) {
			// Update existing user
			await ctx.db.patch(existingUser._id, {
				email: args.email,
				firstName: args.firstName,
				lastName: args.lastName,
				username: args.username,
				imageUrl: args.imageUrl,
				lastActiveAt: now,
				updatedAt: now,
			});

			// Ensure workspace exists for existing users who may have been created
			// before auto-workspace logic was added.
			const existingWorkspace = await ctx.db
				.query("workspaces")
				.withIndex("by_owner", (q) => q.eq("ownerId", args.clerkUserId))
				.first();

			if (!existingWorkspace) {
				await ctx.db.insert("workspaces", {
					name: "Personal",
					organizationId: "personal",
					ownerId: args.clerkUserId,
					isDefault: true,
					createdAt: now,
					updatedAt: now,
				});
			}

			return existingUser._id;
		}

		// Create new user with all required fields
		const userId = await ctx.db.insert("users", {
			clerkUserId: args.clerkUserId,
			email: args.email,
			firstName: args.firstName,
			lastName: args.lastName,
			username: args.username,
			imageUrl: args.imageUrl,
			lastActiveAt: now,
			createdAt: now,
			updatedAt: now,
		});

		// Auto-create default workspace for every new user
		await ctx.db.insert("workspaces", {
			name: "Personal",
			organizationId: "personal",
			ownerId: args.clerkUserId,
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});

		return userId;
	},
});

/**
 * Get user by Clerk ID.
 *
 * SECURITY: self-only — the caller may only resolve their own user document.
 * `clerkUserId` values are visible in many other API responses across this
 * codebase (e.g. assets.userId, chatMessages.userId), so accepting an
 * arbitrary value here without an identity check would leak any user's full
 * profile (email, organizationId, role) to anyone who can guess it.
 */
export const getUserByClerkId = query({
	args: { clerkUserId: v.string() },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Authentication required");
		}
		if (identity.subject !== args.clerkUserId) {
			throw new Error("Unauthorized: cannot read another user's account");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.unique();

		return user;
	},
});

/**
 * Update user language preference
 * Called when user changes language in settings or language switcher
 */
export const updateLanguagePreference = mutation({
	args: {
		language: v.string(),
	},
	handler: async (ctx, args) => {
		// Get the authenticated user's identity
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Find user in database
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		const now = Date.now();

		// Update user preferences with new language
		const currentPreferences = user.preferences || {
			theme: "dark",
			language: "en",
			notifications: true,
		};

		await ctx.db.patch(user._id, {
			preferences: {
				...currentPreferences,
				language: args.language,
			},
			updatedAt: now,
		});

		return { success: true, language: args.language };
	},
});

/**
 * Get user's language preference
 * Returns the stored language or 'en' as default
 */
export const getLanguagePreference = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return "en";
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		return user?.preferences?.language || "en";
	},
});

/**
 * Update user preferences (theme, notifications, design system, etc.)
 * Note: Name and email are managed by Clerk and updated via syncUser
 *
 * SCOPE DECISION (configurator persistence, Day defect #2 — declared per
 * .claude/rules/derive-never-type.md, not silent): the design system
 * selection (style/baseColor/theme/etc.) is stored PER-USER on
 * users.preferences.designSystem, not per-workspace.
 *
 * Reasoning: `workspaces.settings.theme` already exists as a single string
 * field with no per-field structure — extending it to carry the full
 * configurator shape (9 fields) plus a "personal override on top of a
 * workspace default" resolution order is real product surface (who can
 * change the workspace default, how override merges, migration of the
 * existing lone `theme` field) that this fix's scope does not require to
 * close the reported defect ("my choice does not survive reconnecting").
 * Per-user is the lightest change that fully closes the reported gap: one
 * signed-in user, one saved design, applied everywhere they go. Team-wide
 * workspace defaults with per-member override remain a tracked enhancement,
 * not a silent gap — it would extend `workspaces.settings` alongside this
 * field, not replace it.
 */
export const updatePreferences = mutation({
	args: {
		theme: v.optional(
			v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
		),
		notifications: v.optional(v.boolean()),
		designSystem: v.optional(
			v.object({
				style: v.optional(v.string()),
				baseColor: v.optional(v.string()),
				chartColor: v.optional(v.string()),
				fontHeading: v.optional(v.string()),
				font: v.optional(v.string()),
				iconLibrary: v.optional(v.string()),
				radius: v.optional(v.string()),
				menuColor: v.optional(v.string()),
				menuAccent: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		const now = Date.now();
		const currentPreferences = user.preferences || {
			theme: "dark" as const,
			language: "en",
			notifications: true,
		};

		await ctx.db.patch(user._id, {
			preferences: {
				...currentPreferences,
				...(args.theme !== undefined && { theme: args.theme }),
				...(args.notifications !== undefined && {
					notifications: args.notifications,
				}),
				...(args.designSystem !== undefined && {
					designSystem: {
						...currentPreferences.designSystem,
						...args.designSystem,
					},
				}),
			},
			updatedAt: now,
		});

		return { success: true };
	},
});

/**
 * Delete all Convex data owned by a user.
 * Called exclusively from the deleteAccount action (after Polar subscription is cancelled).
 * Removes: subscriptions, userCredits, creditTransactions, users row.
 */
export const cleanupUserData = internalMutation({
	args: { clerkUserId: v.string() },
	handler: async (ctx, { clerkUserId }) => {
		// Delete subscription records
		const subscriptions = await ctx.db
			.query("subscriptions")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
			.collect();
		for (const sub of subscriptions) {
			await ctx.db.delete(sub._id);
		}

		// Delete user credits record
		const credits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.collect();
		for (const c of credits) {
			await ctx.db.delete(c._id);
		}

		// Delete credit transactions.
		// Safety cap: Convex mutations read at most 16,384 documents. Power users with
		// very large transaction histories could hit this limit with .collect().
		// .take(500) processes the oldest batch; any remainder is an acceptable data
		// leak at MVP scale and must be addressed before production scale-up.
		const transactions = await ctx.db
			.query("creditTransactions")
			.withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
			.take(500);
		if (transactions.length === 500) {
			console.warn(
				`cleanupUserData: clerkUserId ${clerkUserId} had ≥500 creditTransactions — only first 500 deleted. Increase batch size before scale.`,
			);
		}
		for (const tx of transactions) {
			await ctx.db.delete(tx._id);
		}

		// Delete the user record itself
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
			.unique();
		if (user) {
			await ctx.db.delete(user._id);
		}

		return { success: true };
	},
});

/**
 * Delete the current user's account.
 *
 * Sequence (order is critical — user must exist in DB when Polar cancel runs):
 * 1. Cancel active Polar subscription (try/catch — free users have no subscription)
 * 2. Delete all Convex data via cleanupUserData internalMutation
 * 3. Delete the Clerk user account via the Clerk Backend API
 *
 * Requires CLERK_SECRET_KEY to be set in Convex env vars:
 *   npx convex env set CLERK_SECRET_KEY sk_...
 */
export const deleteAccount = action({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}
		const clerkUserId = identity.subject;

		// Step 1: Cancel Polar subscription if active.
		// Free users have no subscription — catch and continue.
		try {
			await ctx.runAction(api.polar.cancelCurrentSubscription, {});
			console.log(`Polar subscription cancelled for ${clerkUserId}`);
		} catch (error) {
			console.log(
				`No active Polar subscription for ${clerkUserId} (free user or already cancelled):`,
				error,
			);
		}

		// Step 2: Delete all Convex data (subscriptions, credits, transactions, user)
		await ctx.runMutation(internal.users.cleanupUserData, { clerkUserId });
		console.log(`Convex data cleaned up for ${clerkUserId}`);

		// Step 3: Delete the Clerk user account via Clerk Backend API
		const clerkSecretKey = process.env.CLERK_SECRET_KEY;
		if (!clerkSecretKey) {
			console.error(
				"CLERK_SECRET_KEY not set in Convex env vars — Clerk account NOT deleted",
			);
			return { success: true, clerkDeleted: false };
		}

		const clerkRes = await fetch(
			`https://api.clerk.com/v1/users/${clerkUserId}`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${clerkSecretKey}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!clerkRes.ok) {
			const body = await clerkRes.text();
			console.error(`Clerk user deletion failed (${clerkRes.status}): ${body}`);
			throw new Error(`Failed to delete Clerk account: ${clerkRes.status}`);
		}

		console.log(`Clerk account deleted for ${clerkUserId}`);
		return { success: true, clerkDeleted: true };
	},
});

/**
 * Get user by Clerk ID (internal query for actions)
 */
export const getByClerkId = internalQuery({
	args: { clerkUserId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.unique();
	},
});

/**
 * Look up a user by their Convex document ID.
 * Used by webhook handlers where the @convex-dev/polar component stores
 * metadata: { userId: <convex_doc_id> } — not clerk_user_id.
 */
export const getByConvexId = internalQuery({
	args: { convexUserId: v.string() },
	handler: async (ctx, { convexUserId }) => {
		return await ctx.db.get(convexUserId as Id<"users">);
	},
});

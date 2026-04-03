/**
 * Rate Limiter — centralized rate limit definitions
 *
 * Uses @convex-dev/ratelimiter registered in convex.config.ts.
 * All rate limits keyed by Clerk user ID (identity.subject).
 *
 * Limits:
 * - chats.create:           10 / minute  — prevents spam session creation
 * - messages.save:          30 / minute  — prevents programmatic AI credit drain
 * - projects.create:         5 / minute  — low-frequency operation
 * - messages.update:        60 / minute  — prevents spam edits
 * - customRoles.create:     10 / minute  — user-defined role creation
 * - customPersonas.create:  10 / minute  — user-defined persona creation
 * - customFrameworks.create: 10 / minute  — user-defined framework creation
 *
 * Internal mutations are exempt — called by trusted server-side actions only.
 */

import { RateLimiter } from "@convex-dev/ratelimiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.ratelimiter, {
	// chats.create — 10 per 60s per user
	createChat: { kind: "token bucket", rate: 10, period: 60_000, capacity: 10 },

	// messages.save — 30 per 60s per user
	saveMessage: {
		kind: "token bucket",
		rate: 30,
		period: 60_000,
		capacity: 30,
	},

	// projects.create — 5 per 60s per user
	createProject: {
		kind: "token bucket",
		rate: 5,
		period: 60_000,
		capacity: 5,
	},

	// messages.update — 60 per 60s per user
	updateMessage: {
		kind: "token bucket",
		rate: 60,
		period: 60_000,
		capacity: 60,
	},

	// customRoles.create — 10 per 60s per user
	createCustomRole: {
		kind: "token bucket",
		rate: 10,
		period: 60_000,
		capacity: 10,
	},

	// customPersonas.create — 10 per 60s per user
	createCustomPersona: {
		kind: "token bucket",
		rate: 10,
		period: 60_000,
		capacity: 10,
	},

	// customFrameworks.create — 10 per 60s per user
	createCustomFramework: {
		kind: "token bucket",
		rate: 10,
		period: 60_000,
		capacity: 10,
	},
});

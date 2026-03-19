/**
 * Refinement Flows - Convex Queries & Mutations
 * Sprint 25: Refinement Flow Feature
 */

import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

/**
 * Helper: Check if user is admin
 */
async function requireAdmin(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
		.unique();

	if (!user) {
		throw new Error("User not found");
	}

	if (user.role !== "admin" && user.role !== "owner") {
		throw new Error("Unauthorized - admin access required");
	}

	return user;
}

// ============================================================
// REFINEMENT FLOW QUERIES
// ============================================================

/**
 * Get all refinement flows (admin)
 */
export const getAllFlows = query({
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db.query("refinementFlows").collect();
	},
});

/**
 * Get flow by ID
 */
export const getFlowById = query({
	args: { flowId: v.id("refinementFlows") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.flowId);
	},
});

/**
 * Get flow by target (for public use)
 */
export const getFlowByTarget = query({
	args: {
		triggerLevel: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
			v.literal("vague"),
		),
		targetId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("refinementFlows")
			.withIndex("by_target", (q) =>
				q.eq("triggerLevel", args.triggerLevel).eq("targetId", args.targetId),
			)
			.filter((q) => q.eq(q.field("isActive"), true))
			.first();
	},
});

/**
 * Get active flows by trigger level
 */
export const getFlowsByLevel = query({
	args: {
		triggerLevel: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
			v.literal("vague"),
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("refinementFlows")
			.withIndex("by_trigger_level", (q) =>
				q.eq("triggerLevel", args.triggerLevel),
			)
			.collect();
	},
});

// ============================================================
// REFINEMENT FLOW MUTATIONS
// ============================================================

/**
 * Create a new refinement flow
 */
export const createFlow = mutation({
	args: {
		name: v.string(),
		description: v.string(),
		triggerLevel: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
			v.literal("vague"),
		),
		targetId: v.string(),
		isActive: v.boolean(),
		showConsultantIntro: v.optional(v.boolean()),
		consultantMessage: v.optional(v.string()),
		allowSkip: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		return await ctx.db.insert("refinementFlows", {
			name: args.name,
			description: args.description,
			triggerLevel: args.triggerLevel,
			targetId: args.targetId,
			isActive: args.isActive,
			showConsultantIntro: args.showConsultantIntro ?? false,
			consultantMessage: args.consultantMessage,
			allowSkip: args.allowSkip ?? true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update a refinement flow
 */
export const updateFlow = mutation({
	args: {
		flowId: v.id("refinementFlows"),
		updates: v.object({
			name: v.optional(v.string()),
			description: v.optional(v.string()),
			triggerLevel: v.optional(
				v.union(
					v.literal("tool"),
					v.literal("category"),
					v.literal("subcategory"),
					v.literal("vague"),
				),
			),
			targetId: v.optional(v.string()),
			isActive: v.optional(v.boolean()),
			showConsultantIntro: v.optional(v.boolean()),
			consultantMessage: v.optional(v.string()),
			allowSkip: v.optional(v.boolean()),
		}),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const flow = await ctx.db.get(args.flowId);
		if (!flow) {
			throw new Error("Flow not found");
		}

		await ctx.db.patch(args.flowId, {
			...args.updates,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Delete a refinement flow
 */
export const deleteFlow = mutation({
	args: { flowId: v.id("refinementFlows") },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		// Delete all questions for this flow
		const questions = await ctx.db
			.query("refinementQuestions")
			.withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
			.collect();

		for (const question of questions) {
			await ctx.db.delete(question._id);
		}

		// Delete the flow
		await ctx.db.delete(args.flowId);
	},
});

/**
 * Duplicate a refinement flow
 */
export const duplicateFlow = mutation({
	args: { flowId: v.id("refinementFlows") },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const flow = await ctx.db.get(args.flowId);
		if (!flow) {
			throw new Error("Flow not found");
		}

		// Create new flow
		const newFlowId = await ctx.db.insert("refinementFlows", {
			name: `${flow.name} (Copy)`,
			description: flow.description,
			triggerLevel: flow.triggerLevel,
			targetId: flow.targetId,
			isActive: false,
			showConsultantIntro: flow.showConsultantIntro,
			consultantMessage: flow.consultantMessage,
			allowSkip: flow.allowSkip,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Copy all questions
		const questions = await ctx.db
			.query("refinementQuestions")
			.withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
			.collect();

		for (const question of questions) {
			await ctx.db.insert("refinementQuestions", {
				flowId: newFlowId,
				type: question.type,
				question: question.question,
				description: question.description,
				isRequired: question.isRequired,
				allowOther: question.allowOther,
				allowMultiple: question.allowMultiple,
				options: question.options,
				visualSource: question.visualSource,
				layout: question.layout,
				gridCols: question.gridCols,
				showIf: question.showIf,
				defaultValue: question.defaultValue,
				sortOrder: question.sortOrder,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		}

		return newFlowId;
	},
});

// ============================================================
// REFINEMENT QUESTION QUERIES
// ============================================================

/**
 * Get questions for a flow
 */
export const getQuestionsForFlow = query({
	args: { flowId: v.id("refinementFlows") },
	handler: async (ctx, args) => {
		const questions = await ctx.db
			.query("refinementQuestions")
			.withIndex("by_flow_and_order", (q) => q.eq("flowId", args.flowId))
			.collect();

		return questions.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

// ============================================================
// REFINEMENT QUESTION MUTATIONS
// ============================================================

/**
 * Create a question
 */
export const createQuestion = mutation({
	args: {
		flowId: v.id("refinementFlows"),
		type: v.union(
			v.literal("text-radio"),
			v.literal("text-checkbox"),
			v.literal("visual-categories"),
			v.literal("visual-subcategories"),
			v.literal("visual-ads"),
		),
		question: v.string(),
		description: v.optional(v.string()),
		isRequired: v.boolean(),
		allowOther: v.boolean(),
		allowMultiple: v.boolean(),
		options: v.optional(
			v.array(
				v.object({
					id: v.string(),
					label: v.string(),
					value: v.string(),
				}),
			),
		),
		visualSource: v.optional(
			v.object({
				type: v.union(
					v.literal("categories"),
					v.literal("subcategories"),
					v.literal("ads"),
				),
				categoryIds: v.optional(v.array(v.string())),
				subcategoryIds: v.optional(v.array(v.string())),
				adTargets: v.optional(v.array(v.string())),
			}),
		),
		layout: v.optional(v.union(v.literal("grid"), v.literal("list"))),
		gridCols: v.optional(v.number()),
		showIf: v.optional(
			v.object({
				questionId: v.string(),
				answerValue: v.union(v.string(), v.array(v.string())),
			}),
		),
		defaultValue: v.optional(v.union(v.string(), v.array(v.string()))),
		sortOrder: v.number(),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		return await ctx.db.insert("refinementQuestions", {
			...args,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update a question
 */
export const updateQuestion = mutation({
	args: {
		questionId: v.id("refinementQuestions"),
		updates: v.object({
			type: v.optional(
				v.union(
					v.literal("text-radio"),
					v.literal("text-checkbox"),
					v.literal("visual-categories"),
					v.literal("visual-subcategories"),
					v.literal("visual-ads"),
				),
			),
			question: v.optional(v.string()),
			description: v.optional(v.string()),
			isRequired: v.optional(v.boolean()),
			allowOther: v.optional(v.boolean()),
			allowMultiple: v.optional(v.boolean()),
			options: v.optional(
				v.array(
					v.object({
						id: v.string(),
						label: v.string(),
						value: v.string(),
					}),
				),
			),
			visualSource: v.optional(
				v.object({
					type: v.union(
						v.literal("categories"),
						v.literal("subcategories"),
						v.literal("ads"),
					),
					categoryIds: v.optional(v.array(v.string())),
					subcategoryIds: v.optional(v.array(v.string())),
					adTargets: v.optional(v.array(v.string())),
				}),
			),
			layout: v.optional(v.union(v.literal("grid"), v.literal("list"))),
			gridCols: v.optional(v.number()),
			showIf: v.optional(
				v.object({
					questionId: v.string(),
					answerValue: v.union(v.string(), v.array(v.string())),
				}),
			),
			defaultValue: v.optional(v.union(v.string(), v.array(v.string()))),
			sortOrder: v.optional(v.number()),
		}),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		await ctx.db.patch(args.questionId, {
			...args.updates,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Delete a question
 */
export const deleteQuestion = mutation({
	args: { questionId: v.id("refinementQuestions") },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		await ctx.db.delete(args.questionId);
	},
});

/**
 * Reorder questions
 */
export const reorderQuestions = mutation({
	args: {
		items: v.array(
			v.object({
				id: v.id("refinementQuestions"),
				sortOrder: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		await Promise.all(
			args.items.map((item) =>
				ctx.db.patch(item.id, {
					sortOrder: item.sortOrder,
					updatedAt: Date.now(),
				}),
			),
		);
	},
});

// ============================================================
// REFINEMENT SESSION MUTATIONS
// ============================================================

/**
 * Create a session
 */
export const createSession = mutation({
	args: {
		flowId: v.id("refinementFlows"),
		sessionId: v.string(),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("refinementSessions", {
			flowId: args.flowId,
			sessionId: args.sessionId,
			userId: args.userId,
			answers: {},
			currentQuestionIndex: 0,
			isComplete: false,
			wasAbandoned: false,
			startedAt: Date.now(),
			lastUpdatedAt: Date.now(),
		});
	},
});

/**
 * Update session answers
 */
export const updateSessionAnswers = mutation({
	args: {
		sessionId: v.id("refinementSessions"),
		answers: v.any(),
		currentQuestionIndex: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.sessionId, {
			answers: args.answers,
			currentQuestionIndex: args.currentQuestionIndex,
			lastUpdatedAt: Date.now(),
		});
	},
});

/**
 * Complete a session
 */
export const completeSession = mutation({
	args: { sessionId: v.id("refinementSessions") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.sessionId, {
			isComplete: true,
			completedAt: Date.now(),
			lastUpdatedAt: Date.now(),
		});
	},
});

/**
 * Abandon a session
 */
export const abandonSession = mutation({
	args: { sessionId: v.id("refinementSessions") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.sessionId, {
			wasAbandoned: true,
			lastUpdatedAt: Date.now(),
		});
	},
});

/**
 * Credit Costs Seed Data
 *
 * Idempotent upsert of all AI action types into the creditCosts table.
 * Safe to run multiple times — existing rows are patched, missing rows are inserted.
 *
 * Run: npx convex run seed/seedCreditCosts:seedCreditCosts
 */

import { internalMutation } from "../_generated/server";

type CreditCostRow = {
	actionType: string;
	displayName: string;
	credits: number;
	description: string;
	category: string;
	isActive: boolean;
};

const ACTION_TYPES: CreditCostRow[] = [
	{
		actionType: "chat_message",
		displayName: "Chat Message",
		credits: 1,
		description: "AI chat conversation message",
		category: "chat",
		isActive: true,
	},
	{
		actionType: "architect_message",
		displayName: "Architect Message",
		credits: 1,
		description: "Architect agent conversation message",
		category: "chat",
		isActive: true,
	},
	{
		actionType: "image_generation",
		displayName: "Image Generation",
		credits: 5,
		description: "Generate an image with AI",
		category: "image",
		isActive: true,
	},
	{
		actionType: "image_edit",
		displayName: "Image Edit",
		credits: 5,
		description: "Edit an image with AI",
		category: "image",
		isActive: true,
	},
	{
		actionType: "video_generation",
		displayName: "Video Generation",
		credits: 20,
		description: "Generate a video with AI",
		category: "video",
		isActive: true,
	},
	{
		actionType: "video_assembly",
		displayName: "Video Assembly",
		credits: 5,
		description: "Assemble final video",
		category: "video",
		isActive: true,
	},
	{
		actionType: "audio_narration",
		displayName: "Audio Narration",
		credits: 10,
		description: "Generate audio narration",
		category: "audio",
		isActive: true,
	},
];

/**
 * Idempotent upsert of all credit action types.
 * - If a row for the actionType exists: patch with current values.
 * - If no row exists: insert.
 */
export const seedCreditCosts = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		let inserted = 0;
		let patched = 0;

		for (const row of ACTION_TYPES) {
			const existing = await ctx.db
				.query("creditCosts")
				.withIndex("by_action_type", (q) => q.eq("actionType", row.actionType))
				.first();

			if (existing) {
				await ctx.db.patch(existing._id, {
					displayName: row.displayName,
					credits: row.credits,
					description: row.description,
					category: row.category,
					isActive: row.isActive,
					updatedAt: now,
				});
				console.log(`Patched creditCost: ${row.actionType}`);
				patched++;
			} else {
				await ctx.db.insert("creditCosts", {
					actionType: row.actionType,
					displayName: row.displayName,
					credits: row.credits,
					description: row.description,
					category: row.category,
					isActive: row.isActive,
					updatedAt: now,
				});
				console.log(`Inserted creditCost: ${row.actionType}`);
				inserted++;
			}
		}

		return { success: true, inserted, patched };
	},
});

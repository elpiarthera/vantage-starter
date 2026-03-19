import { internalMutation } from "../_generated/server";

/**
 * Clean duplicate voice model schemas
 * The seed script was run twice, creating 6 models instead of 3
 * This migration deletes the older set (first 3 created)
 */
export const cleanDuplicateVoiceModels = internalMutation({
	args: {},
	handler: async (ctx) => {
		// Get all voice model schemas ordered by creation time
		const allModels = await ctx.db
			.query("voiceModelSchemas")
			.order("asc")
			.collect();

		console.log(`Found ${allModels.length} voice model schemas`);

		if (allModels.length !== 6) {
			console.log(
				"⚠️  Expected 6 models (duplicates), found:",
				allModels.length,
			);
			return { success: false, message: "Unexpected model count" };
		}

		// Delete the OLDER set (first 3 by creation time)
		// These have _creationTime: 1771436389573
		const toDelete = allModels.slice(0, 3);

		for (const model of toDelete) {
			await ctx.db.delete(model._id);
			console.log(`Deleted duplicate: ${model.schemaId} (${model.name})`);
		}

		console.log("✅ Cleaned 3 duplicate voice models");

		// Verify remaining 3
		const remaining = await ctx.db.query("voiceModelSchemas").collect();

		console.log(`Remaining models: ${remaining.length}`);
		for (const model of remaining) {
			console.log(`  - ${model.schemaId}: ${model.name}`);
		}

		return {
			success: true,
			deleted: toDelete.length,
			remaining: remaining.length,
		};
	},
});

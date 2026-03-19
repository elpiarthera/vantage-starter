/**
 * Seed Script: Tool Selection Wall
 * Sprint 24: Tool Selection Wall Feature
 *
 * Populates sample data for testing:
 * - 2 tools (Guided Flow with 4 levels, Image Generator with 0 levels)
 * - 3 occasions (categories)
 * - 9 subcategories (3 styles × 3 occasions)
 * - 3 themes (standalone, reusable)
 * - 27 junction records (9 subcategories × 3 themes)
 */

import { mutation } from "../_generated/server";

export const seedTools = mutation({
	args: {},
	handler: async (ctx) => {
		// Create Guided Flow tool
		const guidedFlowId = await ctx.db.insert("tools", {
			key: "guided_flow",
			name: "Guided Flow",
			nameTranslationKey: "tools.guided_flow.name",
			description: "Full 8-step video creation with AI assistance",
			descriptionTranslationKey: "tools.guided_flow.description",
			targetUrl: "/guided/step-0",
			hasCategories: true,
			hasSubCategories: true,
			hasThemes: true,
			categoryParamName: "occasion", // Configurable param names
			subCategoryParamName: "style",
			themeParamName: "theme",
			sortOrder: 1,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Create occasions (categories)
		const occasions = [
			{
				key: "birthday",
				name: "Birthday",
				desc: "Mark another year of memories",
			},
			{
				key: "wedding",
				name: "Wedding",
				desc: "Celebrate love and commitment",
			},
			{
				key: "anniversary",
				name: "Anniversary",
				desc: "Commemorate special milestones",
			},
		];

		const occasionIds: Record<string, string> = {};
		for (let i = 0; i < occasions.length; i++) {
			const occasion = occasions[i];
			const id = await ctx.db.insert("toolCategories", {
				toolId: guidedFlowId,
				key: occasion.key,
				name: occasion.name,
				nameTranslationKey: `occasions.${occasion.key}`,
				description: occasion.desc,
				descriptionTranslationKey: `occasions.${occasion.key}_desc`,
				sortOrder: i,
				isActive: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			occasionIds[occasion.key] = id;
		}

		// Create styles (subcategories) - Link to ALL occasions
		const styles = [
			{ key: "cinematic", name: "Cinematic", desc: "Film-like quality" },
			{ key: "vintage", name: "Vintage", desc: "Classic retro aesthetic" },
			{ key: "anime", name: "Anime", desc: "Japanese animation style" },
		];

		const allSubcategoryIds: string[] = [];
		for (const occasion of occasions) {
			for (let i = 0; i < styles.length; i++) {
				const style = styles[i];
				const id = await ctx.db.insert("toolSubCategories", {
					toolId: guidedFlowId,
					categoryId: occasionIds[occasion.key] as any,
					key: style.key,
					name: style.name,
					nameTranslationKey: `visual_styles.${style.key}`,
					description: style.desc,
					descriptionTranslationKey: `visual_styles.${style.key}_desc`,
					sortOrder: i,
					isActive: true,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				});
				allSubcategoryIds.push(id);
			}
		}

		// Create standalone themes (reusable)
		const themes = [
			{
				key: "joyful",
				name: "Joyful",
				desc: "Bright, happy, celebratory",
				color: "#FF6B6B",
			},
			{
				key: "nostalgic",
				name: "Nostalgic",
				desc: "Warm, reminiscent, sentimental",
				color: "#8B5A3C",
			},
			{
				key: "romantic",
				name: "Romantic",
				desc: "Loving, tender, intimate",
				color: "#FF6B9B",
			},
		];

		const themeIds: Record<string, string> = {};
		for (let i = 0; i < themes.length; i++) {
			const theme = themes[i];
			const id = await ctx.db.insert("toolThemes", {
				key: theme.key,
				name: theme.name,
				nameTranslationKey: `emotional_themes.${theme.key}`,
				description: theme.desc,
				descriptionTranslationKey: `emotional_themes.${theme.key}_desc`,
				color: theme.color,
				sortOrder: i,
				isActive: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			themeIds[theme.key] = id;
		}

		// Assign ALL themes to ALL subcategories (demonstrating reusability)
		let junctionCount = 0;
		for (const subcategoryId of allSubcategoryIds) {
			for (let i = 0; i < themes.length; i++) {
				const theme = themes[i];
				await ctx.db.insert("toolSubCategoryThemes", {
					toolSubCategoryId: subcategoryId as any,
					toolThemeId: themeIds[theme.key] as any,
					order: i,
					isActive: true,
				});
				junctionCount++;
			}
		}

		// Create Image Generator tool (no levels)
		await ctx.db.insert("tools", {
			key: "image_generator",
			name: "Image Generator",
			nameTranslationKey: "tools.image_generator.name",
			description: "Create stunning images from text prompts",
			descriptionTranslationKey: "tools.image_generator.description",
			targetUrl: "/image-generator",
			hasCategories: false,
			hasSubCategories: false,
			hasThemes: false,
			sortOrder: 2,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return {
			tools: 2,
			occasions: occasions.length,
			styles: allSubcategoryIds.length,
			themes: themes.length,
			junctionRecords: junctionCount,
			message: `✅ Seeded: ${occasions.length} occasions × ${styles.length} styles = ${allSubcategoryIds.length} subcategories, ${themes.length} themes reused ${junctionCount} times`,
		};
	},
});

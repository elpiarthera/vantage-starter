import { ConvexHttpClient } from "convex/browser";
import { config } from "dotenv";
import { api } from "../convex/_generated/api";

// Load environment variables from .env.local
config({ path: ".env.local" });

/**
 * Sprint 11 Phase 2: Seed Transition Effects
 *
 * Seeds all 46 FFmpeg xfade transition effects into Convex.
 * This script is idempotent - re-running it will skip existing effects.
 *
 * Run with: npx tsx scripts/seed-transition-effects.ts
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
	console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in environment");
	process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

/**
 * All 46 FFmpeg xfade transition effects
 * Organized by category with sortOrder for display
 *
 * Categories:
 * - fades (6): Basic opacity transitions
 * - wipes (8): Directional wipe effects
 * - slides (8): Sliding transitions
 * - circles (3): Circular reveal effects
 * - shapes (5): Rectangle and line effects
 * - diagonals (4): Diagonal wipe effects
 * - slices (4): Slicing effects
 * - effects (5): Special effects
 * - zoom (3): Zoom and squeeze effects
 */
const TRANSITION_EFFECTS = [
	// === FADES (6) ===
	{ key: "fade", category: "fades", sortOrder: 1, defaultDuration: 1.0 },
	{ key: "fadeblack", category: "fades", sortOrder: 2, defaultDuration: 1.0 },
	{ key: "fadewhite", category: "fades", sortOrder: 3, defaultDuration: 1.0 },
	{ key: "fadegrays", category: "fades", sortOrder: 4, defaultDuration: 1.0 },
	{ key: "fadefast", category: "fades", sortOrder: 5, defaultDuration: 0.5 },
	{ key: "fadeslow", category: "fades", sortOrder: 6, defaultDuration: 2.0 },

	// === WIPES (8) ===
	{ key: "wipeleft", category: "wipes", sortOrder: 10, defaultDuration: 1.0 },
	{ key: "wiperight", category: "wipes", sortOrder: 11, defaultDuration: 1.0 },
	{ key: "wipeup", category: "wipes", sortOrder: 12, defaultDuration: 1.0 },
	{ key: "wipedown", category: "wipes", sortOrder: 13, defaultDuration: 1.0 },
	{ key: "wipetl", category: "wipes", sortOrder: 14, defaultDuration: 1.0 },
	{ key: "wipetr", category: "wipes", sortOrder: 15, defaultDuration: 1.0 },
	{ key: "wipebl", category: "wipes", sortOrder: 16, defaultDuration: 1.0 },
	{ key: "wipebr", category: "wipes", sortOrder: 17, defaultDuration: 1.0 },

	// === SLIDES (8) ===
	{ key: "slideleft", category: "slides", sortOrder: 20, defaultDuration: 1.0 },
	{
		key: "slideright",
		category: "slides",
		sortOrder: 21,
		defaultDuration: 1.0,
	},
	{ key: "slideup", category: "slides", sortOrder: 22, defaultDuration: 1.0 },
	{ key: "slidedown", category: "slides", sortOrder: 23, defaultDuration: 1.0 },
	{
		key: "smoothleft",
		category: "slides",
		sortOrder: 24,
		defaultDuration: 1.0,
	},
	{
		key: "smoothright",
		category: "slides",
		sortOrder: 25,
		defaultDuration: 1.0,
	},
	{ key: "smoothup", category: "slides", sortOrder: 26, defaultDuration: 1.0 },
	{
		key: "smoothdown",
		category: "slides",
		sortOrder: 27,
		defaultDuration: 1.0,
	},

	// === CIRCLES (3) ===
	{
		key: "circleopen",
		category: "circles",
		sortOrder: 30,
		defaultDuration: 1.0,
	},
	{
		key: "circleclose",
		category: "circles",
		sortOrder: 31,
		defaultDuration: 1.0,
	},
	{
		key: "circlecrop",
		category: "circles",
		sortOrder: 32,
		defaultDuration: 1.0,
	},

	// === SHAPES (5) - Rectangles & Lines ===
	{ key: "rectcrop", category: "shapes", sortOrder: 40, defaultDuration: 1.0 },
	{ key: "vertopen", category: "shapes", sortOrder: 41, defaultDuration: 1.0 },
	{ key: "vertclose", category: "shapes", sortOrder: 42, defaultDuration: 1.0 },
	{ key: "horzopen", category: "shapes", sortOrder: 43, defaultDuration: 1.0 },
	{ key: "horzclose", category: "shapes", sortOrder: 44, defaultDuration: 1.0 },

	// === DIAGONALS (4) ===
	{
		key: "diagtl",
		category: "diagonals",
		sortOrder: 50,
		defaultDuration: 1.0,
	},
	{
		key: "diagtr",
		category: "diagonals",
		sortOrder: 51,
		defaultDuration: 1.0,
	},
	{
		key: "diagbl",
		category: "diagonals",
		sortOrder: 52,
		defaultDuration: 1.0,
	},
	{
		key: "diagbr",
		category: "diagonals",
		sortOrder: 53,
		defaultDuration: 1.0,
	},

	// === SLICES (4) ===
	{ key: "hlslice", category: "slices", sortOrder: 60, defaultDuration: 1.0 },
	{ key: "hrslice", category: "slices", sortOrder: 61, defaultDuration: 1.0 },
	{ key: "vuslice", category: "slices", sortOrder: 62, defaultDuration: 1.0 },
	{ key: "vdslice", category: "slices", sortOrder: 63, defaultDuration: 1.0 },

	// === EFFECTS (5) ===
	{ key: "dissolve", category: "effects", sortOrder: 70, defaultDuration: 1.0 },
	{ key: "pixelize", category: "effects", sortOrder: 71, defaultDuration: 1.0 },
	{ key: "distance", category: "effects", sortOrder: 72, defaultDuration: 1.0 },
	{ key: "radial", category: "effects", sortOrder: 73, defaultDuration: 1.0 },
	{ key: "hblur", category: "effects", sortOrder: 74, defaultDuration: 1.0 },

	// === ZOOM (3) - Squeeze & Zoom ===
	{ key: "squeezeh", category: "zoom", sortOrder: 80, defaultDuration: 1.0 },
	{ key: "squeezev", category: "zoom", sortOrder: 81, defaultDuration: 1.0 },
	{ key: "zoomin", category: "zoom", sortOrder: 82, defaultDuration: 1.0 },
];

// Total: 46 effects

async function seed() {
	console.log("🌱 Seeding 46 transition effects to Convex...\n");

	let created = 0;
	let skipped = 0;

	for (const effect of TRANSITION_EFFECTS) {
		try {
			// Check if already exists
			const existing = await client.query(api.transitionEffects.getByKey, {
				key: effect.key,
			});

			if (existing) {
				console.log(`  ⏭️  ${effect.key} already exists`);
				skipped++;
				continue;
			}

			// Create new effect
			await client.mutation(api.transitionEffects.create, {
				key: effect.key,
				category: effect.category,
				defaultDuration: effect.defaultDuration,
				sortOrder: effect.sortOrder,
				isActive: true,
			});

			console.log(`  ✅ Created ${effect.key} (${effect.category})`);
			created++;
		} catch (error) {
			console.error(`  ❌ Failed to create ${effect.key}:`, error);
		}
	}

	console.log(`\n${"=".repeat(50)}`);
	console.log(`✅ Done! Created: ${created}, Skipped: ${skipped}`);
	console.log(`📊 Total effects in database: ${created + skipped}`);
	console.log("=".repeat(50));
}

seed().catch((error) => {
	console.error("\n❌ Seed script failed:", error);
	process.exit(1);
});

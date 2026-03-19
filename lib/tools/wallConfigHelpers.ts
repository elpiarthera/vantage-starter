/**
 * Wall Configuration Helpers
 * Sprint 24: Tool Selection Wall Feature
 *
 * Server-side helpers for wall configuration management
 * Pattern adapted from vertical-ai-alpha/lib/unified-wall-config-store.ts
 *
 * NOTE: These are UTILITY functions, not a store.
 * Components should use Convex hooks directly:
 *   - useQuery(api.tools.getWallConfig, { level, contextId })
 *   - useMutation(api.tools.updateWallConfig)
 */

export type WallLevel = "meta-category" | "category" | "subcategory" | "theme";

/**
 * Generate wall key (for consistency with vertical-ai-alpha pattern)
 * Used for debugging and logging
 */
export function getWallKey(level: WallLevel, contextId?: string): string {
	if (level === "meta-category") return "meta-wall";
	if (level === "category") return `cat-wall-${contextId}`;
	if (level === "subcategory") return `sub-wall-${contextId}`;
	if (level === "theme") return `theme-wall-${contextId}`;
	return "unknown-wall";
}

/**
 * Client-side helpers for wall item manipulation
 * (Used before calling Convex mutations)
 */
export const WallItemHelpers = {
	/**
	 * Add item to wall (returns new itemIds array)
	 */
	addItem(currentItems: string[], itemId: string): string[] {
		if (currentItems.includes(itemId)) {
			return currentItems; // Already exists
		}
		return [...currentItems, itemId];
	},

	/**
	 * Remove item from wall
	 */
	removeItem(currentItems: string[], itemId: string): string[] {
		return currentItems.filter((id) => id !== itemId);
	},

	/**
	 * Reorder items (after drag-drop)
	 */
	reorderItems(items: string[], oldIndex: number, newIndex: number): string[] {
		const result = Array.from(items);
		const [removed] = result.splice(oldIndex, 1);
		result.splice(newIndex, 0, removed);
		return result;
	},

	/**
	 * Check if item is on wall
	 */
	isOnWall(currentItems: string[], itemId: string): boolean {
		return currentItems.includes(itemId);
	},
};

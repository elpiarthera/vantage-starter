interface StorageData {
	[key: string]: any;
}

declare global {
	var __GLOBAL_MEMORY_STORAGE__: StorageData | undefined;
}

// Ensure memory storage persists across module re-evaluations
const getGlobalMemoryStorage = (): StorageData => {
	if (typeof window !== "undefined") {
		if (!globalThis.__GLOBAL_MEMORY_STORAGE__) {
			globalThis.__GLOBAL_MEMORY_STORAGE__ = {};
			console.log("[v0] Initialized global memory storage");
		}
		return globalThis.__GLOBAL_MEMORY_STORAGE__;
	}
	return {};
};

export const storage = {
	setItem: (key: string, value: string) => {
		try {
			localStorage.setItem(key, value);
			// Verify it was actually saved
			const verification = localStorage.getItem(key);
			if (verification === null) {
				console.log("[v0] localStorage failed, using memory storage");
				const memoryStorage = getGlobalMemoryStorage();
				memoryStorage[key] = value;
				console.log(`[v0] Saved to global memory storage: ${key}`);
			}
		} catch (error) {
			console.log("[v0] localStorage error, using memory storage:", error);
			const memoryStorage = getGlobalMemoryStorage();
			memoryStorage[key] = value;
			console.log(`[v0] Saved to global memory storage: ${key}`);
		}
	},

	getItem: (key: string): string | null => {
		try {
			const localValue = localStorage.getItem(key);
			if (localValue !== null) {
				return localValue;
			}
		} catch (error) {
			console.log("[v0] localStorage read error:", error);
		}

		// Fallback to global memory storage
		const memoryStorage = getGlobalMemoryStorage();
		const value = memoryStorage[key] || null;
		if (value) {
			console.log(`[v0] Retrieved from global memory storage: ${key}`);
		}
		return value;
	},

	removeItem: (key: string) => {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.log("[v0] localStorage remove error:", error);
		}
		const memoryStorage = getGlobalMemoryStorage();
		delete memoryStorage[key];
		console.log(`[v0] Removed from global memory storage: ${key}`);
	},
};

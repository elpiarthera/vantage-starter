import { trackEvent } from "@/lib/monitoring/analytics";
import { storage as baseStorage } from "@/lib/storage";

export interface StorageService {
	setItem: (key: string, value: string) => boolean;
	getItem: (key: string) => string | null;
	removeItem: (key: string) => boolean;
	setObject: <T>(key: string, value: T) => boolean;
	getObject: <T>(key: string) => T | null;
}

class EnhancedStorageService implements StorageService {
	setItem(key: string, value: string): boolean {
		try {
			baseStorage.setItem(key, value);
			trackEvent("storage_write", { key, size: value.length });
			return true;
		} catch (error) {
			console.error("[Storage] Failed to set item:", error);
			trackEvent("storage_error", {
				operation: "setItem",
				key,
				error: String(error),
			});
			return false;
		}
	}

	getItem(key: string): string | null {
		try {
			const value = baseStorage.getItem(key);
			if (value) {
				trackEvent("storage_read", { key, size: value.length });
			}
			return value;
		} catch (error) {
			console.error("[Storage] Failed to get item:", error);
			trackEvent("storage_error", {
				operation: "getItem",
				key,
				error: String(error),
			});
			return null;
		}
	}

	removeItem(key: string): boolean {
		try {
			baseStorage.removeItem(key);
			trackEvent("storage_delete", { key });
			return true;
		} catch (error) {
			console.error("[Storage] Failed to remove item:", error);
			trackEvent("storage_error", {
				operation: "removeItem",
				key,
				error: String(error),
			});
			return false;
		}
	}

	setObject<T>(key: string, value: T): boolean {
		try {
			const serialized = JSON.stringify(value);
			return this.setItem(key, serialized);
		} catch (error) {
			console.error("[Storage] Failed to serialize object:", error);
			trackEvent("storage_error", {
				operation: "setObject",
				key,
				error: String(error),
			});
			return false;
		}
	}

	getObject<T>(key: string): T | null {
		try {
			const value = this.getItem(key);
			if (!value) return null;
			return JSON.parse(value) as T;
		} catch (error) {
			console.error("[Storage] Failed to parse object:", error);
			trackEvent("storage_error", {
				operation: "getObject",
				key,
				error: String(error),
			});
			return null;
		}
	}
}

export const storageService = new EnhancedStorageService();

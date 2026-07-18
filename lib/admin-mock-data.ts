// Mock data for admin category and ad management

export interface AdminCategory {
	id: string;
	name: string;
	baseline: string;
	imageUrl: string;
	order: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AdminAd {
	id: string;
	title: string;
	baseline: string;
	imageUrl: string;
	linkUrl?: string;
	order: number;
	isActive: boolean;
	targets: AdTarget[];
	createdAt: string;
	updatedAt: string;
}

export interface AdTarget {
	level: "meta-category" | "category" | "subcategory";
	id: string; // ID of the meta-category, category, or subcategory
}

export interface CategoryWallItem {
	id: string;
	type: "category" | "ad";
	referenceId: string; // ID of the category or ad
	order: number;
}

// Mock categories available in the system
export const mockAdminCategories: AdminCategory[] = [
	{
		id: "cat-1",
		name: "Seating",
		baseline: "Lounge chairs & accent pieces",
		imageUrl: "/elegant-scandinavian-leather-lounge-chair-oak-fram.jpg",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-2",
		name: "Sofas",
		baseline: "Statement pieces for living",
		imageUrl: "/luxury-green-velvet-sofa-in-elegant-room.jpg",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-3",
		name: "Tables",
		baseline: "Dining & occasional tables",
		imageUrl: "/elegant-dining-table-in-luxury-interior.jpg",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-4",
		name: "Lighting",
		baseline: "Illuminate your space",
		imageUrl: "/designer-floor-lamp-in-luxury-room.jpg",
		order: 4,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-5",
		name: "Storage",
		baseline: "Cabinets & shelving systems",
		imageUrl: "/elegant-storage-cabinet-in-modern-interior.jpg",
		order: 5,
		isActive: false,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-6",
		name: "Outdoor",
		baseline: "Garden & patio furniture",
		imageUrl: "/luxury-outdoor-furniture-on-terrace.jpg",
		order: 6,
		isActive: false,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
];

// Mock ads available in the system
export const mockAdminAds: AdminAd[] = [
	{
		id: "ad-1",
		title: "Spring Collection",
		baseline: "Discover our new arrivals",
		imageUrl: "/spring-furniture-collection-showcase.jpg",
		linkUrl: "/collections/spring-2024",
		order: 1,
		isActive: true,
		targets: [
			{ level: "meta-category", id: "meta-alpha" },
			{ level: "category", id: "cat-nightlife" },
		],
		createdAt: "2024-03-01T10:00:00Z",
		updatedAt: "2024-03-01T10:00:00Z",
	},
	{
		id: "ad-2",
		title: "Limited Edition",
		baseline: "Exclusive designer pieces",
		imageUrl: "/limited-edition-luxury-furniture.jpg",
		linkUrl: "/collections/limited-edition",
		order: 2,
		isActive: true,
		targets: [
			{ level: "meta-category", id: "meta-beta" },
			{ level: "category", id: "cat-artisan" },
			{ level: "subcategory", id: "sub-ceramics" },
		],
		createdAt: "2024-03-01T10:00:00Z",
		updatedAt: "2024-03-01T10:00:00Z",
	},
	{
		id: "ad-3",
		title: "Summer Sale",
		baseline: "Up to 40% off selected items",
		imageUrl: "/summer-furniture-sale-banner.jpg",
		linkUrl: "/sale",
		order: 3,
		isActive: false,
		targets: [{ level: "meta-category", id: "meta-gamma" }],
		createdAt: "2024-03-01T10:00:00Z",
		updatedAt: "2024-03-01T10:00:00Z",
	},
];

// Mock configuration for what appears on the category wall
export const mockCategoryWallConfig: CategoryWallItem[] = [
	{ id: "item-1", type: "category", referenceId: "cat-1", order: 1 },
	{ id: "item-2", type: "category", referenceId: "cat-2", order: 2 },
	{ id: "item-3", type: "category", referenceId: "cat-3", order: 3 },
	{ id: "item-4", type: "category", referenceId: "cat-4", order: 4 },
];

// Helper function to get configured category wall items with full data
export function getCategoryWallItems() {
	return mockCategoryWallConfig
		.sort((a, b) => a.order - b.order)
		.map((item) => {
			if (item.type === "category") {
				const category = mockAdminCategories.find(
					(c) => c.id === item.referenceId,
				);
				return category
					? {
							id: category.id,
							name: category.name,
							baseline: category.baseline,
							imageUrl: category.imageUrl,
							type: "category" as const,
						}
					: null;
			} else {
				const ad = mockAdminAds.find((a) => a.id === item.referenceId);
				return ad
					? {
							id: ad.id,
							name: ad.title,
							baseline: ad.baseline,
							imageUrl: ad.imageUrl,
							linkUrl: ad.linkUrl,
							type: "ad" as const,
						}
					: null;
			}
		})
		.filter(Boolean);
}

// Helper functions for CRUD operations (in-memory for now)
export class AdminCategoryStore {
	static getAll(): AdminCategory[] {
		return [...mockAdminCategories].sort((a, b) => a.order - b.order);
	}

	static getById(id: string): AdminCategory | undefined {
		return mockAdminCategories.find((c) => c.id === id);
	}

	static create(
		category: Omit<AdminCategory, "id" | "createdAt" | "updatedAt">,
	): AdminCategory {
		const newCategory: AdminCategory = {
			...category,
			id: `cat-${Date.now()}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		mockAdminCategories.push(newCategory);
		return newCategory;
	}

	static update(
		id: string,
		updates: Partial<AdminCategory>,
	): AdminCategory | undefined {
		const index = mockAdminCategories.findIndex((c) => c.id === id);
		if (index !== -1) {
			mockAdminCategories[index] = {
				...mockAdminCategories[index],
				...updates,
				updatedAt: new Date().toISOString(),
			};
			return mockAdminCategories[index];
		}
		return undefined;
	}

	static delete(id: string): boolean {
		const index = mockAdminCategories.findIndex((c) => c.id === id);
		if (index !== -1) {
			mockAdminCategories.splice(index, 1);
			return true;
		}
		return false;
	}
}

export class AdminAdStore {
	static getAll(): AdminAd[] {
		return [...mockAdminAds].sort((a, b) => a.order - b.order);
	}

	static getById(id: string): AdminAd | undefined {
		return mockAdminAds.find((a) => a.id === id);
	}

	static create(ad: Omit<AdminAd, "id" | "createdAt" | "updatedAt">): AdminAd {
		const newAd: AdminAd = {
			...ad,
			id: `ad-${Date.now()}`,
			targets: ad.targets || [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		mockAdminAds.push(newAd);
		return newAd;
	}

	static update(id: string, updates: Partial<AdminAd>): AdminAd | undefined {
		const index = mockAdminAds.findIndex((a) => a.id === id);
		if (index !== -1) {
			mockAdminAds[index] = {
				...mockAdminAds[index],
				...updates,
				updatedAt: new Date().toISOString(),
			};
			return mockAdminAds[index];
		}
		return undefined;
	}

	static delete(id: string): boolean {
		const index = mockAdminAds.findIndex((a) => a.id === id);
		if (index !== -1) {
			mockAdminAds.splice(index, 1);
			return true;
		}
		return false;
	}

	static getAdsForWall(
		level: "meta-category" | "category" | "subcategory",
		id: string,
	): AdminAd[] {
		return mockAdminAds
			.filter((ad) => {
				if (!ad.isActive) return false;
				// If no targets defined, don't show anywhere
				if (!ad.targets || ad.targets.length === 0) return false;
				// Check if this wall is in the targets
				return ad.targets.some(
					(target) => target.level === level && target.id === id,
				);
			})
			.sort((a, b) => a.order - b.order);
	}

	static getAllActiveAds(): AdminAd[] {
		return mockAdminAds
			.filter((ad) => ad.isActive)
			.sort((a, b) => a.order - b.order);
	}
}

export class CategoryWallConfigStore {
	static getConfig(): CategoryWallItem[] {
		return [...mockCategoryWallConfig].sort((a, b) => a.order - b.order);
	}

	static addItem(
		type: "category" | "ad",
		referenceId: string,
	): CategoryWallItem {
		const maxOrder = Math.max(...mockCategoryWallConfig.map((i) => i.order), 0);
		const newItem: CategoryWallItem = {
			id: `item-${Date.now()}`,
			type,
			referenceId,
			order: maxOrder + 1,
		};
		mockCategoryWallConfig.push(newItem);
		return newItem;
	}

	static removeItem(id: string): boolean {
		const index = mockCategoryWallConfig.findIndex((i) => i.id === id);
		if (index !== -1) {
			mockCategoryWallConfig.splice(index, 1);
			return true;
		}
		return false;
	}

	static reorderItems(items: CategoryWallItem[]): void {
		mockCategoryWallConfig.length = 0;
		mockCategoryWallConfig.push(...items);
	}
}

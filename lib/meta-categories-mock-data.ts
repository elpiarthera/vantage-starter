// Mock data for 3-level meta-categories system

export interface MetaCategory {
	id: string;
	name: string;
	description: string;
	imageUrl: string;
	icon?: string;
	order: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Category {
	id: string;
	metaCategoryId: string;
	name: string;
	baseline: string;
	description?: string;
	imageUrl: string;
	order: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface SubCategory {
	id: string;
	categoryId: string;
	name: string;
	baseline: string;
	description?: string;
	imageUrl: string;
	order: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// Ad placement can target any level
export interface TargetedAd {
	id: string;
	title: string;
	baseline: string;
	imageUrl: string;
	linkUrl?: string;
	// Targeting: specify ONE of the following
	metaCategoryId?: string; // Ad appears in this meta-category
	categoryId?: string; // Ad appears in this category
	subCategoryId?: string; // Ad appears in this sub-category
	order: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// Wall configuration for each level
export interface WallItem {
	id: string;
	type: "meta-category" | "category" | "sub-category" | "ad";
	referenceId: string;
	parentId?: string; // For categories/subcategories, specifies which parent they belong to
	order: number;
}

// ============================================
// MOCK DATA - Illustrative multi-vertical examples (fictional)
// ============================================

export const mockMetaCategories: MetaCategory[] = [
	{
		id: "meta-1",
		name: "Going Out",
		description: "Events, concerts, nightlife, cinema",
		imageUrl: "/nightlife-events-concerts-cinema.jpg",
		icon: "🎉",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "meta-2",
		name: "Dev Toolbox",
		description: "Dev Tools, AI/SaaS Resources, Hosting/Deployment",
		imageUrl: "/coding-development-tools-programming.jpg",
		icon: "💻",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "meta-3",
		name: "Auto Market",
		description: "Used Cars Buy/Sell, Services (insurance, repair, tires)",
		imageUrl: "/cars-automobiles-vehicles.jpg",
		icon: "🚗",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "meta-4",
		name: "Home Rentals",
		description: "Apartment Rentals, Listings, Real Estate Agencies",
		imageUrl: "/apartment-rental-real-estate-home.jpg",
		icon: "🏠",
		order: 4,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "meta-5",
		name: "Web3 & Crypto",
		description: "Blockchain Tools, Crypto Resources, DeFi/NFTs",
		imageUrl: "/blockchain-cryptocurrency-web3-nft.jpg",
		icon: "⚡",
		order: 5,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "meta-6",
		name: "Food & Dining",
		description: "Food Delivery, Restaurants, Recipes/Reviews",
		imageUrl: "/food-restaurant-dining-cuisine.jpg",
		icon: "🍽️",
		order: 6,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "meta-7",
		name: "Local Marketplace",
		description: "Locally made products, artisan and regional goods",
		imageUrl: "/french-products-artisan-local-goods.jpg",
		icon: "🇫🇷",
		order: 7,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "meta-8",
		name: "Style & Beauty",
		description: "Fashion Trends, Beauty Products, Styling Advice",
		imageUrl: "/fashion-beauty-style-trendy.jpg",
		icon: "✨",
		order: 8,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
];

export const mockCategories: Category[] = [
	// Going Out categories
	{
		id: "cat-1-1",
		metaCategoryId: "meta-1",
		name: "Concerts & Live Music",
		baseline: "Rock, pop, jazz, classical performances",
		imageUrl: "/concert-live-music-performance.jpg",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-1-2",
		metaCategoryId: "meta-1",
		name: "Nightlife & Clubs",
		baseline: "Bars, nightclubs, DJ events",
		imageUrl: "/nightclub-bar-dancing.jpg",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-1-3",
		metaCategoryId: "meta-1",
		name: "Cinema & Theater",
		baseline: "Movies, plays, shows",
		imageUrl: "/cinema-theater-movie.jpg",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-1-4",
		metaCategoryId: "meta-1",
		name: "Events & Festivals",
		baseline: "Cultural events, festivals, fairs",
		imageUrl: "/festival-event-cultural-fair.jpg",
		order: 4,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Dev Toolbox categories
	{
		id: "cat-2-1",
		metaCategoryId: "meta-2",
		name: "Dev Tools",
		baseline: "IDEs, editors, productivity tools",
		imageUrl: "/developer-tools-ide-editor.jpg",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-2-2",
		metaCategoryId: "meta-2",
		name: "AI & SaaS Tools",
		baseline: "AI platforms, SaaS solutions",
		imageUrl: "/ai-saas-software-cloud.jpg",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-2-3",
		metaCategoryId: "meta-2",
		name: "Hosting & Deployment",
		baseline: "Cloud hosting, CI/CD, serverless",
		imageUrl: "/cloud-hosting-deployment-server.jpg",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Auto Market categories
	{
		id: "cat-3-1",
		metaCategoryId: "meta-3",
		name: "Used Cars",
		baseline: "Buy and sell pre-owned vehicles",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-3-2",
		metaCategoryId: "meta-3",
		name: "Car Services",
		baseline: "Insurance, repair, maintenance",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-3-3",
		metaCategoryId: "meta-3",
		name: "Parts & Accessories",
		baseline: "Tires, parts, accessories",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Home Rentals categories
	{
		id: "cat-4-1",
		metaCategoryId: "meta-4",
		name: "Apartment Listings",
		baseline: "Available rentals in your area",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-4-2",
		metaCategoryId: "meta-4",
		name: "Real Estate Agencies",
		baseline: "Professional rental services",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Web3 & Crypto categories
	{
		id: "cat-5-1",
		metaCategoryId: "meta-5",
		name: "Blockchain Tools",
		baseline: "Development frameworks, wallets",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-5-2",
		metaCategoryId: "meta-5",
		name: "DeFi & NFTs",
		baseline: "Decentralized finance, NFT platforms",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Food & Dining categories
	{
		id: "cat-6-1",
		metaCategoryId: "meta-6",
		name: "Food Delivery",
		baseline: "Order from local restaurants",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-6-2",
		metaCategoryId: "meta-6",
		name: "Restaurants",
		baseline: "Dine-in experiences",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-6-3",
		metaCategoryId: "meta-6",
		name: "Recipes & Reviews",
		baseline: "Cooking guides and food reviews",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Local Marketplace categories
	{
		id: "cat-7-1",
		metaCategoryId: "meta-7",
		name: "Artisan Products",
		baseline: "Handcrafted regional goods",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-7-2",
		metaCategoryId: "meta-7",
		name: "Local Goods",
		baseline: "Locally manufactured products",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Style & Beauty categories
	{
		id: "cat-8-1",
		metaCategoryId: "meta-8",
		name: "Fashion Trends",
		baseline: "Latest styles and trends",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-8-2",
		metaCategoryId: "meta-8",
		name: "Beauty Products",
		baseline: "Skincare, makeup, cosmetics",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "cat-8-3",
		metaCategoryId: "meta-8",
		name: "Styling Advice",
		baseline: "Personal styling and tips",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
];

export const mockSubCategories: SubCategory[] = [
	// Concerts & Live Music subcategories
	{
		id: "sub-1-1-1",
		categoryId: "cat-1-1",
		name: "Rock Concerts",
		baseline: "Rock and alternative shows",
		imageUrl: "/rock-concert-venue-stage-crowd.jpg", // Added real concert venue image
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-1-1-2",
		categoryId: "cat-1-1",
		name: "Jazz & Blues",
		baseline: "Smooth jazz and blues performances",
		imageUrl: "/jazz-blues-club-intimate-venue.jpg", // Added real jazz club image
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-1-1-3",
		categoryId: "cat-1-1",
		name: "Classical Music",
		baseline: "Orchestra and classical concerts",
		imageUrl: "/classical-orchestra-concert-hall.jpg", // Added real orchestra hall image
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-1-1-4",
		categoryId: "cat-1-1",
		name: "Electronic & DJ Sets",
		baseline: "EDM, house, and electronic music",
		imageUrl: "/electronic-dj-nightclub-festival.jpg", // Added real DJ/electronic music image
		order: 4,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Dev Tools subcategories
	{
		id: "sub-2-1-1",
		categoryId: "cat-2-1",
		name: "Code Editors",
		baseline: "VS Code, Sublime, Atom",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-2-1-2",
		categoryId: "cat-2-1",
		name: "Version Control",
		baseline: "Git, GitHub, GitLab",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-2-1-3",
		categoryId: "cat-2-1",
		name: "Debugging Tools",
		baseline: "Chrome DevTools, debuggers",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Used Cars subcategories
	{
		id: "sub-3-1-1",
		categoryId: "cat-3-1",
		name: "Sedans",
		baseline: "4-door family cars",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-3-1-2",
		categoryId: "cat-3-1",
		name: "SUVs",
		baseline: "Sport utility vehicles",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-3-1-3",
		categoryId: "cat-3-1",
		name: "Compact Cars",
		baseline: "Small efficient vehicles",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Food Delivery subcategories
	{
		id: "sub-6-1-1",
		categoryId: "cat-6-1",
		name: "Pizza Delivery",
		baseline: "Hot pizzas delivered",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-6-1-2",
		categoryId: "cat-6-1",
		name: "Asian Cuisine",
		baseline: "Sushi, Thai, Chinese delivery",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-6-1-3",
		categoryId: "cat-6-1",
		name: "Fast Food",
		baseline: "Burgers, fries, quick meals",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	// Fashion Trends subcategories
	{
		id: "sub-8-1-1",
		categoryId: "cat-8-1",
		name: "Streetwear",
		baseline: "Urban fashion and style",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-8-1-2",
		categoryId: "cat-8-1",
		name: "Luxury Fashion",
		baseline: "High-end designer pieces",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-8-1-3",
		categoryId: "cat-8-1",
		name: "Sustainable Fashion",
		baseline: "Eco-friendly clothing",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},

	{
		id: "sub-7-1-1",
		categoryId: "cat-7-1",
		name: "Furniture & Decor",
		baseline: "Handcrafted artisan furniture",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 1,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-7-1-2",
		categoryId: "cat-7-1",
		name: "Textiles & Fabrics",
		baseline: "Woven linens and textiles",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 2,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "sub-7-1-3",
		categoryId: "cat-7-1",
		name: "Ceramics & Pottery",
		baseline: "Handmade studio ceramics",
		imageUrl: "/placeholder.svg?height=400&width=600",
		order: 3,
		isActive: true,
		createdAt: "2024-01-15T10:00:00Z",
		updatedAt: "2024-01-15T10:00:00Z",
	},
];

export const mockTargetedAds: TargetedAd[] = [
	{
		id: "ad-meta-1",
		title: "Summer Festival Pass",
		baseline: "Get 20% off all festival tickets",
		imageUrl: "/placeholder.svg?height=400&width=600",
		linkUrl: "/promotions/summer-festival",
		metaCategoryId: "meta-1",
		order: 1,
		isActive: true,
		createdAt: "2024-03-01T10:00:00Z",
		updatedAt: "2024-03-01T10:00:00Z",
	},
	{
		id: "ad-cat-2-1",
		title: "Premium IDE License",
		baseline: "Save 50% on JetBrains tools",
		imageUrl: "/placeholder.svg?height=400&width=600",
		linkUrl: "/promotions/jetbrains",
		categoryId: "cat-2-1",
		order: 1,
		isActive: true,
		createdAt: "2024-03-01T10:00:00Z",
		updatedAt: "2024-03-01T10:00:00Z",
	},
	{
		id: "ad-sub-3-1-1",
		title: "Certified Used Sedans",
		baseline: "Warranty included, low mileage",
		imageUrl: "/placeholder.svg?height=400&width=600",
		linkUrl: "/promotions/certified-sedans",
		subCategoryId: "sub-3-1-1",
		order: 1,
		isActive: true,
		createdAt: "2024-03-01T10:00:00Z",
		updatedAt: "2024-03-01T10:00:00Z",
	},
];

// ============================================
// HELPER FUNCTIONS & STORES
// ============================================

// Get meta-categories for the main wall
export function getMetaCategoryWall(): MetaCategory[] {
	return mockMetaCategories
		.filter((mc) => mc.isActive)
		.sort((a, b) => a.order - b.order);
}

// Get categories for a specific meta-category
export function getCategoriesForMetaCategory(
	metaCategoryId: string,
): Category[] {
	return mockCategories
		.filter((c) => c.metaCategoryId === metaCategoryId && c.isActive)
		.sort((a, b) => a.order - b.order);
}

// Get subcategories for a specific category
export function getSubCategoriesForCategory(categoryId: string): SubCategory[] {
	return mockSubCategories
		.filter((sc) => sc.categoryId === categoryId && sc.isActive)
		.sort((a, b) => a.order - b.order);
}

// Get ads for a specific level
export function getAdsForLevel(
	metaCategoryId?: string,
	categoryId?: string,
	subCategoryId?: string,
): TargetedAd[] {
	return mockTargetedAds.filter((ad) => {
		if (!ad.isActive) return false;
		if (subCategoryId && ad.subCategoryId === subCategoryId) return true;
		if (categoryId && ad.categoryId === categoryId) return true;
		if (metaCategoryId && ad.metaCategoryId === metaCategoryId) return true;
		return false;
	});
}

// Get full breadcrumb path
export function getBreadcrumbPath(
	metaCategoryId?: string,
	categoryId?: string,
	subCategoryId?: string,
): Array<{
	id: string;
	name: string;
	level: "meta" | "category" | "subcategory";
}> {
	const breadcrumbs: Array<{
		id: string;
		name: string;
		level: "meta" | "category" | "subcategory";
	}> = [];

	if (metaCategoryId) {
		const meta = mockMetaCategories.find((m) => m.id === metaCategoryId);
		if (meta) {
			breadcrumbs.push({ id: meta.id, name: meta.name, level: "meta" });
		}
	}

	if (categoryId) {
		const category = mockCategories.find((c) => c.id === categoryId);
		if (category) {
			breadcrumbs.push({
				id: category.id,
				name: category.name,
				level: "category",
			});
		}
	}

	if (subCategoryId) {
		const subCategory = mockSubCategories.find((sc) => sc.id === subCategoryId);
		if (subCategory) {
			breadcrumbs.push({
				id: subCategory.id,
				name: subCategory.name,
				level: "subcategory",
			});
		}
	}

	return breadcrumbs;
}

// CRUD Stores for Admin
export class MetaCategoryStore {
	static getAll(): MetaCategory[] {
		return [...mockMetaCategories].sort((a, b) => a.order - b.order);
	}

	static getById(id: string): MetaCategory | undefined {
		return mockMetaCategories.find((m) => m.id === id);
	}

	static create(
		data: Omit<MetaCategory, "id" | "createdAt" | "updatedAt">,
	): MetaCategory {
		const newItem: MetaCategory = {
			...data,
			id: `meta-${Date.now()}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		mockMetaCategories.push(newItem);
		return newItem;
	}

	static update(
		id: string,
		updates: Partial<MetaCategory>,
	): MetaCategory | undefined {
		const index = mockMetaCategories.findIndex((m) => m.id === id);
		if (index !== -1) {
			mockMetaCategories[index] = {
				...mockMetaCategories[index],
				...updates,
				updatedAt: new Date().toISOString(),
			};
			return mockMetaCategories[index];
		}
		return undefined;
	}

	static delete(id: string): boolean {
		const index = mockMetaCategories.findIndex((m) => m.id === id);
		if (index !== -1) {
			mockMetaCategories.splice(index, 1);
			return true;
		}
		return false;
	}
}

export class CategoryStore {
	static getAll(): Category[] {
		return [...mockCategories].sort((a, b) => a.order - b.order);
	}

	static getById(id: string): Category | undefined {
		return mockCategories.find((c) => c.id === id);
	}

	static getCategoryById(id: string): Category | undefined {
		return mockCategories.find((c) => c.id === id);
	}

	static getByMetaCategory(metaCategoryId: string): Category[] {
		return mockCategories
			.filter((c) => c.metaCategoryId === metaCategoryId)
			.sort((a, b) => a.order - b.order);
	}

	static create(
		data: Omit<Category, "id" | "createdAt" | "updatedAt">,
	): Category {
		const newItem: Category = {
			...data,
			id: `cat-${Date.now()}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		mockCategories.push(newItem);
		return newItem;
	}

	static update(id: string, updates: Partial<Category>): Category | undefined {
		const index = mockCategories.findIndex((c) => c.id === id);
		if (index !== -1) {
			mockCategories[index] = {
				...mockCategories[index],
				...updates,
				updatedAt: new Date().toISOString(),
			};
			return mockCategories[index];
		}
		return undefined;
	}

	static delete(id: string): boolean {
		const index = mockCategories.findIndex((c) => c.id === id);
		if (index !== -1) {
			mockCategories.splice(index, 1);
			return true;
		}
		return false;
	}
}

export class SubCategoryStore {
	static getAll(): SubCategory[] {
		return [...mockSubCategories].sort((a, b) => a.order - b.order);
	}

	static getById(id: string): SubCategory | undefined {
		return mockSubCategories.find((sc) => sc.id === id);
	}

	static getSubCategoryById(id: string): SubCategory | undefined {
		return mockSubCategories.find((sc) => sc.id === id);
	}

	static getByCategory(categoryId: string): SubCategory[] {
		return mockSubCategories
			.filter((sc) => sc.categoryId === categoryId)
			.sort((a, b) => a.order - b.order);
	}

	static create(
		data: Omit<SubCategory, "id" | "createdAt" | "updatedAt">,
	): SubCategory {
		const newItem: SubCategory = {
			...data,
			id: `sub-${Date.now()}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		mockSubCategories.push(newItem);
		return newItem;
	}

	static update(
		id: string,
		updates: Partial<SubCategory>,
	): SubCategory | undefined {
		const index = mockSubCategories.findIndex((sc) => sc.id === id);
		if (index !== -1) {
			mockSubCategories[index] = {
				...mockSubCategories[index],
				...updates,
				updatedAt: new Date().toISOString(),
			};
			return mockSubCategories[index];
		}
		return undefined;
	}

	static delete(id: string): boolean {
		const index = mockSubCategories.findIndex((sc) => sc.id === id);
		if (index !== -1) {
			mockSubCategories.splice(index, 1);
			return true;
		}
		return false;
	}
}

export class TargetedAdStore {
	static getAll(): TargetedAd[] {
		return [...mockTargetedAds].sort((a, b) => a.order - b.order);
	}

	static getById(id: string): TargetedAd | undefined {
		return mockTargetedAds.find((ad) => ad.id === id);
	}

	static create(
		data: Omit<TargetedAd, "id" | "createdAt" | "updatedAt">,
	): TargetedAd {
		const newItem: TargetedAd = {
			...data,
			id: `ad-${Date.now()}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		mockTargetedAds.push(newItem);
		return newItem;
	}

	static update(
		id: string,
		updates: Partial<TargetedAd>,
	): TargetedAd | undefined {
		const index = mockTargetedAds.findIndex((ad) => ad.id === id);
		if (index !== -1) {
			mockTargetedAds[index] = {
				...mockTargetedAds[index],
				...updates,
				updatedAt: new Date().toISOString(),
			};
			return mockTargetedAds[index];
		}
		return undefined;
	}

	static delete(id: string): boolean {
		const index = mockTargetedAds.findIndex((ad) => ad.id === id);
		if (index !== -1) {
			mockTargetedAds.splice(index, 1);
			return true;
		}
		return false;
	}
}

export const metaCategoriesStore = {
	// Meta-category operations
	getAll: () => MetaCategoryStore.getAll(),
	getById: (id: string) => MetaCategoryStore.getById(id),
	create: (data: Omit<MetaCategory, "id" | "createdAt" | "updatedAt">) =>
		MetaCategoryStore.create(data),
	update: (id: string, updates: Partial<MetaCategory>) =>
		MetaCategoryStore.update(id, updates),
	delete: (id: string) => MetaCategoryStore.delete(id),

	// Category operations
	getAllCategories: () => CategoryStore.getAll(),
	getCategoryById: (id: string) => CategoryStore.getById(id),
	getCategoriesByMetaId: (metaCategoryId: string) =>
		CategoryStore.getByMetaCategory(metaCategoryId),
	createCategory: (data: Omit<Category, "id" | "createdAt" | "updatedAt">) =>
		CategoryStore.create(data),
	updateCategory: (id: string, updates: Partial<Category>) =>
		CategoryStore.update(id, updates),
	deleteCategory: (id: string) => CategoryStore.delete(id),

	// SubCategory operations
	getAllSubCategories: () => SubCategoryStore.getAll(),
	getSubCategoryById: (id: string) => SubCategoryStore.getById(id),
	getSubCategoriesByCategoryId: (categoryId: string) =>
		SubCategoryStore.getByCategory(categoryId),
	createSubCategory: (
		data: Omit<SubCategory, "id" | "createdAt" | "updatedAt">,
	) => SubCategoryStore.create(data),
	updateSubCategory: (id: string, updates: Partial<SubCategory>) =>
		SubCategoryStore.update(id, updates),
	deleteSubCategory: (id: string) => SubCategoryStore.delete(id),
};

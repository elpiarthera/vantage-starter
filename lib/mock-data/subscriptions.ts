// Mock Subscriptions Data
// Based on convex-database-schema.md - subscriptions table

export interface MockSubscription {
	id: string;
	organizationId: string;
	polarSubscriptionId: string;
	polarCustomerId: string;
	polarProductId: string;
	status: "active" | "canceled" | "past_due" | "trialing";
	currentPeriodStart: number;
	currentPeriodEnd: number;
	cancelAtPeriodEnd: boolean;
	plan: {
		name: string;
		tier: "free" | "starter" | "pro" | "enterprise";
		monthlyCredits: number;
		features: string[];
	};
	createdAt: number;
	updatedAt: number;
	canceledAt?: number;
}

export const mockSubscriptions: MockSubscription[] = [
	{
		id: "sub_1",
		organizationId: "org_individual_user1",
		polarSubscriptionId: "polar_sub_abc123",
		polarCustomerId: "polar_cust_abc123",
		polarProductId: "polar_prod_pro",
		status: "active",
		currentPeriodStart: Date.now() - 86400000 * 15, // 15 days ago
		currentPeriodEnd: Date.now() + 86400000 * 15, // 15 days from now
		cancelAtPeriodEnd: false,
		plan: {
			name: "Pro Plan",
			tier: "pro",
			monthlyCredits: 500,
			features: [
				"Unlimited projects",
				"500 AI credits per month",
				"HD video export",
				"Priority support",
				"Custom templates",
				"Advanced analytics",
			],
		},
		createdAt: Date.now() - 86400000 * 60,
		updatedAt: Date.now() - 86400000 * 15,
	},
	{
		id: "sub_2",
		organizationId: "org_2abc123xyz",
		polarSubscriptionId: "polar_sub_def456",
		polarCustomerId: "polar_cust_def456",
		polarProductId: "polar_prod_starter",
		status: "active",
		currentPeriodStart: Date.now() - 86400000 * 10,
		currentPeriodEnd: Date.now() + 86400000 * 20,
		cancelAtPeriodEnd: false,
		plan: {
			name: "Starter Plan",
			tier: "starter",
			monthlyCredits: 100,
			features: [
				"10 projects per month",
				"100 AI credits per month",
				"SD video export",
				"Email support",
				"Basic templates",
			],
		},
		createdAt: Date.now() - 86400000 * 180,
		updatedAt: Date.now() - 86400000 * 10,
	},
];

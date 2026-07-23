import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { agentChat } from "./http/agent";
import { chat as aiChat } from "./http/ai";
import { polar } from "./polar";

const http = httpRouter();

/**
 * Register Polar webhook routes with custom credit allocation handlers
 *
 * Pattern from: /home/laurentperello/polar/example/convex/http.ts
 *
 * The component handles:
 * - Built-in events: subscription.created, subscription.updated, product.created, etc.
 * - Signature verification (automatic)
 * - Idempotency (timestamp-guarded upserts)
 *
 * We add custom handlers for:
 * - order.paid: Add credits from one-time purchases (AFTER payment succeeds)
 * - order.created: Add monthly credits from subscription renewals
 * - subscription.updated: Log subscription changes
 */
polar.registerRoutes(http, {
	path: "/polar/events", // Default path, must match webhook URL in Polar dashboard
	events: {
		// ============================================
		// CUSTOM HANDLER: One-Time Credit Purchases
		// ============================================
		"order.paid": async (ctx, event) => {
			// Fires when user completes payment — covers both subscription creation
			// orders and one-time credit package purchases.
			// Use order.paid (not order.created) — payment is guaranteed succeeded.
			//
			// NOTE: ctx here is RunMutationCtx (runQuery + runMutation only, no ctx.db).
			// The @convex-dev/polar component stores customers with metadata: { userId: <convex_doc_id> }
			// NOT clerk_user_id. We resolve clerkUserId via internal.users.getByConvexId.

			const convexUserId = event.data.customer?.metadata?.userId as
				| string
				| undefined;
			const orderId = event.data.id;
			const productId = event.data.productId;

			if (!convexUserId) {
				console.error("Missing userId in order.paid customer metadata", {
					orderId,
				});
				return;
			}

			// Resolve Convex user → clerkUserId
			const user = await ctx.runQuery(internal.users.getByConvexId, {
				convexUserId,
			});
			if (!user) {
				console.error("User not found for order.paid", {
					convexUserId,
					orderId,
				});
				return;
			}

			// Look up tier from subscriptionTiers (single source of truth).
			const tier = await ctx.runQuery(
				internal.subscriptionTiers.getByPolarProductId,
				{ polarProductId: productId },
			);

			if (!tier) {
				console.error(
					"Unknown product ID in order.paid — not found in subscriptionTiers",
					{ productId, orderId },
				);
				return;
			}

			// Subscriptions: grant initialCredits. Credit packages: initialCredits + bonusCredits.
			const creditAmount =
				tier.productType === "subscription"
					? tier.initialCredits
					: tier.initialCredits + (tier.bonusCredits ?? 0);

			try {
				const result = await ctx.runMutation(
					internal.credits.addPurchaseCredits,
					{
						clerkUserId: user.clerkUserId,
						polarOrderId: orderId,
						polarProductId: productId,
						creditAmount,
					},
				);

				if (result.success) {
					if (result.alreadyProcessed) {
						console.log(`Order ${orderId} already processed (idempotency)`);
					} else {
						console.log(
							`Credits added for order ${orderId}: ${creditAmount} credits`,
						);
					}
				} else {
					console.error("Failed to add credits for order.paid:", result.reason);
				}
			} catch (error) {
				console.error("Error processing order.paid:", error);
			}

			// Record a `purchases` row for one-time products (credit packages
			// and any other one_time SKU) — separate try/catch so a failure
			// here never touches the credits grant above.
			if (tier.productType === "one_time") {
				try {
					await ctx.runMutation(internal.purchases.recordFromWebhookOrder, {
						userId: user.clerkUserId,
						productKey: tier.tierKey,
						productType: tier.productType,
						fulfillmentKind: tier.fulfillmentKind,
						polarOrderId: orderId,
					});
				} catch (error) {
					console.error("Error recording purchase for order.paid:", error);
				}
			}
		},

		// ============================================
		// CUSTOM HANDLER: Subscription Renewals (Monthly Credits)
		// ============================================
		"order.created": async (ctx, event) => {
			// Fires on every new order — filter to subscription renewals only.
			// Initial subscription creation credits are handled by order.paid.
			if (event.data.billingReason !== "subscription_cycle") {
				return;
			}

			// The @convex-dev/polar component stores customers with metadata: { userId: <convex_doc_id> }
			const convexUserId = event.data.customer?.metadata?.userId as
				| string
				| undefined;
			const subscriptionId = event.data.subscriptionId;
			const orderId = event.data.id;
			const productId = event.data.productId;

			if (!convexUserId || !subscriptionId || !productId) {
				console.error(
					"Missing userId, subscriptionId, or productId in order.created",
					{ orderId },
				);
				return;
			}

			// Resolve Convex user → clerkUserId
			const user = await ctx.runQuery(internal.users.getByConvexId, {
				convexUserId,
			});
			if (!user) {
				console.error("User not found for order.created renewal", {
					convexUserId,
					orderId,
				});
				return;
			}

			try {
				const result = await ctx.runMutation(
					internal.credits.addMonthlyRenewalCreditsFixed,
					{
						clerkUserId: user.clerkUserId,
						polarSubscriptionId: subscriptionId,
						polarOrderId: orderId,
						polarProductId: productId,
					},
				);

				if (result.success) {
					console.log(`Monthly renewal credits added for order ${orderId}`);
				} else {
					if (result.reason === "duplicate") {
						console.log(`Renewal ${orderId} already processed (idempotency)`);
					} else {
						console.error(
							"Failed to add monthly renewal credits:",
							result.reason,
						);
					}
				}
			} catch (error) {
				console.error("Error processing order.created renewal:", error);
			}
		},

		// ============================================
		// OPTIONAL: Additional logging for debugging
		// ============================================
		"subscription.created": async (_ctx, event) => {
			// The component's built-in handler stores the subscription in Convex DB.
			// Initial credits are granted by the order.paid handler.
			console.log("Subscription created:", event.data.id);
		},

		"subscription.updated": async (ctx, event) => {
			console.log(
				"Subscription updated:",
				event.data.id,
				"Status:",
				event.data.status,
			);

			// Resolve Convex user from customer metadata
			// Subscription.customer is non-optional (SubscriptionCustomer type confirmed from @polar-sh/sdk)
			const convexUserId = event.data.customer.metadata?.userId as
				| string
				| undefined;

			if (!convexUserId) {
				console.error(
					"subscription.updated: Missing userId in customer metadata",
					{ subscriptionId: event.data.id, customerId: event.data.customerId },
				);
				return;
			}

			const user = await ctx.runQuery(internal.users.getByConvexId, {
				convexUserId,
			});

			if (!user) {
				console.error("subscription.updated: User not found", {
					convexUserId,
					subscriptionId: event.data.id,
				});
				return;
			}

			// Handle tier changes (upgrade / downgrade / trial start).
			// "trialing" is included: a user starting a trial for tier_2 fires this event
			// with status:"trialing" and the new productId — we must update the tierKey.
			if (
				["active", "trialing"].includes(event.data.status) &&
				event.data.productId
			) {
				const tier = await ctx.runQuery(
					internal.subscriptionTiers.getByPolarProductId,
					{ polarProductId: event.data.productId },
				);

				if (tier) {
					await ctx.runMutation(internal.subscriptions.updateTierByWebhook, {
						clerkUserId: user.clerkUserId,
						tierKey: tier.tierKey,
						polarSubscriptionId: event.data.id,
					});
					console.log(
						`Subscription tier updated: ${tier.tierKey} for user ${user.clerkUserId}`,
					);
				} else {
					console.error(
						"subscription.updated: Unknown productId — tier not found in DB",
						{ productId: event.data.productId, subscriptionId: event.data.id },
					);
				}
			}

			if (event.data.customerCancellationReason) {
				console.log(
					"Customer cancellation reason:",
					event.data.customerCancellationReason,
				);
				console.log(
					"Customer cancellation comment:",
					event.data.customerCancellationComment,
				);
			}
		},
	},
});

// ============================================================================
// AI STREAMING ROUTES
// ============================================================================
http.route({
	path: "/ai/chat",
	method: "POST",
	handler: aiChat,
});

http.route({
	path: "/ai/chat",
	method: "OPTIONS",
	handler: aiChat,
});

// ============================================================================
// AGENT ROUTES (AI SDK v6 ToolLoopAgent)
// ============================================================================
http.route({
	path: "/ai/agent",
	method: "POST",
	handler: agentChat,
});

http.route({
	path: "/ai/agent",
	method: "OPTIONS",
	handler: agentChat,
});

export default http;

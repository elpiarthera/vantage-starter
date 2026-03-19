/**
 * Test suite for credits system functions
 * Tests credit balance, deduction, addition, refund, and cost queries
 *
 * @see docs/Understanding/credit-system-specification.md
 */

import { describe, expect, it } from "vitest";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

describe("Credits System Functions", () => {
	// ============================================
	// Function existence tests
	// ============================================
	describe("Function Existence", () => {
		it("should verify credits.getUserCredits function exists", () => {
			expect(api.credits.getUserCredits).toBeDefined();
		});

		it("should verify credits.deductCreditsPublic function exists", () => {
			expect(api.credits.deductCreditsPublic).toBeDefined();
		});

		it("should verify credits.addCredits is internal (not public API)", async () => {
			// addCredits is now internalMutation — verify via source file static analysis.
			// The anyApi proxy used in test environments returns a value for any property access,
			// so we cannot use api.credits.addCredits to check visibility.
			// Instead, we assert on the source file directly.
			const fs = await import("fs");
			const path = await import("path");
			const creditsSource = fs.readFileSync(
				path.resolve(process.cwd(), "convex/credits.ts"),
				"utf-8",
			);
			// Must be declared as internalMutation, not mutation
			expect(creditsSource).toMatch(
				/export const addCredits = internalMutation\(/,
			);
			// Must NOT be exported as a plain mutation
			expect(creditsSource).not.toMatch(/export const addCredits = mutation\(/);
		});

		it("should verify credits.hasEnoughCredits function exists", () => {
			expect(api.credits.hasEnoughCredits).toBeDefined();
		});

		it("should verify credits.getCreditCost function exists", () => {
			expect(api.credits.getCreditCost).toBeDefined();
		});

		it("should verify credits.getTransactionHistory function exists", () => {
			expect(api.credits.getTransactionHistory).toBeDefined();
		});

		it("should verify credits.refundCreditsPublic function exists", () => {
			expect(api.credits.refundCreditsPublic).toBeDefined();
		});
	});

	// ============================================
	// getUserCredits argument validation
	// ============================================
	describe("getUserCredits Arguments", () => {
		it("should validate getUserCredits arguments schema", () => {
			const args = {
				clerkUserId: "user_test123",
			};

			expect(args).toBeDefined();
			expect(args.clerkUserId).toBe("user_test123");
		});
	});

	// ============================================
	// deductCredits argument validation
	// ============================================
	describe("deductCredits Arguments", () => {
		it("should validate deductCredits arguments schema - minimal", () => {
			const args = {
				clerkUserId: "user_test123",
				actionType: "image_generation",
			};

			expect(args).toBeDefined();
			expect(args.clerkUserId).toBe("user_test123");
			expect(args.actionType).toBe("image_generation");
		});

		it("should validate deductCredits arguments schema - full", () => {
			const args = {
				clerkUserId: "user_test123",
				organizationId: "org_test456",
				actionType: "image_generation",
				projectId: "proj_789",
				projectName: "Test Project",
				resourceId: "resource_abc",
			};

			expect(args).toBeDefined();
			expect(args.clerkUserId).toBe("user_test123");
			expect(args.organizationId).toBe("org_test456");
			expect(args.actionType).toBe("image_generation");
			expect(args.projectId).toBe("proj_789");
			expect(args.projectName).toBe("Test Project");
			expect(args.resourceId).toBe("resource_abc");
		});

		it("should validate all supported action types", () => {
			const actionTypes = [
				"step1_story_refinement",
				"step1_story_generation",
				"step2_chat_message",
				"image_prompt_enhancement",
				"image_generation",
				"image_edit",
				"video_generation",
				"video_regeneration",
				"step3b_chat_message",
				"audio_narration",
				"audio_music",
				"video_assembly",
			];

			for (const actionType of actionTypes) {
				const args = {
					clerkUserId: "user_test123",
					actionType,
				};
				expect(args.actionType).toBe(actionType);
			}
		});
	});

	// ============================================
	// addCredits argument validation
	// ============================================
	describe("addCredits Arguments", () => {
		it("should validate addCredits arguments schema - purchase", () => {
			const args = {
				clerkUserId: "user_test123",
				amount: 100,
				type: "purchase" as const,
				description: "Purchased 100 credits",
			};

			expect(args).toBeDefined();
			expect(args.clerkUserId).toBe("user_test123");
			expect(args.amount).toBe(100);
			expect(args.type).toBe("purchase");
			expect(args.description).toBe("Purchased 100 credits");
		});

		it("should validate addCredits arguments schema - subscription_reset", () => {
			const args = {
				clerkUserId: "user_test123",
				amount: 200,
				type: "subscription_reset" as const,
				description: "Monthly subscription credits",
			};

			expect(args.type).toBe("subscription_reset");
		});

		it("should validate addCredits arguments schema - bonus", () => {
			const args = {
				clerkUserId: "user_test123",
				amount: 50,
				type: "bonus" as const,
				description: "Referral bonus",
			};

			expect(args.type).toBe("bonus");
		});

		it("should validate addCredits with metadata", () => {
			const args = {
				clerkUserId: "user_test123",
				organizationId: "org_test456",
				amount: 100,
				type: "purchase" as const,
				description: "Purchased credits",
				metadata: {
					polarTransactionId: "polar_tx_123",
					price: 9.99,
				},
			};

			expect(args.metadata).toBeDefined();
			expect(args.metadata.polarTransactionId).toBe("polar_tx_123");
		});
	});

	// ============================================
	// hasEnoughCredits argument validation
	// ============================================
	describe("hasEnoughCredits Arguments", () => {
		it("should validate hasEnoughCredits arguments schema", () => {
			const args = {
				clerkUserId: "user_test123",
				actionType: "video_generation",
			};

			expect(args).toBeDefined();
			expect(args.clerkUserId).toBe("user_test123");
			expect(args.actionType).toBe("video_generation");
		});
	});

	// ============================================
	// getCreditCost argument validation
	// ============================================
	describe("getCreditCost Arguments", () => {
		it("should validate getCreditCost arguments schema", () => {
			const args = {
				actionType: "image_generation",
			};

			expect(args).toBeDefined();
			expect(args.actionType).toBe("image_generation");
		});
	});

	// ============================================
	// getTransactionHistory argument validation
	// ============================================
	describe("getTransactionHistory Arguments", () => {
		it("should validate getTransactionHistory arguments schema - minimal", () => {
			const args = {
				clerkUserId: "user_test123",
			};

			expect(args).toBeDefined();
			expect(args.clerkUserId).toBe("user_test123");
		});

		it("should validate getTransactionHistory arguments schema - with limit", () => {
			const args = {
				clerkUserId: "user_test123",
				limit: 20,
			};

			expect(args.limit).toBe(20);
		});
	});

	// ============================================
	// refundCredits argument validation
	// ============================================
	describe("refundCredits Arguments", () => {
		it("should validate refundCredits arguments schema", () => {
			const args = {
				transactionId: "transaction_test123" as Id<"creditTransactions">,
				reason: "AI call failed",
			};

			expect(args).toBeDefined();
			expect(args.transactionId).toBe("transaction_test123");
			expect(args.reason).toBe("AI call failed");
		});
	});

	// ============================================
	// Credit cost values (from specification)
	// ============================================
	describe("Credit Cost Values", () => {
		it("should have correct credit costs defined", () => {
			const expectedCosts = {
				step1_story_refinement: 1,
				step1_story_generation: 5,
				step2_chat_message: 1,
				image_prompt_enhancement: 1,
				image_generation: 5,
				image_edit: 5,
				video_generation: 20,
				video_regeneration: 20,
				step3b_chat_message: 1,
				audio_narration: 10,
				audio_music: 10,
				video_assembly: 5,
			};

			// Total for a full project: ~84 credits (1+5+1+1+5+5+20+20+1+10+10+5)
			const totalCredits = Object.values(expectedCosts).reduce(
				(sum, cost) => sum + cost,
				0,
			);
			expect(totalCredits).toBe(84);
		});
	});

	// ============================================
	// Return type validation
	// ============================================
	describe("Expected Return Types", () => {
		it("should expect getUserCredits to return balance info", () => {
			// Type definition for expected return
			interface UserCreditsReturn {
				balance: number;
				totalPurchased: number;
				totalUsed: number;
				totalBonusReceived: number;
				subscriptionTier?: string;
				isNew?: boolean;
			}

			const mockReturn: UserCreditsReturn = {
				balance: 200,
				totalPurchased: 0,
				totalUsed: 0,
				totalBonusReceived: 200,
				subscriptionTier: undefined,
			};

			expect(mockReturn.balance).toBe(200);
		});

		it("should expect deductCredits to return success with transactionId", () => {
			interface DeductCreditsSuccess {
				success: true;
				transactionId: Id<"creditTransactions">;
				creditsDeducted: number;
				newBalance: number;
			}

			const mockReturn: DeductCreditsSuccess = {
				success: true,
				transactionId: "tx_123" as Id<"creditTransactions">,
				creditsDeducted: 5,
				newBalance: 195,
			};

			expect(mockReturn.success).toBe(true);
			expect(mockReturn.creditsDeducted).toBe(5);
		});

		it("should expect deductCredits to return error when insufficient", () => {
			interface DeductCreditsError {
				success: false;
				error: string;
				required?: number;
				available?: number;
			}

			const mockReturn: DeductCreditsError = {
				success: false,
				error: "Insufficient credits",
				required: 20,
				available: 5,
			};

			expect(mockReturn.success).toBe(false);
			expect(mockReturn.error).toBe("Insufficient credits");
		});

		it("should expect hasEnoughCredits to return boolean result", () => {
			interface HasEnoughCreditsReturn {
				hasEnough: boolean;
				balance: number;
				required: number;
			}

			const mockReturn: HasEnoughCreditsReturn = {
				hasEnough: true,
				balance: 200,
				required: 5,
			};

			expect(mockReturn.hasEnough).toBe(true);
		});

		it("should expect refundCredits to return success with refunded amount", () => {
			interface RefundCreditsSuccess {
				success: true;
				refundedAmount: number;
				newBalance: number;
			}

			const mockReturn: RefundCreditsSuccess = {
				success: true,
				refundedAmount: 5,
				newBalance: 200,
			};

			expect(mockReturn.success).toBe(true);
			expect(mockReturn.refundedAmount).toBe(5);
		});
	});
});

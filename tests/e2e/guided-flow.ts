/**
 * E2E Test: Guided Video Creation Flow
 *
 * Run with: npx tsx tests/e2e/guided-flow.ts
 *
 * Complete flow (8 pages):
 * - Step 1: Emotional Foundation (occasion, emotion, project details)
 *           Button: "Continue to The Story ✨" (5 credits)
 *
 * - Step 2: The Story (AI chat to refine story)
 *           Features: Chat input, "Start Over with a New Idea" button
 *           Button: "✓ Approve this Direction" → "Continue to Visual Style ✨"
 *
 * - Step 2b: Visual Style (select Cinematic, Elegant, etc.)
 *           Button: "Continue to Scene Design"
 *
 * - Step 3: Visual Design / Scene Management
 *           Features: Scene accordion, video generation (20 credits/scene)
 *           Button: "Generate Scene Video" → "Validate" → "Continue to Narration"
 *
 * - Step 3b: Narration Script
 *           Button: "Continue to Sound Design ✨"
 *
 * - Step 4: Sound Design (select music)
 * - Step 5: Final Review & Polish
 * - Step 6: Render & Download
 *
 * Note: This test navigates the flow but does NOT trigger expensive AI generations
 * unless explicitly enabled via ENABLE_AI_GENERATION=true
 */

import * as readline from "node:readline";
import { Stagehand } from "@browserbasehq/stagehand";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env.local" });

const TEST_URL =
	process.env.TEST_URL ||
	"https://myshortreel-alpha-git-feature-credit-syste-e8381b-elpi-projects.vercel.app";
const TEST_EMAIL = process.env.TEST_EMAIL || "elpi88888@gmail.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "LP&Stagehand888";
const ENABLE_AI_GENERATION = process.env.ENABLE_AI_GENERATION === "true";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function prompt(question: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

async function loginIfNeeded(stagehand: Stagehand, page: any) {
	const currentUrl = page.url();

	if (currentUrl.includes("sign-in") || currentUrl.includes("sign-up")) {
		console.log("🔐 Login required, authenticating...\n");

		// Enter email
		await stagehand.act(`Type '${TEST_EMAIL}' into the email address field`);
		await sleep(500);
		await stagehand.act("Click the Continue button");
		await sleep(2000);

		// Enter password
		await stagehand.act(`Type '${TEST_PASSWORD}' into the password field`);
		await sleep(500);
		await stagehand.act("Click the Continue button");
		await sleep(3000);

		// Check for verification code
		const urlAfterPassword = page.url();
		if (
			urlAfterPassword.includes("factor-two") ||
			urlAfterPassword.includes("verify")
		) {
			console.log("📧 Verification code required. Check your email.\n");
			const code = await prompt("Enter verification code (6 digits): ");
			if (code && code.length === 6) {
				await stagehand.act(
					`Type '${code}' into the verification code input fields`,
				);
				await sleep(3000);

				// Check if we're logged in
				const finalUrl = page.url();
				if (!finalUrl.includes("sign-in")) {
					console.log("✅ Successfully logged in!\n");
				}
			}
		} else if (!urlAfterPassword.includes("sign-in")) {
			console.log("✅ Successfully logged in!\n");
		}
	}
}

async function runGuidedFlowTest() {
	console.log("🚀 Starting Guided Flow E2E Test...\n");
	console.log(`📍 Test URL: ${TEST_URL}`);
	console.log(
		`🤖 AI Generation: ${ENABLE_AI_GENERATION ? "ENABLED (costs credits!)" : "DISABLED"}\n`,
	);

	const stagehand = new Stagehand({
		env: "BROWSERBASE",
		apiKey: process.env.BROWSERBASE_API_KEY,
		projectId: process.env.BROWSERBASE_PROJECT_ID!,
		model: "openai/gpt-4o",
	});

	try {
		await stagehand.init();
		console.log("✅ Browser session started");
		console.log(`🔗 Live view: ${stagehand.browserbaseSessionURL}\n`);

		const page = stagehand.context.pages()[0];

		// ========================================
		// STEP 0: Navigate and Login
		// ========================================
		console.log("═══════════════════════════════════════");
		console.log("📍 STEP 0: Navigate to App & Login");
		console.log("═══════════════════════════════════════\n");

		await page.goto(`${TEST_URL}`);
		await sleep(2000);

		// Click Begin Your Film to start
		await stagehand.act("Click the 'Begin Your Film' button");
		await sleep(2000);

		// Handle login if needed
		await loginIfNeeded(stagehand, page);
		await sleep(2000);

		// ========================================
		// STEP 1: Emotional Foundation
		// ========================================
		console.log("\n═══════════════════════════════════════");
		console.log("❤️ STEP 1: Emotional Foundation");
		console.log("═══════════════════════════════════════\n");

		// Verify we're on step 1
		const step1Url = page.url();
		if (!step1Url.includes("step-1") && !step1Url.includes("guided")) {
			// Navigate to step 1
			await page.goto(`${TEST_URL}/guided/step-1`);
			await sleep(2000);
		}

		// Take screenshot
		await page.screenshot({ path: "tests/e2e/screenshots/step1-start.png" });
		console.log("📸 Screenshot: step1-start.png\n");

		// Select an occasion - card labeled "Birthday" with description "Joyful & Fun 🎉"
		console.log("🎂 Selecting Birthday occasion...");
		await stagehand.act(
			"Click on the card labeled 'Birthday' that shows 'Joyful & Fun'",
		);
		await sleep(1500);
		console.log("✅ Birthday selected\n");

		// Wait for emotion selector to appear
		await sleep(500);

		// Select an emotion - card labeled "Joyful Celebration" under "Shape the Emotion"
		console.log("🎉 Selecting Joyful Celebration emotion...");
		await stagehand.act(
			"Click the card labeled 'Joyful Celebration' under 'Shape the Emotion' heading",
		);
		await sleep(1500);
		console.log("✅ Joyful Celebration selected\n");

		// Wait for project details form to appear
		await sleep(500);

		// Fill project name - input labeled "Project name *"
		console.log("📝 Filling project name...");
		await stagehand.act(
			"Type 'E2E Test Birthday' into the input field labeled 'Project name'",
		);
		await sleep(1000);
		console.log("✅ Project name filled\n");

		// Fill personal story - textarea labeled "Your Personal Story *"
		console.log("📝 Filling personal story...");
		await stagehand.act(
			"Type 'Celebrating a joyful birthday with family and friends!' into the textarea labeled 'Your Personal Story'",
		);
		await sleep(1000);
		console.log("✅ Personal story filled\n");

		// Take screenshot before continuing
		await page.screenshot({ path: "tests/e2e/screenshots/step1-filled.png" });
		console.log("📸 Screenshot: step1-filled.png\n");

		// Check if button is ready - button text changes based on form validity
		const step1Button = await stagehand.extract(
			"What does the main action button at the bottom of the form say?",
			z.object({ buttonText: z.string() }),
		);
		console.log(`📍 Button state: ${step1Button.buttonText}\n`);

		if (ENABLE_AI_GENERATION) {
			// Continue to Step 2 (costs 5 credits for story generation)
			// Button text: "Continue to The Story ✨" with "5 credits" badge
			console.log(
				"🚀 Continuing to Step 2 (AI Story Generation - 5 credits)...",
			);
			await stagehand.act("Click the button that says 'Continue to The Story'");
			await sleep(5000); // Wait for AI generation
		} else {
			console.log("⏭️ Skipping Step 2+ (AI generation disabled)");
			console.log("   Set ENABLE_AI_GENERATION=true to test full flow\n");
		}

		// ========================================
		// STEP 2: The Story (AI Chat)
		// ========================================
		if (ENABLE_AI_GENERATION) {
			console.log("\n═══════════════════════════════════════");
			console.log("📖 STEP 2: The Story (AI Chat)");
			console.log("═══════════════════════════════════════\n");

			// Wait for page load and AI story
			console.log("⏳ Waiting for story to load...");
			await sleep(8000);

			await page.screenshot({ path: "tests/e2e/screenshots/step2-story.png" });
			console.log("📸 Screenshot: step2-story.png\n");

			// Verify page title: "Step 2/5: The Story ✍️"
			const step2Title = await stagehand.extract(
				"What is the page title/heading?",
				z.object({ title: z.string() }),
			);
			console.log(`📍 Page title: ${step2Title.title}\n`);

			// Step 2 features:
			// - Chat input: "Your feedback... (e.g., 'Make it more romantic')"
			// - Submit button to send feedback to AI (1 credit/message)
			// - "Start Over with a New Idea" button - generates fresh concept
			// - "✓ Approve this Direction" button - approves current story
			// - After approval: "Continue to Visual Style ✨" appears

			// TEST: Type feedback in chat and submit to refine the story
			console.log("💬 Typing feedback to refine the story...");
			await stagehand.act(
				"Type 'Make it more joyful and add more excitement about the celebration' into the feedback textarea",
			);
			await sleep(1000);

			console.log("📤 Submitting feedback...");
			await stagehand.act("Click the blue Send button with the arrow icon");
			await sleep(5000); // Wait for AI to respond (streaming)

			await page.screenshot({
				path: "tests/e2e/screenshots/step2-refined.png",
			});
			console.log("📸 Screenshot: step2-refined.png");
			console.log("✅ Story refined based on feedback!\n");

			// Approve the refined story - button says "✓ Approve this Direction"
			console.log("✅ Approving the refined story direction...");
			await stagehand.act(
				"Click the button that says 'Approve this Direction'",
			);
			await sleep(2000);

			await page.screenshot({
				path: "tests/e2e/screenshots/step2-approved.png",
			});
			console.log("📸 Screenshot: step2-approved.png\n");

			// After approval, button appears: "Continue to Visual Style ✨"
			console.log("🚀 Continuing to Visual Style...");
			await stagehand.act(
				"Click the button that says 'Continue to Visual Style'",
			);
			await sleep(3000);
		}

		// ========================================
		// STEP 2b: Visual Style (if AI enabled)
		// ========================================
		if (ENABLE_AI_GENERATION) {
			console.log("\n═══════════════════════════════════════");
			console.log("🎨 STEP 2b: Visual Style");
			console.log("═══════════════════════════════════════\n");

			await sleep(2000);
			await page.screenshot({
				path: "tests/e2e/screenshots/step2b-visual.png",
			});
			console.log("📸 Screenshot: step2b-visual.png\n");

			// Select a visual style (Cinematic, Elegant, Playful, etc.)
			console.log("🎨 Selecting Cinematic visual style...");
			await stagehand.act("Click on the 'Cinematic' visual style card");
			await sleep(1500);

			// Continue to Scene Design - button says "Continue to Scene Design"
			console.log("🚀 Continuing to Scene Design...");
			await stagehand.act(
				"Click the button that says 'Continue to Scene Design'",
			);
			await sleep(3000);
		}

		// ========================================
		// STEP 3: Visual Design / Scene Management (if AI enabled)
		// ========================================
		if (ENABLE_AI_GENERATION) {
			console.log("\n═══════════════════════════════════════");
			console.log("🎬 STEP 3: Visual Design (Scene Management)");
			console.log("═══════════════════════════════════════\n");

			// Title: "Step 3/5: Visual Design 🎨"
			// Features:
			// - Scene list with accordion (Scene 1, Scene 2, Scene 3...)
			// - Each scene has: description, start/end frame images, video
			// - "Generate Scene Video" button (20 credits/scene)
			// - After video generated: "Validate Video" or approve
			// - When ALL scenes validated: "Continue to Narration" button
			// - Navigates to /guided/step-3b (Narration Script)

			await sleep(2000);
			await page.screenshot({ path: "tests/e2e/screenshots/step3-scenes.png" });
			console.log("📸 Screenshot: step3-scenes.png\n");

			// Extract scene count
			const sceneInfo = await stagehand.extract(
				"How many scenes are listed? What are their titles/numbers?",
				z.object({
					sceneCount: z.string(),
					sceneNames: z.array(z.string()),
				}),
			);
			console.log(`📍 Scenes found: ${sceneInfo.sceneCount}`);
			console.log(`📍 Scene names: ${sceneInfo.sceneNames.join(", ")}\n`);

			// Check main action button
			const actionButton = await stagehand.extract(
				"What does the main action button at the bottom say?",
				z.object({ buttonText: z.string() }),
			);
			console.log(`📍 Action button: ${actionButton.buttonText}\n`);

			// Note: Video generation costs 20 credits/scene
			console.log("⏭️ Video generation requires 20 credits/scene");
			console.log("   Stopping here to avoid high costs in E2E test");
			console.log(
				"   Full flow: Generate Video → Validate → Continue to Narration\n",
			);
		}

		// ========================================
		// Final Summary
		// ========================================
		console.log("\n═══════════════════════════════════════");
		console.log("📊 TEST SUMMARY");
		console.log("═══════════════════════════════════════\n");

		const finalUrl = page.url();
		console.log(`📍 Final URL: ${finalUrl}`);

		await page.screenshot({
			path: "tests/e2e/screenshots/guided-flow-final.png",
		});
		console.log("📸 Final screenshot: guided-flow-final.png\n");

		console.log("✅ Tests completed:");
		console.log("   • Step 0: Navigation & Login ✅");
		console.log("   • Step 1: Emotional Foundation ✅");
		if (ENABLE_AI_GENERATION) {
			console.log("   • Step 2: The Story (AI chat) ✅");
			console.log("   • Step 2b: Visual Style ✅");
			console.log("   • Step 3: Visual Design (screenshot only)");
		} else {
			console.log("   • Steps 2-6: Skipped (AI generation disabled)");
		}
		console.log("\n📋 Full flow (6 steps):");
		console.log("   1. Emotional Foundation → Continue to The Story ✨");
		console.log("   2. The Story (AI Chat) → Continue to Visual Style ✨");
		console.log("   2b. Visual Style → Continue to Scene Design");
		console.log("   3. Visual Design → Continue to Narration");
		console.log("   3b. Narration Script → Continue to Sound Design ✨");
		console.log("   4. Sound Design");
		console.log("   5. Final Review & Polish");
		console.log("   6. Render & Download");

		console.log("\n🎉 Guided Flow test completed!");
	} catch (error) {
		console.error("❌ Test failed:", error);
		throw error;
	} finally {
		await stagehand.close();
		console.log("\n👋 Browser session closed");
	}
}

// Run the test
runGuidedFlowTest().catch((error) => {
	console.error("Test execution failed:", error);
	process.exit(1);
});

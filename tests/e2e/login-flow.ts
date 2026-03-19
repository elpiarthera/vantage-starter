/**
 * Simple E2E Test: Login Flow
 *
 * Run with: npx tsx tests/e2e/login-flow.ts
 *
 * Prerequisites:
 * - BROWSERBASE_API_KEY in .env.local
 * - BROWSERBASE_PROJECT_ID in .env.local
 * - OPENAI_API_KEY in .env.local
 */

import * as readline from "node:readline";
import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const TEST_URL =
	process.env.TEST_URL ||
	"https://myshortreel-alpha-git-feature-credit-syste-e8381b-elpi-projects.vercel.app";
const TEST_EMAIL = process.env.TEST_EMAIL || "elpi88888@gmail.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "LP&Stagehand888";

// Helper function for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to prompt for user input
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

async function runLoginTest() {
	console.log("🚀 Starting E2E Login Test...\n");

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

		// Get the page from context
		const page = stagehand.context.pages()[0];

		// Step 1: Navigate to sign-in page
		console.log("📍 Navigating to sign-in page...");
		await page.goto(`${TEST_URL}/sign-in`);
		await sleep(2000);
		console.log("✅ Sign-in page loaded\n");

		// Step 2: Enter email
		console.log("📧 Entering email...");
		await stagehand.act(`Type '${TEST_EMAIL}' into the email address field`);
		await sleep(500);
		console.log("✅ Email entered\n");

		// Step 3: Click continue
		console.log("🔘 Clicking Continue...");
		await stagehand.act("Click the Continue button");
		await sleep(2000);
		console.log("✅ Continued to password step\n");

		// Step 4: Enter password
		console.log("🔐 Entering password...");
		await stagehand.act(`Type '${TEST_PASSWORD}' into the password field`);
		await sleep(500);
		console.log("✅ Password entered\n");

		// Step 5: Click continue to sign in
		console.log("🔘 Clicking Continue to sign in...");
		await stagehand.act("Click the Continue button");
		await sleep(3000);

		// Check if we need verification code
		const currentUrl = page.url();
		if (currentUrl.includes("factor-two") || currentUrl.includes("verify")) {
			console.log("\n⚠️  Email verification required!");
			console.log("📧 Check your email for the verification code.\n");

			// Interactive mode: prompt for verification code
			const verificationCode = await prompt(
				"Enter verification code (6 digits): ",
			);

			if (verificationCode && verificationCode.length === 6) {
				console.log(`\n🔢 Entering verification code: ${verificationCode}`);
				await stagehand.act(
					`Type '${verificationCode}' into the verification code input fields`,
				);

				// Wait for potential auto-submit (Clerk often auto-submits after 6 digits)
				await sleep(3000);

				// Check if login succeeded (Clerk auto-submits after code entry)
				let finalUrl = page.url();
				if (!finalUrl.includes("sign-in")) {
					console.log("✅ Successfully signed in!\n");
				} else {
					// If still on sign-in, try clicking Continue
					console.log("🔘 Clicking Continue...");
					try {
						await stagehand.act("Click the Continue button");
						await sleep(3000);
						finalUrl = page.url();
						if (!finalUrl.includes("sign-in")) {
							console.log("✅ Successfully signed in!\n");
						} else {
							console.log("❌ Sign-in may have failed. Check the browser.\n");
						}
					} catch (_e) {
						// No button found - check if we're already logged in
						finalUrl = page.url();
						if (!finalUrl.includes("sign-in")) {
							console.log("✅ Successfully signed in!\n");
						} else {
							console.log("❌ Sign-in may have failed. Check the browser.\n");
						}
					}
				}
			} else {
				console.log("⏭️  Skipping verification code step.\n");
			}
		} else if (!currentUrl.includes("sign-in")) {
			console.log("✅ Successfully signed in (no 2FA required)!\n");
		}

		// Take screenshot
		console.log("📸 Taking screenshot...");
		await page.screenshot({ path: "tests/e2e/screenshots/login-result.png" });
		console.log(
			"✅ Screenshot saved to tests/e2e/screenshots/login-result.png\n",
		);

		console.log("🎉 Login test completed!");
		console.log(`📍 Final URL: ${page.url()}`);
	} catch (error) {
		console.error("❌ Test failed:", error);
		throw error;
	} finally {
		await stagehand.close();
		console.log("\n👋 Browser session closed");
	}
}

// Run the test
runLoginTest().catch((error) => {
	console.error("Test execution failed:", error);
	process.exit(1);
});

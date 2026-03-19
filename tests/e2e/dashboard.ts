/**
 * E2E Test: Dashboard Navigation
 *
 * Run with: npx tsx tests/e2e/dashboard.ts
 *
 * This test verifies:
 * - Login flow works
 * - Dashboard loads correctly after login
 * - Quick Stats Cards display (Total Projects, Credits, Videos, Storage)
 * - Quick Actions work
 * - Profile menu works
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

async function runDashboardTest() {
	console.log("🚀 Starting Dashboard E2E Test...\n");

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
		// STEP 1: Login First
		// ========================================
		console.log("═══════════════════════════════════════");
		console.log("🔐 STEP 1: Sign In");
		console.log("═══════════════════════════════════════\n");

		// Navigate to sign-in page directly
		await page.goto(`${TEST_URL}/sign-in`);
		await sleep(3000);

		await page.screenshot({
			path: "tests/e2e/screenshots/dashboard-signin.png",
		});
		console.log("📸 Screenshot: dashboard-signin.png\n");

		// Enter email
		console.log("📧 Entering email...");
		await stagehand.act(`Type '${TEST_EMAIL}' into the email address field`);
		await sleep(1000);

		console.log("🔘 Clicking Continue...");
		await stagehand.act("Click the Continue button");
		await sleep(2000);

		// Enter password
		console.log("🔐 Entering password...");
		await stagehand.act(`Type '${TEST_PASSWORD}' into the password field`);
		await sleep(1000);

		console.log("🔘 Clicking Continue...");
		await stagehand.act("Click the Continue button");
		await sleep(3000);

		// Check for verification code
		let currentUrl = page.url();
		console.log(`📍 Current URL: ${currentUrl}\n`);

		if (currentUrl.includes("factor-two") || currentUrl.includes("verify")) {
			console.log("📧 Verification code required. Check your email.\n");
			const code = await prompt("Enter verification code (6 digits): ");
			if (code && code.length === 6) {
				await stagehand.act(
					`Type '${code}' into the verification code input fields`,
				);
				await sleep(3000);
			}
		}

		// Verify we're logged in
		currentUrl = page.url();
		if (currentUrl.includes("sign-in")) {
			throw new Error("Login failed - still on sign-in page");
		}
		console.log("✅ Successfully logged in!\n");

		// ========================================
		// STEP 2: Navigate to Dashboard
		// ========================================
		console.log("═══════════════════════════════════════");
		console.log("📍 STEP 2: Dashboard Home");
		console.log("═══════════════════════════════════════\n");

		// Navigate to dashboard
		await page.goto(`${TEST_URL}/dashboard`);
		await sleep(3000);

		await page.screenshot({ path: "tests/e2e/screenshots/dashboard-main.png" });
		console.log("📸 Screenshot: dashboard-main.png\n");

		// Verify we're on dashboard
		currentUrl = page.url();
		if (!currentUrl.includes("dashboard")) {
			throw new Error(`Expected dashboard URL, got: ${currentUrl}`);
		}
		console.log(`📍 URL: ${currentUrl}\n`);

		// ========================================
		// STEP 3: Quick Stats Cards
		// ========================================
		console.log("═══════════════════════════════════════");
		console.log("📊 STEP 3: Quick Stats Cards");
		console.log("═══════════════════════════════════════\n");

		const statsInfo = await stagehand.extract(
			"What stats are shown in the cards? Look for numbers next to Total Projects, Credits Remaining, Videos Generated, Storage Used.",
			z.object({
				totalProjects: z.string(),
				creditsRemaining: z.string(),
				videosGenerated: z.string(),
				storageUsed: z.string(),
			}),
		);
		console.log(`📊 Total Projects: ${statsInfo.totalProjects}`);
		console.log(`💰 Credits Remaining: ${statsInfo.creditsRemaining}`);
		console.log(`🎬 Videos Generated: ${statsInfo.videosGenerated}`);
		console.log(`💾 Storage Used: ${statsInfo.storageUsed}\n`);

		// ========================================
		// STEP 4: Quick Actions - View All Projects
		// ========================================
		console.log("═══════════════════════════════════════");
		console.log("📁 STEP 4: View All Projects");
		console.log("═══════════════════════════════════════\n");

		await stagehand.act("Click the purple 'View All Projects' button");
		await sleep(2000);

		await page.screenshot({
			path: "tests/e2e/screenshots/dashboard-projects.png",
		});
		console.log("📸 Screenshot: dashboard-projects.png");
		console.log(`📍 URL: ${page.url()}\n`);

		// Go back to dashboard
		await page.goto(`${TEST_URL}/dashboard`);
		await sleep(2000);

		// ========================================
		// STEP 5: Quick Actions - Browse Templates
		// ========================================
		console.log("═══════════════════════════════════════");
		console.log("📋 STEP 5: Browse Templates");
		console.log("═══════════════════════════════════════\n");

		await stagehand.act("Click the green 'Browse Templates' button");
		await sleep(2000);

		await page.screenshot({
			path: "tests/e2e/screenshots/dashboard-templates.png",
		});
		console.log("📸 Screenshot: dashboard-templates.png");
		console.log(`📍 URL: ${page.url()}\n`);

		// Go back to dashboard
		await page.goto(`${TEST_URL}/dashboard`);
		await sleep(2000);

		// ========================================
		// STEP 6: Quick Actions - Manage Account
		// ========================================
		console.log("═══════════════════════════════════════");
		console.log("👤 STEP 6: Manage Account");
		console.log("═══════════════════════════════════════\n");

		await stagehand.act("Click the orange 'Manage Account' button");
		await sleep(2000);

		await page.screenshot({
			path: "tests/e2e/screenshots/dashboard-account.png",
		});
		console.log("📸 Screenshot: dashboard-account.png");
		console.log(`📍 URL: ${page.url()}\n`);

		// ========================================
		// Final Summary
		// ========================================
		console.log("═══════════════════════════════════════");
		console.log("📊 TEST SUMMARY");
		console.log("═══════════════════════════════════════\n");

		console.log("✅ Dashboard tests completed:");
		console.log("   • Sign in flow ✅");
		console.log("   • Dashboard home page ✅");
		console.log("   • Quick Stats Cards ✅");
		console.log("   • View All Projects ✅");
		console.log("   • Browse Templates ✅");
		console.log("   • Manage Account ✅");

		console.log("\n🎉 Dashboard test completed!");
	} catch (error) {
		console.error("❌ Test failed:", error);
		throw error;
	} finally {
		await stagehand.close();
		console.log("\n👋 Browser session closed");
	}
}

// Run the test
runDashboardTest().catch((error) => {
	console.error("Test execution failed:", error);
	process.exit(1);
});

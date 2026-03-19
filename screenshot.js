const { chromium } = require("playwright");

(async () => {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	console.log("Navigating to http://localhost:3000/en...");
	await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });

	// Wait a bit more for any client-side hydration
	await page.waitForTimeout(3000);

	console.log("Taking screenshot...");
	await page.screenshot({ path: "screenshot.png", fullPage: true });

	// Get page title and text content
	const title = await page.title();
	const bodyText = await page.evaluate(() => document.body.innerText);

	console.log("\n=== PAGE INFO ===");
	console.log("Title:", title);
	console.log("\n=== VISIBLE TEXT CONTENT ===");
	console.log(bodyText.slice(0, 2000)); // First 2000 chars

	await browser.close();
	console.log("\nScreenshot saved to screenshot.png");
})();

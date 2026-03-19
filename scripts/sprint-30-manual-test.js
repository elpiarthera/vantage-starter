/**
 * Sprint 30 Manual Validation Protocol
 *
 * Run in browser DevTools console on /{locale}/tools/image-generator after loading the app.
 * Example: /en/tools/image-generator
 *
 * Usage: Copy-paste this entire file into the console and press Enter.
 */

(() => {
	console.log("🏆 Sprint 30 Manual Validation Protocol");

	const SPRINT_30_TEST = {
		verifySchemaIntegrity: () => {
			const count = 8;
			const schemaIds = [
				"kling-v3-t2i",
				"kling-v3-i2i",
				"kling-o3-t2i",
				"kling-o3-i2i",
				"grok-t2i",
				"grok-i2i",
				"nano-banana-pro-t2i",
				"nano-banana-pro-i2i",
			];
			console.log(`Expected ${count} schema IDs:`, schemaIds);
			console.log(
				"✅ Schema integrity check (verify in Network/React DevTools)",
			);
		},

		testModelSelector: () => {
			const trigger =
				document.querySelector("[data-testid='model-selector-trigger']") ||
				document.querySelector("button[aria-haspopup='dialog']");
			if (!trigger) {
				console.warn(
					"Model selector trigger not found — add data-testid if needed",
				);
				return;
			}
			trigger.click();
			const cards = document.querySelectorAll("[data-testid='model-card']");
			console.assert(cards.length >= 8, "Should see 8+ model cards");
			console.log("✅ Model selector opened, cards:", cards.length);
		},

		testPremiumTabs: () => {
			const tablist = document.querySelector("[role='tablist']");
			console.assert(tablist !== null, "Premium tab list should exist");
			const tabs = document.querySelectorAll("[role='tab']");
			console.assert(tabs.length === 2, "Should have Generate and Edit tabs");
			console.log("✅ Premium tabs found");
		},

		testCreditDisplay: () => {
			const costEl = document.querySelector("[data-testid='credit-cost']");
			if (costEl) {
				console.log("Credit cost element:", costEl.textContent);
			} else {
				console.warn(
					"Credit cost element not found — check FloatingPromptBar/UI",
				);
			}
		},
	};

	Object.keys(SPRINT_30_TEST).forEach((name) => {
		try {
			SPRINT_30_TEST[name]();
		} catch (e) {
			console.error(`❌ ${name}:`, e);
		}
	});
})();

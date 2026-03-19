#!/usr/bin/env node
/**
 * Translation File Verification Script
 * Checks that all translation files have the same keys as the English source file.
 *
 * Usage: node scripts/verify-translations.js
 * Or:    pnpm i18n:verify
 */

const fs = require("node:fs");
const path = require("node:path");

const MESSAGES_DIR = path.join(__dirname, "../messages");
const LANGUAGES = ["en", "fr", "de", "it", "es", "pt", "ru"];

// Flatten nested object to get all keys with dot notation
function flattenKeys(obj, prefix = "") {
	let keys = [];
	for (const key in obj) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (
			typeof obj[key] === "object" &&
			obj[key] !== null &&
			!Array.isArray(obj[key])
		) {
			keys = keys.concat(flattenKeys(obj[key], fullKey));
		} else {
			keys.push(fullKey);
		}
	}
	return keys;
}

function verify() {
	console.log("🔍 Translation File Verification\n");
	console.log("=".repeat(50));

	const data = {};
	const allKeys = {};

	// Load all translation files
	for (const lang of LANGUAGES) {
		const filePath = path.join(MESSAGES_DIR, `${lang}.json`);

		if (!fs.existsSync(filePath)) {
			console.error(`❌ Missing file: messages/${lang}.json`);
			process.exit(1);
		}

		try {
			data[lang] = JSON.parse(fs.readFileSync(filePath, "utf8"));
			allKeys[lang] = new Set(flattenKeys(data[lang]));
		} catch (error) {
			console.error(`❌ Invalid JSON in messages/${lang}.json:`, error.message);
			process.exit(1);
		}
	}

	// Display key counts
	console.log("\n📊 Key counts per file:\n");
	for (const lang of LANGUAGES) {
		const flag = {
			en: "🇺🇸",
			fr: "🇫🇷",
			de: "🇩🇪",
			it: "🇮🇹",
			es: "🇪🇸",
			pt: "🇧🇷",
			ru: "🇷🇺",
		}[lang];
		console.log(`   ${flag} ${lang}.json: ${allKeys[lang].size} keys`);
	}

	// Compare all languages against English (source)
	const enKeys = allKeys.en;
	let hasIssues = false;

	console.log("\n🔍 Checking for discrepancies (compared to en.json):\n");

	for (const lang of LANGUAGES.filter((l) => l !== "en")) {
		const missing = [...enKeys].filter((k) => !allKeys[lang].has(k));
		const extra = [...allKeys[lang]].filter((k) => !enKeys.has(k));

		if (missing.length > 0) {
			hasIssues = true;
			console.log(`❌ ${lang}.json is MISSING ${missing.length} keys:`);
			missing.slice(0, 10).forEach((k) => console.log(`     - ${k}`));
			if (missing.length > 10) {
				console.log(`     ... and ${missing.length - 10} more`);
			}
			console.log("");
		}

		if (extra.length > 0) {
			hasIssues = true;
			console.log(
				`⚠️  ${lang}.json has ${extra.length} EXTRA keys not in en.json:`,
			);
			extra.slice(0, 5).forEach((k) => console.log(`     + ${k}`));
			if (extra.length > 5) {
				console.log(`     ... and ${extra.length - 5} more`);
			}
			console.log("");
		}

		if (missing.length === 0 && extra.length === 0) {
			console.log(`   ✅ ${lang}.json - Perfect match`);
		}
	}

	console.log(`\n${"=".repeat(50)}`);

	if (hasIssues) {
		console.log("\n❌ Some translation files have discrepancies!");
		console.log('   Run "pnpm translate" to fix missing keys.\n');
		process.exit(1);
	} else {
		console.log("\n✅ All translation files are perfectly synchronized!\n");
		process.exit(0);
	}
}

verify();

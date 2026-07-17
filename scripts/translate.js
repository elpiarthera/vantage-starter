require("dotenv").config({ path: ".env.local" });
const fs = require("node:fs");
const path = require("node:path");
const { createOpenAI } = require("@ai-sdk/openai");
const { generateText } = require("ai");

const openaiProvider = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TARGET_LANGS = ["fr", "de", "it", "es", "pt", "ru"];
const LANG_NAMES = {
	fr: "French (France)",
	de: "German (Germany)",
	it: "Italian (Italy)",
	es: "Spanish (Spain)",
	pt: "Portuguese (Brazil)",
	ru: "Russian (Russia)",
};
const MESSAGES_DIR = path.join(__dirname, "../messages");

// Find keys in base that are missing in target
function getMissingKeys(base, target, prefix = "") {
	const missing = {};
	let hasMissing = false;

	for (const key in base) {
		const fullKey = prefix ? `${prefix}.${key}` : key;

		if (
			typeof base[key] === "object" &&
			base[key] !== null &&
			!Array.isArray(base[key])
		) {
			const nestedMissing = getMissingKeys(
				base[key],
				target?.[key] || {},
				fullKey,
			);
			if (Object.keys(nestedMissing).length > 0) {
				missing[key] = nestedMissing;
				hasMissing = true;
			}
		} else if (target?.[key] === undefined) {
			missing[key] = base[key];
			hasMissing = true;
			console.log(`  Missing: ${fullKey}`);
		}
	}

	return hasMissing ? missing : {};
}

// Remove keys from target that don't exist in base (clean up obsolete keys)
function syncStructure(base, target, prefix = "") {
	const synced = {};
	let removedCount = 0;

	for (const key in base) {
		const fullKey = prefix ? `${prefix}.${key}` : key;

		if (
			typeof base[key] === "object" &&
			base[key] !== null &&
			!Array.isArray(base[key])
		) {
			// Nested object - recurse
			const result = syncStructure(base[key], target?.[key] || {}, fullKey);
			synced[key] = result.synced;
			removedCount += result.removedCount;
		} else if (target?.[key] !== undefined) {
			// Key exists in both - keep target value
			synced[key] = target[key];
		} else {
			// Key missing in target - will be translated later
			// Don't add to synced yet
		}
	}

	// Count removed keys (keys in target but not in base)
	for (const key in target) {
		if (base[key] === undefined) {
			const fullKey = prefix ? `${prefix}.${key}` : key;
			console.log(`  Removing obsolete: ${fullKey}`);
			removedCount++;
		}
	}

	return { synced, removedCount };
}

// Deep merge (only for adding new translations)
function deepMerge(base, additions) {
	const result = { ...base };
	for (const key in additions) {
		if (
			typeof additions[key] === "object" &&
			additions[key] !== null &&
			!Array.isArray(additions[key])
		) {
			result[key] = deepMerge(result[key] || {}, additions[key]);
		} else {
			result[key] = additions[key];
		}
	}
	return result;
}

// Flatten nested object for counting
function countKeys(obj) {
	let count = 0;
	for (const key in obj) {
		if (
			typeof obj[key] === "object" &&
			obj[key] !== null &&
			!Array.isArray(obj[key])
		) {
			count += countKeys(obj[key]);
		} else {
			count++;
		}
	}
	return count;
}

async function translate() {
	const enPath = path.join(MESSAGES_DIR, "en.json");

	if (!fs.existsSync(enPath)) {
		console.error("messages/en.json not found!");
		process.exit(1);
	}

	if (!process.env.OPENAI_API_KEY) {
		console.error("OPENAI_API_KEY is not set in .env.local");
		process.exit(1);
	}

	const enData = JSON.parse(fs.readFileSync(enPath, "utf8"));
	const totalKeys = countKeys(enData);
	console.log(`Total keys in en.json: ${totalKeys}\n`);

	for (const lang of TARGET_LANGS) {
		const targetPath = path.join(MESSAGES_DIR, `${lang}.json`);
		let existingData = {};

		if (fs.existsSync(targetPath)) {
			try {
				const content = fs.readFileSync(targetPath, "utf8").trim();
				existingData = content && content !== "{}" ? JSON.parse(content) : {};
			} catch (_e) {
				existingData = {};
			}
		}

		console.log(`\nChecking ${lang}...`);

		// Step 1: Sync structure - remove obsolete keys
		const { synced: cleanedData, removedCount } = syncStructure(
			enData,
			existingData,
		);
		if (removedCount > 0) {
			console.log(`  Removed ${removedCount} obsolete keys`);
		}

		// Step 2: Find missing keys
		const missingKeys = getMissingKeys(enData, cleanedData);
		const missingCount = countKeys(missingKeys);

		if (missingCount === 0 && removedCount === 0) {
			console.log(`${lang}.json is up to date.`);
			continue;
		}

		if (missingCount === 0) {
			// No translations needed, just save cleaned data
			fs.writeFileSync(targetPath, JSON.stringify(cleanedData, null, 2));
			console.log(`Saved ${lang}.json (${countKeys(cleanedData)} total keys)`);
			continue;
		}

		console.log(`Translating ${missingCount} keys for ${lang}...`);

		try {
			const systemPrompt = `You are a professional translator. Translate the following JSON to ${LANG_NAMES[lang]}.

CRITICAL: You MUST translate to ${LANG_NAMES[lang]} - NOT French, NOT any other language!

RULES:
1. Keep all JSON keys EXACTLY as they are (do not translate keys)
2. Translate all VALUES to ${LANG_NAMES[lang]}
3. Preserve ICU message format variables like {name}, {count, plural, ...}
4. Preserve HTML tags if any (<strong>, <br/>, etc.)
5. Preserve emojis exactly as they are
6. Maintain a friendly, professional UI tone
7. Output ONLY valid JSON, no explanations, no markdown code fences

Target language: ${LANG_NAMES[lang]} (code: ${lang})`;

			const { text } = await generateText({
				model: openaiProvider("gpt-4o"),
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: JSON.stringify(missingKeys, null, 2) },
				],
				temperature: 0.3,
			});

			// Strip markdown code fences if the model wrapped the output
			const cleaned = text
				.trim()
				.replace(/^```json\s*/i, "")
				.replace(/```\s*$/, "");
			const translatedData = JSON.parse(cleaned);

			// Deep merge cleaned data with new translations
			const finalData = deepMerge(cleanedData, translatedData);

			fs.writeFileSync(targetPath, JSON.stringify(finalData, null, 2));
			console.log(`Saved ${lang}.json (${countKeys(finalData)} total keys)`);
		} catch (error) {
			console.error(`Failed to translate ${lang}:`, error.message);
		}
	}

	console.log("\nTranslation complete!");
}

translate();

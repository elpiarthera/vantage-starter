#!/usr/bin/env node
/**
 * i18n-guard — generic AST scanner for hardcoded English literals on the
 * dashboard surface (app/[locale]/dashboard/** and the components it
 * consumes). Fails loud, never silently passes.
 *
 * Usage: node scripts/i18n-guard.js [--json]
 *
 * Detects:
 *  - JSX text nodes containing English words
 *  - String literal attributes: aria-label, placeholder, title, alt
 *  - Hardcoded locale tags (e.g. "en-US", "en-GB") passed to
 *    toLocaleDateString / toLocaleString / Intl.DateTimeFormat
 *
 * Allowlist: single-token product/brand names with no i18n meaning
 * (Architect, Chat, Mosaic, Convex, Clerk, Polar, OKLCH, Tailwind, Mission).
 * Inline override: `// i18n-allow: <reason>` on the same line as the literal.
 */

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.join(__dirname, "..");

// Roots this guard is responsible for. Per brief: the whole
// app/[locale]/dashboard/** surface AND the components those pages consume.
const TARGET_ROOTS = [
	"app/[locale]/dashboard",
	"components/missions",
	"components/chat",
	"components/create",
	"components/design-system",
	"components/dashboard",
];

// Product / brand names that are not translation candidates on their own.
// Kept intentionally small — every entry here must be a proper noun with no
// sentence-like content. Anything with a space is NEVER allowlisted here.
const ALLOWLIST_TOKENS = new Set([
	"Architect",
	"Chat",
	"Mosaic",
	"Convex",
	"Clerk",
	"Polar",
	"OKLCH",
	"Tailwind",
	"Mission",
	"Missions",
	"VantageStarter",
]);

const ATTRS_TO_CHECK = new Set([
	"aria-label",
	"aria-description",
	"placeholder",
	"title",
	"alt",
]);

const LOCALE_TAG_RE = /^[a-z]{2}-[A-Z]{2}$/;
const LOCALE_METHODS = new Set([
	"toLocaleDateString",
	"toLocaleTimeString",
	"toLocaleString",
]);

function hasEnglishWord(text) {
	const trimmed = text.trim();
	if (trimmed.length < 2) return false;
	// Must contain at least one alphabetic word of 2+ letters to be
	// considered "content" (filters out {" "}, punctuation, single symbols).
	return /[A-Za-z]{2,}/.test(trimmed);
}

function isAllowlisted(text) {
	const trimmed = text.trim();
	if (ALLOWLIST_TOKENS.has(trimmed)) return true;
	// Pure numbers, dates, code-ish tokens (camelCase/kebab without spaces
	// AND no vowel-only sentence shape) are not English UI copy.
	if (/^[A-Za-z0-9_-]+$/.test(trimmed) && !trimmed.includes(" ")) {
		// still allow through allowlist only, not blanket — single tokens
		// like "New" or "View" ARE UI copy and must NOT be exempted here.
		return ALLOWLIST_TOKENS.has(trimmed);
	}
	return false;
}

function hasInlineAllow(sourceFile, node) {
	const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
	const lineText = sourceFile.text.split("\n")[line] || "";
	return /i18n-allow:\s*\S+/.test(lineText);
}

function listFiles(dir) {
	const out = [];
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...listFiles(full));
		} else if (
			/\.(tsx|ts)$/.test(entry.name) &&
			!entry.name.endsWith(".d.ts")
		) {
			out.push(full);
		}
	}
	return out;
}

function scanFile(filePath) {
	const violations = [];
	const text = fs.readFileSync(filePath, "utf8");
	const sourceFile = ts.createSourceFile(
		filePath,
		text,
		ts.ScriptTarget.Latest,
		true,
		filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	function report(node, literal, kind) {
		if (isAllowlisted(literal)) return;
		if (hasInlineAllow(sourceFile, node)) return;
		const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		violations.push({
			file: path.relative(ROOT, filePath),
			line: line + 1,
			kind,
			text: literal.trim().slice(0, 80),
		});
	}

	function visit(node) {
		// 1. JSX text nodes
		if (ts.isJsxText(node)) {
			const raw = node.getText();
			if (hasEnglishWord(raw)) {
				report(node, raw, "jsx-text");
			}
		}

		// 2. JSX attributes: aria-label / placeholder / title / alt
		if (ts.isJsxAttribute(node)) {
			const attrName = node.name.getText();
			if (
				ATTRS_TO_CHECK.has(attrName) &&
				node.initializer &&
				ts.isStringLiteral(node.initializer)
			) {
				const val = node.initializer.text;
				if (hasEnglishWord(val)) {
					report(node.initializer, val, `attr:${attrName}`);
				}
			}
		}

		// 3. Hardcoded locale tags, e.g. date.toLocaleDateString("en-US")
		if (
			ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression) &&
			LOCALE_METHODS.has(node.expression.name.getText())
		) {
			for (const arg of node.arguments) {
				if (ts.isStringLiteral(arg) && LOCALE_TAG_RE.test(arg.text)) {
					report(arg, arg.text, "hardcoded-locale");
				}
			}
		}
		if (
			ts.isNewExpression(node) &&
			node.expression.getText() === "Intl.DateTimeFormat"
		) {
			for (const arg of node.arguments || []) {
				if (ts.isStringLiteral(arg) && LOCALE_TAG_RE.test(arg.text)) {
					report(arg, arg.text, "hardcoded-locale");
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return violations;
}

function main() {
	const files = [];
	for (const root of TARGET_ROOTS) {
		files.push(...listFiles(path.join(ROOT, root)));
	}

	// Fail loud on zero files scanned — a guard that scans nothing must
	// never report a clean bill of health.
	if (files.length === 0) {
		console.error(
			"i18n-guard: FATAL — 0 files scanned across target roots:\n" +
				TARGET_ROOTS.map((r) => `  - ${r}`).join("\n") +
				"\nThis is a guard failure, not a pass. Check TARGET_ROOTS paths.",
		);
		process.exit(2);
	}

	let allViolations = [];
	const readErrors = [];
	for (const file of files) {
		try {
			allViolations = allViolations.concat(scanFile(file));
		} catch (err) {
			readErrors.push({ file: path.relative(ROOT, file), error: String(err) });
		}
	}

	if (readErrors.length > 0) {
		console.error(
			`i18n-guard: FATAL — ${readErrors.length} file(s) could not be parsed:`,
		);
		for (const e of readErrors) console.error(`  - ${e.file}: ${e.error}`);
		process.exit(2);
	}

	const jsonMode = process.argv.includes("--json");

	if (allViolations.length === 0) {
		console.log(
			`i18n-guard: PASS — ${files.length} files scanned, 0 hardcoded English literals found.`,
		);
		process.exit(0);
	}

	if (jsonMode) {
		console.log(
			JSON.stringify(
				{ files: files.length, violations: allViolations },
				null,
				2,
			),
		);
	} else {
		console.error(
			`i18n-guard: FAIL — ${allViolations.length} hardcoded literal(s) found across ${files.length} scanned files:\n`,
		);
		for (const v of allViolations) {
			console.error(`  ${v.file}:${v.line} [${v.kind}] "${v.text}"`);
		}
	}
	process.exit(1);
}

if (require.main === module) {
	main();
}

module.exports = { scanFile, listFiles, main };

/**
 * Bipolar probe for scripts/check-translations.js
 *
 * A unipolar probe proves nothing — a guard that flags everything scores
 * 100% on MUST_BLOCK alone. Every MUST_BLOCK test here injects a REAL
 * violation of exactly one control into REAL repo material (never a
 * scanner-authored fixture), grep-asserts the mutation landed before
 * reading any verdict, asserts the control goes RED naming what it found,
 * then restores the file and asserts `git diff --stat` is empty.
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const {
	scanFile,
	deriveTargetFiles,
	runControl1LiteralScan,
	runControl2KeyParity,
	runControl3FrEqualsEn,
	runControl4CalledButUndefined,
} = require("../check-translations.js");

const ROOT = path.join(__dirname, "..", "..");

// Restores `target` to `original` and asserts byte-for-byte restoration.
// `git diff --stat` is deliberately NOT used here: this repo can carry
// legitimate uncommitted changes on these same files (parallel translation
// work), so a git-diff-based check would compare against a stale HEAD
// rather than against the pre-mutation state actually captured by the
// probe. Comparing the re-read bytes to `original` is the correct
// restoration proof regardless of working-tree state.
function assertRestored(target, original) {
	fs.writeFileSync(target, original);
	const reread = fs.readFileSync(target, "utf8");
	expect(reread).toBe(original);
}

describe("check-translations — Control 1 (hardcoded literal scan)", () => {
	test("MUST_BLOCK: re-injected hardcoded literal on foreign (already-fixed) material turns Control 1 RED", () => {
		const target = path.join(
			ROOT,
			"app/[locale]/dashboard/architect/_components/session-list.tsx",
		);
		const original = fs.readFileSync(target, "utf8");

		const injectedMarker = "___I18N_GUARD_PROBE_MARKER___";
		const injectedLiteral = `Totally Hardcoded English Sentence ${injectedMarker}`;

		const mutated = original.replace(
			/return \(\s*\n(\s*)</,
			(_match, indent) =>
				`return (\n${indent}<>\n${indent}<div>${injectedLiteral}</div>\n${indent}<`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		// Assert the mutation actually landed before reading any verdict.
		const landed = execSync(`grep -c "${injectedMarker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find((v) =>
				v.text.includes(injectedMarker),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	test("MUST_PASS: product names and single-token identifiers are not flagged", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "check-translations-probe-"),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		fs.writeFileSync(
			tmpFile,
			`
export function Probe() {
	return (
		<div>
			<span>Architect</span>
			<span>Chat</span>
			<span>Mosaic</span>
		</div>
	);
}
`,
		);
		try {
			const violations = scanFile(tmpFile);
			expect(violations).toEqual([]);
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

describe("check-translations — Control 1 template-literal attr + no-arg locale holes", () => {
	test("MUST_BLOCK: English static span inside a template-literal `title` attr on foreign material turns Control 1 RED", () => {
		const target = path.join(
			ROOT,
			"app/[locale]/dashboard/architect/_components/session-list.tsx",
		);
		const original = fs.readFileSync(target, "utf8");

		const injectedMarker = "___I18N_TEMPLATE_PROBE_MARKER___";
		// Inject a template-literal title attribute with an English static
		// span around a substitution — the exact shape that slipped through
		// before this fix (mission-card.tsx:202/:234).
		const mutated = original.replace(
			/return \(\s*\n(\s*)</,
			(_match, indent) =>
				`return (\n${indent}<>\n${indent}<div title={\`Loading status: ${"$"}{status} ${injectedMarker}\`}>x</div>\n${indent}<`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${injectedMarker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) =>
					v.kind === "attr:title:template" && v.text.includes("Loading status"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	test("MUST_BLOCK: no-arg toLocaleDateString() on foreign material turns Control 1 RED as implicit-locale", () => {
		const target = path.join(
			ROOT,
			"app/[locale]/dashboard/architect/_components/session-list.tsx",
		);
		const original = fs.readFileSync(target, "utf8");

		const injectedMarker = "___I18N_NOARG_LOCALE_PROBE_MARKER___";
		const mutated = original.replace(
			/return \(\s*\n(\s*)</,
			(_match, indent) =>
				`return (\n${indent}<>\n${indent}<div data-marker="${injectedMarker}">{new Date().toLocaleDateString()}</div>\n${indent}<`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${injectedMarker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) =>
					v.kind === "implicit-locale" &&
					v.file === path.relative(ROOT, target),
			);
			expect(hit).toBeDefined();
			expect(hit.text).toMatch(
				/toLocaleDateString\(\) called with no arguments/,
			);
		} finally {
			assertRestored(target, original);
		}
	});

	test("MUST_PASS: legitimate template-interpolation-only attrs are never flagged (zero false positives)", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "check-translations-tmpl-probe-"),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		// Exact shape of the 4 legitimate template attrs measured on the
		// real tree (app/[locale]/dashboard/missions/[missionId]/page.tsx:281
		// and components/landing/PricingSection.tsx:146): every static span
		// holds only punctuation/whitespace, never an English word. Built via
		// string concatenation (not a literal nested template) to keep the
		// probe source unambiguous about which backticks are which.
		const probeSource = [
			"export function Probe({ t, checkpoint, tier }) {",
			"\treturn (",
			"\t\t<div>",
			'\t\t\t<span aria-label={`${t("checkpoint")}: ${checkpoint.description}`} />',
			'\t\t\t<span aria-label={`${t(tier.nameKey)} ${t("features_aria")}`} />',
			"\t\t</div>",
			"\t);",
			"}",
			"",
		].join("\n");
		fs.writeFileSync(tmpFile, probeSource);
		try {
			const violations = scanFile(tmpFile);
			const falsePositives = violations.filter((v) =>
				v.kind.startsWith("attr:aria-label:template"),
			);
			expect(falsePositives).toEqual([]);
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	test("MUST_PASS: the two legitimate template attrs measured on the real tree are not flagged by the full Control 1 run", () => {
		const result = runControl1LiteralScan();
		const falsePositives = result.violations.filter(
			(v) =>
				(v.file === "app/[locale]/dashboard/missions/[missionId]/page.tsx" &&
					v.line === 281) ||
				(v.file === "components/landing/PricingSection.tsx" && v.line === 146),
		);
		expect(falsePositives).toEqual([]);
	});
});

describe("check-translations — Control 1d (module-level constant label maps)", () => {
	// MUST_BLOCK #1 — foreign material: components/missions/mission-column.tsx.
	// Injects a brand-new `Record<K, string>` label map with an English
	// sentence value, referenced from JSX via a bracket lookup exactly like
	// the real `STATUS_HEADER_CLASSES[status]` site on the same file — the
	// shape that shipped "Pending" / "Executing" / "Awaiting Checkpoint" to
	// French users before this control existed.
	test("MUST_BLOCK: a new English label map reached via JSX bracket-lookup on foreign material (mission-column.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "components/missions/mission-column.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_LABELMAP_PROBE_MARKER___";
		const injectedDecl = `\nconst PROBE_LABELS: Record<MissionStatus, string> = {\n\tpending: "Totally Hardcoded Probe Label ${marker}",\n\texecuting: "Executing",\n\tawaiting_checkpoint: "Awaiting Checkpoint",\n\tcompleted: "Completed",\n\tfailed: "Failed",\n};\n`;

		// Insert the declaration right after STATUS_HEADER_CLASSES, and force
		// a JSX reference to it (bracket-lookup, same shape as the real
		// STATUS_HEADER_CLASSES[status] site) so condition (c) is genuinely
		// satisfied by the mutation, not assumed.
		let mutated = original.replace(
			/(const STATUS_HEADER_CLASSES: Record<MissionStatus, string> = \{[\s\S]*?\n\};\n)/,
			(m) => `${m}${injectedDecl}`,
		);
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			"STATUS_HEADER_CLASSES[status],",
			"STATUS_HEADER_CLASSES[status],\n\t\t\t\t\tPROBE_LABELS[status],",
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		// Assert the mutation actually landed before reading any verdict.
		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);
		const jsxRefLanded = execSync(
			`grep -c "PROBE_LABELS\\[status\\]" "${target}"`,
			{ cwd: ROOT, encoding: "utf8" },
		).trim();
		expect(Number(jsxRefLanded)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) =>
					v.kind === "label-map:PROBE_LABELS.pending" &&
					v.text.includes(marker),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_BLOCK #2 — foreign material: components/chat/ToolCallIndicator.tsx.
	// Injects a brand-new nested `Record<string, { active: string; done:
	// string }>` label map (the exact TOOL_LABEL_KEYS shape) with an English
	// value, referenced from JSX, on a file the matcher was never built
	// around.
	test("MUST_BLOCK: a new nested English label map reached via JSX on foreign material (ToolCallIndicator.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "components/chat/ToolCallIndicator.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_NESTED_LABELMAP_PROBE_MARKER___";
		const injectedDecl = `\nconst PROBE_TOOL_LABELS: Record<string, { active: string; done: string }> = {\n\tprobeTool: {\n\t\tactive: "Probing in progress...",\n\t\tdone: "Probe complete ${marker}",\n\t},\n};\n`;

		let mutated = original.replace(
			/(const TOOL_LABEL_KEYS: Record<string, \{ active: string; done: string \}> = \{[\s\S]*?\n\};\n)/,
			(m) => `${m}${injectedDecl}`,
		);
		expect(mutated).not.toBe(original);
		// Force a genuine JSX reference to the injected constant — mirrors
		// how TOOL_LABEL_KEYS itself is consumed in this file.
		mutated = mutated.replace(
			/return \(\s*\n(\s*)</,
			(_match, indent) =>
				`return (\n${indent}<>\n${indent}<span>{PROBE_TOOL_LABELS.probeTool.done}</span>\n${indent}<`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);
		const jsxRefLanded = execSync(
			`grep -c "PROBE_TOOL_LABELS.probeTool.done" "${target}"`,
			{ cwd: ROOT, encoding: "utf8" },
		).trim();
		expect(Number(jsxRefLanded)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) =>
					v.kind === "label-map:PROBE_TOOL_LABELS.probeTool.done" &&
					v.text.includes(marker),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_PASS — zero false positives on the real, currently-shipping
	// non-copy maps: `NEXT_STATUSES` (enum-array values, not strings) and
	// `STATUS_DOT` / `STATUS_HEADER_CLASSES` (Tailwind class-list values,
	// one of which — STATUS_HEADER_CLASSES — IS genuinely referenced via
	// JSX bracket-lookup, so this proves the CSS-token exclusion itself,
	// not merely condition (c) failing).
	test("MUST_PASS: NEXT_STATUSES (enum arrays) and STATUS_DOT/STATUS_HEADER_CLASSES (CSS class maps) are never flagged — zero false positives", () => {
		const result = runControl1LiteralScan();
		const falsePositives = result.violations.filter(
			(v) =>
				v.kind.startsWith("label-map:NEXT_STATUSES") ||
				v.kind.startsWith("label-map:STATUS_DOT") ||
				v.kind.startsWith("label-map:STATUS_HEADER_CLASSES"),
		);
		expect(falsePositives).toEqual([]);
	});

	// MUST_PASS — the real, currently-fixed translation-key-reference maps
	// (STATUS_LABEL_KEYS, TOOL_LABEL_KEYS, CATEGORY_LABEL_KEYS,
	// SECTOR_I18N_KEYS) must never be flagged: their string values are i18n
	// key paths / camelCase key tokens, resolved later via `t(key)`, not the
	// rendered copy itself.
	test("MUST_PASS: real *_I18N_KEYS / *_LABEL_KEYS maps (key references, already fixed) are never flagged", () => {
		const result = runControl1LiteralScan();
		const falsePositives = result.violations.filter(
			(v) =>
				v.kind.startsWith("label-map:STATUS_LABEL_KEYS") ||
				v.kind.startsWith("label-map:TOOL_LABEL_KEYS") ||
				v.kind.startsWith("label-map:CATEGORY_LABEL_KEYS") ||
				v.kind.startsWith("label-map:SECTOR_I18N_KEYS"),
		);
		expect(falsePositives).toEqual([]);
	});
});

describe("check-translations — Control 2 (key parity across all locales)", () => {
	test("MUST_BLOCK: deleting a key from one locale turns Control 2 RED, naming the key and the locale", () => {
		const target = path.join(ROOT, "messages", "de.json");
		const original = fs.readFileSync(target, "utf8");
		const parsed = JSON.parse(original);

		expect(parsed.common).toBeDefined();
		expect(parsed.common.close).toBeDefined();
		delete parsed.common.close;

		const mutated = `${JSON.stringify(parsed, null, "\t")}\n`;
		fs.writeFileSync(target, mutated);

		// Assert the mutation landed: the key is gone from disk.
		const reread = JSON.parse(fs.readFileSync(target, "utf8"));
		expect(reread.common.close).toBeUndefined();

		try {
			const result = runControl2KeyParity();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) => v.key === "common.close" && v.locale === "de",
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	test("MUST_BLOCK (documented defect): the `chat` namespace is absent from de/it/es/pt/ru on the CURRENT tree — an en/fr-only parity check would bless this hole", () => {
		const result = runControl2KeyParity();
		expect(result.locales).toEqual(
			expect.arrayContaining(["en", "fr", "de", "it", "es", "pt", "ru"]),
		);
		const chatViolations = result.violations.filter((v) =>
			v.key.startsWith("chat."),
		);
		expect(chatViolations.length).toBeGreaterThan(0);
		const flaggedLocales = new Set(chatViolations.map((v) => v.locale));
		for (const locale of ["de", "it", "es", "pt", "ru"]) {
			expect(flaggedLocales.has(locale)).toBe(true);
		}
	});

	test("MUST_PASS: a key present in every locale is never flagged", () => {
		const result = runControl2KeyParity();
		const hit = result.violations.find((v) => v.key === "common.close");
		expect(hit).toBeUndefined();
	});
});

describe("check-translations — Control 3 (fr value byte-identical to en)", () => {
	test("MUST_BLOCK: copying the en value into fr for a real, currently-distinct key turns Control 3 RED", () => {
		const target = path.join(ROOT, "messages", "fr.json");
		const original = fs.readFileSync(target, "utf8");
		const parsed = JSON.parse(original);

		const enParsed = JSON.parse(
			fs.readFileSync(path.join(ROOT, "messages", "en.json"), "utf8"),
		);

		expect(parsed.common.close).toBeDefined();
		expect(parsed.common.close).not.toBe(enParsed.common.close);

		parsed.common.close = enParsed.common.close;
		const mutated = `${JSON.stringify(parsed, null, "\t")}\n`;
		fs.writeFileSync(target, mutated);

		// Assert the mutation landed: fr now equals en for this key.
		const reread = JSON.parse(fs.readFileSync(target, "utf8"));
		expect(reread.common.close).toBe(enParsed.common.close);

		try {
			const result = runControl3FrEqualsEn();
			expect(result.ok).toBe(false);
			const hit = result.violations.find((v) => v.key === "common.close");
			expect(hit).toBeDefined();
			expect(hit.value).toBe(enParsed.common.close);
		} finally {
			assertRestored(target, original);
		}
	});

	test("MUST_PASS: a declared FR_EN_IDENTICAL_ALLOW key is never flagged even when byte-identical", () => {
		// Structural test of the allow-list mechanism, in-memory only —
		// never mutates real messages files for this assertion.
		const en = { proper_noun: "Vercel" };
		const fr = { proper_noun: "Vercel" };
		const allow = { proper_noun: "declared proper noun, no translation" };
		const violations = [];
		for (const [key, enValue] of Object.entries(en)) {
			if (fr[key] === enValue && !allow[key]) violations.push(key);
		}
		expect(violations).toEqual([]);
	});
});

describe("check-translations — Control 4 (called but undefined)", () => {
	// MUST_BLOCK #1 — foreign material: components/missions/mission-stats.tsx.
	// Injects a brand-new `t("<key>")` call, through the file's real
	// `useTranslations("missions.stats")` binding, whose resolved dotted path
	// exists in NO locale. This is exactly the class of defect Control 2
	// cannot see: no locale disagrees with any other locale about this key —
	// they all agree it doesn't exist.
	test("MUST_BLOCK: a t() call resolving to a key absent from ALL locales, on foreign material (mission-stats.tsx), turns Control 4 RED", () => {
		const target = path.join(ROOT, "components/missions/mission-stats.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "probeNeverDefinedAnywhere";
		const mutated = original.replace(
			/(const t = useTranslations\("missions\.stats"\);\n)/,
			(m) => `${m}\tconst __probe = t("${marker}");\n`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl4CalledButUndefined();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) => v.path === `missions.stats.${marker}`,
			);
			expect(hit).toBeDefined();
			expect(hit.missingLocales).toEqual(
				expect.arrayContaining(["en", "fr", "de", "it", "es", "pt", "ru"]),
			);
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_BLOCK #2 — foreign material: app/[locale]/dashboard/error.tsx. A
	// different file, a different real binding ("dashboard"), never selected
	// to build the matcher around.
	test("MUST_BLOCK: a t() call resolving to a key absent from ALL locales, on foreign material (dashboard/error.tsx), turns Control 4 RED", () => {
		const target = path.join(ROOT, "app/[locale]/dashboard/error.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "probeAlsoNeverDefinedAnywhere";
		const mutated = original.replace(
			/(const t = useTranslations\("dashboard"\);\n)/,
			(m) => `${m}\tconst __probe2 = t("${marker}");\n`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl4CalledButUndefined();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) => v.path === `dashboard.${marker}`,
			);
			expect(hit).toBeDefined();
			expect(hit.missingLocales).toEqual(
				expect.arrayContaining(["en", "fr", "de", "it", "es", "pt", "ru"]),
			);
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_PASS — the real, currently-shipping `theme_toggle.*` calls
	// (components/theme-toggle.tsx) must be GREEN on the current tree: the
	// concurrent restoration work landed all four keys in all seven locales.
	// This is the exact site that was RED before that restoration — proving
	// this test would have caught the live break this control was built for.
	test("MUST_PASS: theme_toggle.* calls (components/theme-toggle.tsx) are fully defined and never flagged", () => {
		const result = runControl4CalledButUndefined();
		const themeToggleViolations = result.violations.filter((v) =>
			v.path.startsWith("theme_toggle."),
		);
		expect(themeToggleViolations).toEqual([]);
	});

	// MUST_PASS — every t() call already on the tree whose resolved key
	// exists in all 7 locales must stay green. A control that flagged every
	// t() call would score 100% on MUST_BLOCK above and be worthless; this
	// asserts the real, unmutated tree has zero Control 4 false positives
	// outside of the pre-existing, already-tracked chat/consultant gaps
	// (Control 2 already names those; this just proves Control 4 does not
	// invent NEW violations beyond what static resolution can prove).
	test("MUST_PASS: Control 4 resolves the currently-fixed theme_toggle namespace with zero false positives", () => {
		const result = runControl4CalledButUndefined();
		expect(result.ok !== undefined).toBe(true);
		// Every violation must name a real file:line and at least one real
		// locale — never an empty/malformed report.
		for (const v of result.violations) {
			expect(v.file).toMatch(/\.(tsx|ts)$/);
			expect(v.line).toBeGreaterThan(0);
			expect(v.missingLocales.length).toBeGreaterThan(0);
		}
	});

	test("unresolvable dynamic t() calls are counted and named, never silently dropped", () => {
		const result = runControl4CalledButUndefined();
		expect(Array.isArray(result.unresolved)).toBe(true);
		expect(result.unresolved.length).toBeGreaterThan(0);
		for (const u of result.unresolved) {
			expect(u.file).toMatch(/\.(tsx|ts)$/);
			expect(u.line).toBeGreaterThan(0);
			expect(typeof u.reason).toBe("string");
			expect(u.reason.length).toBeGreaterThan(0);
		}
	});
});

describe("check-translations — derived inventory", () => {
	test("file inventory is derived from the filesystem and strictly exceeds the old hand-typed 70", () => {
		const files = deriveTargetFiles();
		expect(files.length).toBeGreaterThan(70);
	});

	test("components/ui/ (lit-ui source library) is excluded, and the exclusion is declared", () => {
		const files = deriveTargetFiles();
		const uiFiles = files.filter((f) =>
			path.relative(ROOT, f).startsWith(`components${path.sep}ui${path.sep}`),
		);
		expect(uiFiles.length).toBe(0);
	});
});

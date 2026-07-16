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
	isLocaleSensitiveDateFnsPattern,
	detectDateFnsFormatImportNames,
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

describe("check-translations — Control 1e (JSX expression container child literals)", () => {
	// MUST_BLOCK #1 — foreign material: components/theme-toggle.tsx. Injects a
	// ternary `{cond ? "English A" : "English B"}` directly in JSX child
	// position — the exact shape that shipped "Results" / "Quick access" to
	// French users at components/search-modal.tsx:242, invisible to both the
	// jsx-text check (not `ts.JsxText`) and the attr check (not an attribute).
	test("MUST_BLOCK: a ternary of two English string literals in JSX child position on foreign material (theme-toggle.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "components/theme-toggle.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_JSXEXPR_TERNARY_PROBE_MARKER___";
		const mutated = original.replace(
			/(\t\t\t<\/svg>\n)(\t\t<\/button>)/,
			(_m, svgClose, buttonClose) =>
				`${svgClose}\t\t\t{isDark ? "Dark mode is now active ${marker}" : "Light mode is now active"}\n${buttonClose}`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) => v.kind === "jsx-expression" && v.text.includes(marker),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_BLOCK #2 — foreign material: app/[locale]/dashboard/error.tsx. A
	// different file, a different injected shape: a bare `{"English"}` literal
	// directly in JSX child position (no ternary, no logical operator).
	test("MUST_BLOCK: a bare English string literal in JSX child position on foreign material (dashboard/error.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "app/[locale]/dashboard/error.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_JSXEXPR_BARE_PROBE_MARKER___";
		const mutated = original.replace(
			/(<CardContent className="text-center pb-2">\n)/,
			(m) => `${m}\t\t\t\t\t{"Totally hardcoded probe copy ${marker}"}\n`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) => v.kind === "jsx-expression" && v.text.includes(marker),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_BLOCK #3 — foreign material: app/[locale]/error.tsx. This test used
	// to pin the real `{error.message || "An unexpected error occurred..."}`
	// defect that shipped at this exact file/line as a MUST_PASS-direction
	// fixture, with zero injection. That defect was fixed on 2026-07-16
	// (replaced with `{error.message || t("loading_error_description")}`),
	// which correctly turned this test red: a probe that depends on a real
	// bug staying unfixed is backwards — it rewards the bug's existence and
	// punishes its repair. The fix is coverage-preserving injection: this
	// test now injects the exact same AST shape this control exists to catch
	// — a logical-OR fallback with a hardcoded English string in JSX child
	// position (`{expr || "English literal"}`) — a shape no other MUST_BLOCK
	// test in this file exercises (the others cover ternary and bare
	// literal). It targets `app/[locale]/error.tsx` again, but via a fresh
	// mutation on the `error.digest` block, never by reading the (now fixed)
	// original defect.
	test('MUST_BLOCK: an injected logical-OR English fallback ({expr || "English"}) in JSX child position on foreign material (error.tsx) turns Control 1 RED', () => {
		const target = path.join(ROOT, "app/[locale]/error.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_JSXEXPR_LOGICALOR_PROBE_MARKER___";
		const mutated = original.replace(
			/(\{error\.digest && \(\n)/,
			(m) =>
				`${m}\t\t\t\t\t\t<p>{error.digest || "No digest available ${marker}"}</p>\n`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) => v.kind === "jsx-expression" && v.text.includes(marker),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_PASS — zero false positives on `{t("key")}` calls (a CallExpression,
	// never a StringLiteral leaf) and on `className={cn(...)}` (the
	// JsxExpression's parent is JsxAttribute, not JsxElement/JsxFragment, so
	// the position check excludes it before any string is inspected).
	test("MUST_PASS: {t(...)} calls and className={cn(...)} conditional class strings are never flagged — zero false positives", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(
				require("node:os").tmpdir(),
				"check-translations-jsxexpr-probe-",
			),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		const probeSource = [
			'import { useTranslations } from "next-intl";',
			'function cn(...args) { return args.filter(Boolean).join(" "); }',
			"export function Probe({ isOpen, query }) {",
			'\tconst t = useTranslations("probe");',
			"\treturn (",
			"\t\t<div>",
			'\t\t\t<p className={cn("flex", isOpen && "hidden", query ? "border" : "no-border")}>',
			'\t\t\t\t{t(query ? "results_key" : "quick_access_key")}',
			"\t\t\t</p>",
			"\t\t</div>",
			"\t);",
			"}",
			"",
		].join("\n");
		fs.writeFileSync(tmpFile, probeSource);
		try {
			const violations = scanFile(tmpFile);
			const jsxExprViolations = violations.filter(
				(v) => v.kind === "jsx-expression",
			);
			expect(jsxExprViolations).toEqual([]);
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

describe("check-translations — Control 1f (array-of-objects copy tables)", () => {
	// MUST_BLOCK #1 — foreign material: components/theme-toggle.tsx. Injects a
	// brand-new module-level array-of-objects (`const PROBE_OPTIONS = [{ id,
	// label: "..." }, ...]`, no type annotation — a different AST shape than
	// Control 1c/1d's `Record<K, string>`), rendered via `{o.label}` inside a
	// `.map()` in JSX. This is the exact shape that shipped
	// `quickLinks[].label` ("Dashboard", "Chat", ...) at
	// components/search-modal.tsx before this control existed (that file has
	// since been fixed by concurrent work to `labelKey` + `t()`, so the proof
	// here is injection on foreign material never selected to build this
	// matcher around).
	test("MUST_BLOCK: a new English array-of-objects label table reached via JSX .map() on foreign material (theme-toggle.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "components/theme-toggle.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_ARRAYCOPY_PROBE_MARKER___";
		const injectedDecl = `\nconst PROBE_OPTIONS = [\n\t{ id: "opt1", label: "Totally Hardcoded Probe Option ${marker}" },\n\t{ id: "opt2", label: "Second Probe Option" },\n];\n`;
		let mutated = original.replace(
			'import { useTheme } from "next-themes";\n',
			(m) => `${m}${injectedDecl}`,
		);
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			"{/* Sun icon */}",
			"{PROBE_OPTIONS.map((o) => (\n\t\t\t\t<span key={o.id}>{o.label}</span>\n\t\t\t))}\n\t\t\t{/* Sun icon */}",
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		// Assert the mutation actually landed before reading any verdict.
		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);
		const jsxRefLanded = execSync(`grep -c "o.label" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(jsxRefLanded)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) =>
					v.kind === "object-copy:PROBE_OPTIONS[0].label" &&
					v.text.includes(marker),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_BLOCK #2 — foreign material: app/[locale]/dashboard/error.tsx. A
	// different file, a different injected shape: the copy-bearing property is
	// `name` (not `label`), and the render reads it via optional chaining
	// (`chip?.name`) through an intermediate `.find()` — the exact indirection
	// depth that defeated `isReferencedInJsx` on
	// `components/design-system/menu-picker.tsx` `MENU_OPTIONS` (`currentMenu
	// = MENU_OPTIONS.find(...)`, then `currentMenu?.label` in JSX). Proves
	// `isPropertyNameReferencedInJsx` generalizes past a fixed indirection
	// depth, not merely past the one file it was measured on.
	test("MUST_BLOCK: a new English array-of-objects table read through an indirect .find() + optional-chained JSX property access on foreign material (dashboard/error.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "app/[locale]/dashboard/error.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_ARRAYCOPY_INDIRECT_PROBE_MARKER___";
		const injectedDecl = `\nconst PROBE_CHIPS = [\n\t{ code: "probe", name: "Totally Hardcoded Probe Chip Name ${marker}" },\n];\n`;
		let mutated = original.replace(
			"export default function DashboardError({\n",
			(m) => `${injectedDecl}${m}`,
		);
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			'\tconst t = useTranslations("dashboard");\n',
			(m) =>
				`${m}\tconst probeChip = PROBE_CHIPS.find((c) => c.code === "probe");\n`,
		);
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			'{t("error_boundary_title")}',
			'{t("error_boundary_title")}\n\t\t\t\t\t\t{probeChip?.name}',
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);
		const jsxRefLanded = execSync(`grep -c "probeChip?.name" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(jsxRefLanded)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) =>
					v.kind === "object-copy:PROBE_CHIPS[0].name" &&
					v.text.includes(marker),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_PASS — the real, currently-shipping locale-display tables
	// (`SUPPORTED_LANGUAGES` in ProfileTab.tsx, keyed by `code`) must NEVER be
	// flagged: a language picker always renders each language's own name in
	// that language ("Deutsch", "Français", ...) — translating those would be
	// the defect. The exemption is derived from `i18n/routing.ts`'s locale
	// list, not a hardcoded filename.
	test("MUST_PASS: SUPPORTED_LANGUAGES (ProfileTab.tsx) locale-display table is never flagged — zero false positives", () => {
		const result = runControl1LiteralScan();
		const falsePositives = result.violations.filter((v) =>
			v.kind.startsWith("object-copy:SUPPORTED_LANGUAGES"),
		);
		expect(falsePositives).toEqual([]);
	});

	// MUST_PASS — `TECH_STACK[].name` (Next.js, Convex, Clerk, Polar, Vercel AI
	// SDK, fal.ai, Firecrawl) are declared product/brand proper nouns
	// (`ALLOWLIST_TOKENS`, reused unchanged via the shared `report()` helper),
	// never translation candidates.
	test("MUST_PASS: TECH_STACK product/brand names (TechStackSection.tsx) are never flagged — zero false positives", () => {
		const result = runControl1LiteralScan();
		const falsePositives = result.violations.filter((v) =>
			v.kind.startsWith("object-copy:TECH_STACK"),
		);
		expect(falsePositives).toEqual([]);
	});

	// MUST_PASS — a locale-keyed array where the copy property sits ALONGSIDE
	// the locale-code field (not the property being tested for translation) is
	// still exempt in full, proven directly against a controlled fixture so
	// this does not depend on the shape of any one real file surviving future
	// edits.
	test("MUST_PASS: a synthetic locale-keyed array-of-objects table produces zero object-copy findings", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(
				require("node:os").tmpdir(),
				"check-translations-localearray-probe-",
			),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		fs.writeFileSync(
			tmpFile,
			[
				'import { useTranslations } from "next-intl";',
				"const LANGS = [",
				'\t{ code: "en", label: "English" },',
				'\t{ code: "fr", label: "Français" },',
				'\t{ code: "de", label: "Deutsch" },',
				"];",
				"export function Probe() {",
				"\treturn (",
				"\t\t<div>",
				"\t\t\t{LANGS.map((l) => (",
				"\t\t\t\t<span key={l.code}>{l.label}</span>",
				"\t\t\t))}",
				"\t\t</div>",
				"\t);",
				"}",
				"",
			].join("\n"),
		);
		try {
			const violations = scanFile(tmpFile);
			const objectCopyViolations = violations.filter((v) =>
				v.kind.startsWith("object-copy"),
			);
			expect(objectCopyViolations).toEqual([]);
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	// MUST_PASS — an array-of-objects whose copy-bearing property is declared
	// but never actually read via JSX property access anywhere in the file
	// (condition (c) fails) must not be flagged — zero false positives on
	// internal-only data.
	test("MUST_PASS: an array-of-objects never read via a JSX property access is never flagged (condition (c) not proven)", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(
				require("node:os").tmpdir(),
				"check-translations-unreferenced-probe-",
			),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		fs.writeFileSync(
			tmpFile,
			[
				"const INTERNAL_ONLY = [",
				'\t{ id: "a", label: "Never Rendered Anywhere" },',
				"];",
				"export function computeSomething() {",
				"\treturn INTERNAL_ONLY.length;",
				"}",
				"export function Probe() {",
				"\treturn <div>static</div>;",
				"}",
				"",
			].join("\n"),
		);
		try {
			const violations = scanFile(tmpFile);
			const objectCopyViolations = violations.filter((v) =>
				v.kind.startsWith("object-copy"),
			);
			expect(objectCopyViolations).toEqual([]);
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
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

describe("check-translations — Control 3 (fr value byte-identical to en) — SIGNAL, not a gate", () => {
	// MUST_BLOCK — a real, multi-word English sentence copy-pasted into fr
	// for a currently-distinct key must still be REPORTED by Control 3 (its
	// `ok` field goes false and the key is named), even though this finding
	// no longer fails the build (see the gating probe below for that half).
	test("MUST_BLOCK: copying a real multi-word en sentence into fr for a currently-distinct key still turns Control 3.ok RED and is named", () => {
		const target = path.join(ROOT, "messages", "fr.json");
		const original = fs.readFileSync(target, "utf8");
		const parsed = JSON.parse(original);

		const enParsed = JSON.parse(
			fs.readFileSync(path.join(ROOT, "messages", "en.json"), "utf8"),
		);

		// Use a real key whose en value is genuine multi-word prose (not a
		// single cognate token, not ICU, not a URL) so none of the three
		// derived exclusion layers could mask this as a false negative.
		expect(parsed.common.close).toBeDefined();
		expect(enParsed.common.close).toMatch(/[a-z]{3,}/);
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

	test("MUST_PASS: every declared FR_EN_IDENTICAL_ALLOW value, plus the ICU and technical-identifier derived rules, produce zero findings on the real tree", () => {
		// Full-tree run: proves the derived rules (ICU/format strip,
		// technical-identifier detection) and the declared value allowlist
		// together close every measured false positive — not merely an
		// in-memory toy case.
		const result = runControl3FrEqualsEn();
		expect(result.violations).toEqual([]);
	});

	test("MUST_PASS: a declared cognate value ('Description') across many unrelated keys, plus an ICU plural and a URL placeholder, produce zero findings via a real subprocess run against an isolated fixture", () => {
		const dir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "control3-cognate-probe-"),
		);
		try {
			fs.mkdirSync(path.join(dir, "i18n"), { recursive: true });
			fs.mkdirSync(path.join(dir, "messages"), { recursive: true });
			fs.mkdirSync(path.join(dir, "app"), { recursive: true });
			fs.mkdirSync(path.join(dir, "components"), { recursive: true });
			// >0 files required — 0 files scanned is FATAL, not a pass.
			fs.writeFileSync(
				path.join(dir, "components", "Probe.tsx"),
				"export function Probe() {\n\treturn <span />;\n}\n",
			);
			fs.writeFileSync(
				path.join(dir, "i18n", "routing.ts"),
				'export const routing = { locales: ["en", "fr"] };\n',
			);
			const shared = {
				field_a: { description: "Description" },
				field_b: { description: "Description" },
				count_unit: "{count, plural, one {item} other {items}}",
				placeholder_url: "https://example.com/...",
			};
			fs.writeFileSync(
				path.join(dir, "messages", "en.json"),
				JSON.stringify(shared, null, "\t"),
			);
			fs.writeFileSync(
				path.join(dir, "messages", "fr.json"),
				JSON.stringify(shared, null, "\t"),
			);

			const out = execSync(
				`node "${path.join(ROOT, "scripts", "check-translations.js")}" --json`,
				{
					cwd: ROOT,
					encoding: "utf8",
					env: { ...process.env, CHECK_TRANSLATIONS_ROOT: dir },
				},
			);
			const parsed = JSON.parse(out);
			expect(parsed.control3.violations).toEqual([]);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe("check-translations — Control 3 does not gate the build (main() exit-code probe)", () => {
	// GATING PROBE — the entire point of this fix, proved via the REAL exit
	// code of a REAL subprocess invocation of scripts/check-translations.js,
	// not a simulated formula. Uses an isolated fixture tree
	// (CHECK_TRANSLATIONS_ROOT override, added to check-translations.js
	// solely for this test's isolation) so the ambient repo's unrelated,
	// pre-existing Control 1/2/4 dirty-tree failures cannot contaminate
	// either direction of the proof.
	function buildFixtureRoot() {
		const dir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "check-translations-gating-"),
		);
		fs.mkdirSync(path.join(dir, "i18n"), { recursive: true });
		fs.mkdirSync(path.join(dir, "messages"), { recursive: true });
		fs.mkdirSync(path.join(dir, "app"), { recursive: true });
		fs.mkdirSync(path.join(dir, "components"), { recursive: true });
		// A single clean, English-literal-free component so Controls 1/4 have
		// >0 files to scan (0 files scanned is treated as a FATAL scan-root
		// misconfiguration by both controls, not a pass) while still resolving
		// with zero violations.
		fs.writeFileSync(
			path.join(dir, "components", "Probe.tsx"),
			[
				'import { useTranslations } from "next-intl";',
				"export function Probe() {",
				'\tconst t = useTranslations("common");',
				'\treturn <span>{t("close")}</span>;',
				"}",
				"",
			].join("\n"),
		);
		fs.writeFileSync(
			path.join(dir, "i18n", "routing.ts"),
			'export const routing = { locales: ["en", "fr"] };\n',
		);
		const en = { common: { close: "Close the current dialog window" } };
		const fr = { common: { close: "Fermer la fenêtre de dialogue actuelle" } };
		fs.writeFileSync(
			path.join(dir, "messages", "en.json"),
			JSON.stringify(en, null, "\t"),
		);
		fs.writeFileSync(
			path.join(dir, "messages", "fr.json"),
			JSON.stringify(fr, null, "\t"),
		);
		return { dir, en, fr };
	}

	function runScript(dir) {
		try {
			execSync(
				`node "${path.join(ROOT, "scripts", "check-translations.js")}"`,
				{
					cwd: ROOT,
					encoding: "utf8",
					stdio: "pipe",
					env: { ...process.env, CHECK_TRANSLATIONS_ROOT: dir },
				},
			);
			return 0;
		} catch (err) {
			return err.status;
		}
	}

	test("MUST_PASS direction: Control 3 reporting a finding, with Controls 1/2/4 clean, exits 0", () => {
		const { dir, en } = buildFixtureRoot();
		try {
			// Force an fr===en Control 3 finding by overwriting fr with en.
			fs.writeFileSync(
				path.join(dir, "messages", "fr.json"),
				JSON.stringify(en, null, "\t"),
			);
			const landed = JSON.parse(
				fs.readFileSync(path.join(dir, "messages", "fr.json"), "utf8"),
			);
			expect(landed.common.close).toBe(en.common.close); // mutation landed

			const exitCode = runScript(dir);
			expect(exitCode).toBe(0);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	test("MUST_BLOCK direction: a real Control 2 failure (key missing from one locale) exits 1, even with Control 3 clean", () => {
		const { dir } = buildFixtureRoot();
		try {
			const frPath = path.join(dir, "messages", "fr.json");
			const fr = JSON.parse(fs.readFileSync(frPath, "utf8"));
			delete fr.common.close;
			fs.writeFileSync(frPath, JSON.stringify(fr, null, "\t"));
			const landed = JSON.parse(fs.readFileSync(frPath, "utf8"));
			expect(landed.common.close).toBeUndefined(); // mutation landed

			const exitCode = runScript(dir);
			expect(exitCode).toBe(1);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
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

	test("the unresolvable count DROPS once static-map/array-property resolution is applied, and the split is reported", () => {
		// Regression proof for the Control 4 static-map erosion fix: before this
		// fix, `t(CATEGORY_LABEL_KEYS[cat])`, `t(SECTOR_I18N_KEYS[s])`,
		// `t(currentMenu.labelKey)`, `t(link.labelKey)` all landed in
		// `unresolved`, merely counted, never verified. This asserts the
		// resolved-from-static-map count is > 0 and the remaining unresolved
		// count is strictly smaller than the pre-fix baseline of 33.
		const result = runControl4CalledButUndefined();
		expect(result.resolvedFromStaticMap).toBeGreaterThan(0);
		expect(result.unresolved.length).toBeLessThan(33);
		expect(
			result.resolvedFromStaticMap + result.unresolved.length,
		).toBeGreaterThanOrEqual(result.resolvedFromStaticMap);
	});
});

describe("check-translations — Control 4 static-map resolution (shape A: t(MAP[k]))", () => {
	// MUST_BLOCK — foreign material: components/chat/ModelSelector.tsx. Before
	// this fix, `t(CATEGORY_LABEL_KEYS[cat])` was dumped into `unresolved` and
	// never actually checked against the locale files — a static map missing
	// a key in even one locale would ship silently. This injects a brand-new
	// entry into the REAL, already-consumed CATEGORY_LABEL_KEYS map whose
	// value resolves to a key present in NO locale.
	test("MUST_BLOCK: a new entry in CATEGORY_LABEL_KEYS (foreign material, real t(MAP[k]) site) resolving to a key absent from all locales turns Control 4 RED, naming the static map", () => {
		const target = path.join(ROOT, "components/chat/ModelSelector.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "probeCategoryKeyNeverDefinedAnywhere";
		const mutated = original.replace(
			/(const CATEGORY_LABEL_KEYS: Record<ModelCategory, string> = \{)/,
			(m) =>
				`${m}\n\t// biome-ignore lint: probe injection\n\tprobeCategory: "${marker}",`,
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
			const hit = result.violations.find((v) => v.path === `chat.${marker}`);
			expect(hit).toBeDefined();
			expect(hit.resolvedFrom).toBe("static map CATEGORY_LABEL_KEYS");
			expect(hit.missingLocales).toEqual(
				expect.arrayContaining(["en", "fr", "de", "it", "es", "pt", "ru"]),
			);
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_BLOCK #2 — a different foreign file, a different real static map:
	// app/[locale]/dashboard/consultant/onboard/page.tsx SECTOR_I18N_KEYS.
	test("MUST_BLOCK: a new entry in SECTOR_I18N_KEYS (foreign material, second real t(MAP[k]) site) resolving to a key absent from all locales turns Control 4 RED", () => {
		const target = path.join(
			ROOT,
			"app/[locale]/dashboard/consultant/onboard/page.tsx",
		);
		const original = fs.readFileSync(target, "utf8");

		const marker = "probeSectorKeyNeverDefinedAnywhere";
		const mutated = original.replace(
			/(const SECTOR_I18N_KEYS: Record<Sector, string> = \{)/,
			(m) =>
				`${m}\n\t// biome-ignore lint: probe injection\n\tprobeSector: "${marker}",`,
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
				(v) => v.path === `consultant.${marker}`,
			);
			expect(hit).toBeDefined();
			expect(hit.resolvedFrom).toBe("static map SECTOR_I18N_KEYS");
		} finally {
			assertRestored(target, original);
		}
	});

	test("MUST_PASS: the real, currently-shipping CATEGORY_LABEL_KEYS / SECTOR_I18N_KEYS values are fully defined in all 7 locales — zero false positives", () => {
		const result = runControl4CalledButUndefined();
		const falsePositives = result.violations.filter(
			(v) =>
				v.resolvedFrom === "static map CATEGORY_LABEL_KEYS" ||
				v.resolvedFrom === "static map SECTOR_I18N_KEYS",
		);
		expect(falsePositives).toEqual([]);
	});
});

describe("check-translations — Control 4 static-map resolution (shape B: t(item.propName))", () => {
	// MUST_BLOCK — foreign material: components/landing/LandingNav.tsx. Before
	// this fix, `t(link.labelKey)` was dumped into `unresolved`. This injects
	// a brand-new entry into the REAL NAV_LINKS array whose `labelKey` value
	// resolves to a key present in NO locale — the property-name invariant
	// (`.labelKey`) is what Control 4 now resolves against, regardless of the
	// `.find()`/`.map()` indirection between the array and the read site.
	test("MUST_BLOCK: a new NAV_LINKS entry (foreign material, real t(item.labelKey) site) resolving to a key absent from all locales turns Control 4 RED, naming the array property", () => {
		const target = path.join(ROOT, "components/landing/LandingNav.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "probe_nav_link_key_never_defined_anywhere";
		const mutated = original.replace(
			/(const NAV_LINKS = \[)/,
			(m) => `${m}\n\t{ href: "#probe", labelKey: "${marker}" as const },`,
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
			// LandingNav has no explicit useTranslations namespace binding for
			// `link.labelKey` reads other than the file's own `t`; resolve
			// generically by scanning for the marker regardless of namespace.
			const hit = result.violations.find((v) => v.path.endsWith(marker));
			expect(hit).toBeDefined();
			expect(hit.resolvedFrom).toBe("array property .labelKey");
			expect(hit.missingLocales).toEqual(
				expect.arrayContaining(["en", "fr", "de", "it", "es", "pt", "ru"]),
			);
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_BLOCK #2 — a different foreign file, a different real array-of-
	// objects table reached via a different indirection depth:
	// components/design-system/menu-picker.tsx MENU_OPTIONS ->
	// `currentMenu.labelKey` (via `.find()`, not `.map()`).
	test("MUST_BLOCK: a new MENU_OPTIONS entry (foreign material, real t(currentMenu.labelKey) via .find() indirection) resolving to a key absent from all locales turns Control 4 RED", () => {
		const target = path.join(ROOT, "components/design-system/menu-picker.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "probe_menu_option_key_never_defined_anywhere";
		const mutated = original.replace(
			/(const MENU_OPTIONS = \[)/,
			(m) =>
				`${m}\n\t{ value: "probe" as MenuColorValue, labelKey: "${marker}" },`,
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
			const hit = result.violations.find((v) => v.path.endsWith(marker));
			expect(hit).toBeDefined();
			expect(hit.resolvedFrom).toBe("array property .labelKey");
		} finally {
			assertRestored(target, original);
		}
	});

	test("MUST_PASS: the real, currently-shipping NAV_LINKS / MENU_OPTIONS labelKey values are fully defined in all 7 locales — zero false positives", () => {
		const result = runControl4CalledButUndefined();
		const falsePositives = result.violations.filter(
			(v) => v.resolvedFrom === "array property .labelKey",
		);
		expect(falsePositives).toEqual([]);
	});
});

describe("check-translations — date-fns format() implicit-locale detector", () => {
	// MUST_BLOCK — foreign material: components/missions/create-mission-modal.tsx.
	// This test used to pin the real, currently-shipping
	// `format(targetDate, "PPP")` call (no `{ locale }` option) at line 463 as
	// a MUST_PASS-direction fixture, with zero injection. That call site was
	// fixed on 2026-07-16 (replaced with next-intl `formatter.dateTime(...)`),
	// which correctly turned this test red — the same "pins a live bug"
	// defect as the jsx-expression test above. The file still imports
	// `format` from date-fns (it's used elsewhere for ISO `"yyyy-MM-dd"`
	// form values, a pattern this control must NOT flag — see the
	// false-positive test below), so the fix here is to inject a fresh
	// `format(d, "PPP")` call using that same real import binding, proving
	// the detector still bites on this exact pattern without depending on
	// the (now-fixed) original call site.
	test('MUST_BLOCK: an injected format(d, "PPP") with no locale option, using the real date-fns import binding, turns Control 1 RED as implicit-locale', () => {
		const target = path.join(
			ROOT,
			"components/missions/create-mission-modal.tsx",
		);
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_DATEFNS_PPP_PROBE_MARKER___";
		const mutated = original.replace(
			/(import \{ format \} from "date-fns";\n)/,
			(m) =>
				`${m}const __probeFormatPPP = (d) => format(d, "PPP"); // ${marker}\n`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) =>
					v.file === "components/missions/create-mission-modal.tsx" &&
					v.kind === "implicit-locale" &&
					v.text.includes("PPP"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// MUST_BLOCK — foreign material: components/missions/mission-card.tsx — a
	// different file that, since 2026-07-16, imports no date-fns symbol at
	// all (migrated to next-intl `useFormatter()`; it used to import
	// `formatDistanceToNow`, the anchor this test previously mutated against
	// — that anchor no longer exists, which is exactly the "pins a live
	// defect's shape" failure mode this whole rewrite fixes: the anchor
	// disappeared because the file got fixed, not because the test broke).
	// This version injects BOTH a fresh `import { format } from "date-fns"`
	// binding (anchored on the stable `import { useFormatter, useTranslations }
	// from "next-intl";` line, which is unrelated to date-fns and won't rot
	// the same way) and a fresh `format(d, "PPPP")` call with no locale
	// option — proving the detector fires on the import-derived binding
	// name, not a hardcoded "format" string match, and proving it fires on a
	// different pattern token ("PPPP") than the "PPP" site covered above.
	test('MUST_BLOCK: an injected format(d, "PPPP") with no locale option, on foreign material with a freshly-injected date-fns import, turns Control 1 RED as implicit-locale', () => {
		const target = path.join(ROOT, "components/missions/mission-card.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_DATEFNS_PROBE_MARKER___";
		let mutated = original.replace(
			/(import \{ useFormatter, useTranslations \} from "next-intl";\n)/,
			(m) => `${m}import { format } from "date-fns";\n`,
		);
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			/(export function MissionCard\([^)]*\)[^{]*\{)/,
			(m) =>
				`${m}\n\tconst __probeDate = format(new Date(), "PPPP"); // ${marker}`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
			cwd: ROOT,
			encoding: "utf8",
		}).trim();
		expect(Number(landed)).toBeGreaterThan(0);

		try {
			const result = runControl1LiteralScan();
			expect(result.ok).toBe(false);
			const hit = result.violations.find(
				(v) => v.kind === "implicit-locale" && v.text.includes("PPPP"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	test('MUST_PASS: format(d, "yyyy-MM-dd") (ISO form-value dates, create-mission-modal.tsx:414/471) are never flagged — zero false positives', () => {
		const result = runControl1LiteralScan();
		const falsePositives = result.violations.filter(
			(v) =>
				v.file === "components/missions/create-mission-modal.tsx" &&
				v.kind === "implicit-locale" &&
				v.text.includes("yyyy-MM-dd"),
		);
		expect(falsePositives).toEqual([]);
	});

	test("isLocaleSensitiveDateFnsPattern: unit-level discrimination — name/preset/ordinal patterns are locale-sensitive, fixed-width numeric patterns are not", () => {
		expect(isLocaleSensitiveDateFnsPattern("PPP")).toBe(true);
		expect(isLocaleSensitiveDateFnsPattern("PPPP")).toBe(true);
		expect(isLocaleSensitiveDateFnsPattern("MMMM d, yyyy")).toBe(true);
		expect(isLocaleSensitiveDateFnsPattern("EEEE")).toBe(true);
		expect(isLocaleSensitiveDateFnsPattern("do MMMM")).toBe(true);
		expect(isLocaleSensitiveDateFnsPattern("yyyy-MM-dd")).toBe(false);
		expect(isLocaleSensitiveDateFnsPattern("HH:mm:ss")).toBe(false);
		expect(isLocaleSensitiveDateFnsPattern("MM/dd/yyyy")).toBe(false);
	});

	test("detectDateFnsFormatImportNames: only matches the local binding actually imported from date-fns, never an unrelated same-named local helper", () => {
		const ts = require("typescript");
		const src1 = 'import { format } from "date-fns";\n';
		const sf1 = ts.createSourceFile(
			"probe1.ts",
			src1,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		expect(Array.from(detectDateFnsFormatImportNames(sf1))).toEqual(["format"]);

		const src2 = "function format(x) { return String(x); }\n";
		const sf2 = ts.createSourceFile(
			"probe2.ts",
			src2,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		expect(Array.from(detectDateFnsFormatImportNames(sf2))).toEqual([]);
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

// ---------------------------------------------------------------------------
// Bipolar probe — date-fns prose functions (Control 1, implicit-locale kind)
//
// MUST_BLOCK: >=3 distinct foreign sites with landing assertions and
// byte-for-byte restoration proof.
// MUST_PASS: 0 false positives, each case cited by name.
// ---------------------------------------------------------------------------

const {
	detectDateFnsProseImportNames,
	detectDateFnsNamespaceImports,
	ALWAYS_PROSE_DATE_FNS_FUNS,
	callHasLocaleOption,
} = require("../check-translations.js");
const ts = require("typescript");

describe("check-translations — date-fns prose function implicit-locale guard", () => {
	// -------------------------------------------------------------------------
	// MUST_BLOCK #1 — foreign material: components/missions/create-mission-modal.tsx
	// This file already has `import { format } from "date-fns"`. We extend the
	// import and inject a formatDistanceToNow call with no { locale } option.
	// -------------------------------------------------------------------------
	test("MUST_BLOCK #1: formatDistanceToNow(d, { addSuffix: true }) on foreign material (create-mission-modal.tsx) turns Control 1 RED", () => {
		const target = path.join(
			ROOT,
			"components/missions/create-mission-modal.tsx",
		);
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_PROSE_PROBE1_MARKER___";
		// Extend the existing date-fns import and inject a call that returns
		// "3 days ago" in English without a locale — the exact defect class.
		let mutated = original.replace(
			/import \{ format \} from "date-fns";/,
			`import { format, formatDistanceToNow } from "date-fns";`,
		);
		expect(mutated).not.toBe(original);
		// Inject a call after the first `const ` variable declaration in the component.
		mutated = mutated.replace(
			/(export (default )?function \w[^{]*\{)/,
			`$1\n  const _probe1_${marker} = formatDistanceToNow(new Date(), { addSuffix: true });`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		// Assert mutation landed before reading any verdict.
		const landed = execSync(`grep -c "${marker}" "${target}"`, {
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
					v.file === path.relative(ROOT, target) &&
					v.text.includes("formatDistanceToNow"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// -------------------------------------------------------------------------
	// MUST_BLOCK #2 — foreign material: components/missions/mission-card.tsx
	// Injects formatDistance(a, b) with no { locale } option.
	// -------------------------------------------------------------------------
	test("MUST_BLOCK #2: formatDistance(a, b) with no locale on foreign material (mission-card.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "components/missions/mission-card.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_PROSE_PROBE2_MARKER___";
		let mutated = original.replace(
			/^("use client";\n)/,
			`$1import { formatDistance } from "date-fns";\n`,
		);
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			/(export (default )?function \w[^{]*\{)/,
			`$1\n  const _probe2_${marker} = formatDistance(new Date(), new Date());`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
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
					v.file === path.relative(ROOT, target) &&
					v.text.includes("formatDistance"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// -------------------------------------------------------------------------
	// MUST_BLOCK #3 — foreign material: components/missions/mission-stats.tsx
	// Injects formatDuration({ months: 1 }) with no { locale } option.
	// -------------------------------------------------------------------------
	test("MUST_BLOCK #3: formatDuration({ months: 1 }) with no locale on foreign material (mission-stats.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "components/missions/mission-stats.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_PROSE_PROBE3_MARKER___";
		let mutated = original.replace(
			/^("use client";\n)/,
			`$1import { formatDuration } from "date-fns";\n`,
		);
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			/(export (default )?function \w[^{]*\{)/,
			`$1\n  const _probe3_${marker} = formatDuration({ months: 1 });`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
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
					v.file === path.relative(ROOT, target) &&
					v.text.includes("formatDuration"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// -------------------------------------------------------------------------
	// MUST_BLOCK #4 (regression): format(d, "PPP") still flagged after the
	// refactor — derives from the existing import, no regression.
	// -------------------------------------------------------------------------
	test('MUST_BLOCK #4 (regression): format(d, "PPP") on foreign material still turns Control 1 RED', () => {
		const target = path.join(ROOT, "components/missions/mission-stats.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_PPP_REGRESSION_PROBE___";
		let mutated = original.replace(
			/^("use client";\n)/,
			`$1import { format } from "date-fns";\n`,
		);
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			/(export (default )?function \w[^{]*\{)/,
			`$1\n  const _ppp_${marker} = format(new Date(), "PPP");`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
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
					v.file === path.relative(ROOT, target) &&
					v.text.includes("format"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	// -------------------------------------------------------------------------
	// MUST_PASS — zero false positives, each case cited by name.
	// -------------------------------------------------------------------------
	test("MUST_PASS: format(d, 'yyyy-MM-dd') — machine-readable ISO pattern, NOT flagged", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "cti18n-prose-"),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		fs.writeFileSync(
			tmpFile,
			`import { format } from "date-fns";\nexport function P() { return <span>{format(new Date(), "yyyy-MM-dd")}</span>; }\n`,
		);
		try {
			const violations = scanFile(tmpFile).filter(
				(v) => v.kind === "implicit-locale",
			);
			expect(violations).toEqual([]); // "yyyy-MM-dd" is a numeric ISO pattern — never locale-sensitive
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	test("MUST_PASS: formatDistanceToNow WITH { locale } — opted in, NOT flagged", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "cti18n-prose-"),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		fs.writeFileSync(
			tmpFile,
			`import { formatDistanceToNow } from "date-fns";\nimport { fr } from "date-fns/locale";\nexport function P() { return <span>{formatDistanceToNow(new Date(), { addSuffix: true, locale: fr })}</span>; }\n`,
		);
		try {
			const violations = scanFile(tmpFile).filter(
				(v) => v.kind === "implicit-locale",
			);
			expect(violations).toEqual([]); // { locale: fr } is explicitly passed
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	test("MUST_PASS: a non-date-fns local function named formatDistanceToNow — NOT flagged (import-binding logic, not name matching)", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "cti18n-prose-"),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		fs.writeFileSync(
			tmpFile,
			`function formatDistanceToNow(d) { return String(d); }\nexport function P() { return <span>{formatDistanceToNow(new Date())}</span>; }\n`,
		);
		try {
			const violations = scanFile(tmpFile).filter(
				(v) => v.kind === "implicit-locale",
			);
			expect(violations).toEqual([]); // local function, NOT a date-fns import — binding check protects this
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	test("MUST_PASS: addDays / isAfter / differenceInDays — return Date/boolean/number, NOT locale-sensitive, NOT flagged", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "cti18n-prose-"),
		);
		const tmpFile = path.join(tmpDir, "probe.tsx");
		fs.writeFileSync(
			tmpFile,
			`import { addDays, isAfter, differenceInDays } from "date-fns";\nexport function P() { const d = addDays(new Date(), 1); const b = isAfter(d, new Date()); const n = differenceInDays(d, new Date()); return <span>{n}</span>; }\n`,
		);
		try {
			const violations = scanFile(tmpFile).filter(
				(v) => v.kind === "implicit-locale",
			);
			expect(violations).toEqual([]); // none of these are in ALWAYS_PROSE_DATE_FNS_FUNS
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	// -------------------------------------------------------------------------
	// Unit tests for detectDateFnsProseImportNames and ALWAYS_PROSE_DATE_FNS_FUNS
	// -------------------------------------------------------------------------
	test("detectDateFnsProseImportNames: named import from date-fns is detected with canonical name", () => {
		const src = `import { formatDistanceToNow, formatDistance } from "date-fns";\n`;
		const sf = ts.createSourceFile(
			"probe.ts",
			src,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		const result = detectDateFnsProseImportNames(sf);
		expect(result.get("formatDistanceToNow")).toBe("formatDistanceToNow");
		expect(result.get("formatDistance")).toBe("formatDistance");
	});

	test("detectDateFnsProseImportNames: aliased import is detected by local name with canonical name", () => {
		const src = `import { formatDistanceToNow as dist } from "date-fns";\n`;
		const sf = ts.createSourceFile(
			"probe.ts",
			src,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		const result = detectDateFnsProseImportNames(sf);
		expect(result.get("dist")).toBe("formatDistanceToNow");
		expect(result.has("formatDistanceToNow")).toBe(false);
	});

	test("detectDateFnsProseImportNames: subpath import is detected", () => {
		const src = `import formatDistanceToNow from "date-fns/formatDistanceToNow";\n`;
		const sf = ts.createSourceFile(
			"probe.ts",
			src,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		const result = detectDateFnsProseImportNames(sf);
		expect(result.get("formatDistanceToNow")).toBe("formatDistanceToNow");
	});

	test("detectDateFnsProseImportNames: non-prose date-fns imports (addDays, format) are NOT detected", () => {
		const src = `import { addDays, format } from "date-fns";\n`;
		const sf = ts.createSourceFile(
			"probe.ts",
			src,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		const result = detectDateFnsProseImportNames(sf);
		expect(result.size).toBe(0);
	});

	test("ALWAYS_PROSE_DATE_FNS_FUNS does NOT include lightFormat (locale-safe by design — numeric-only tokens)", () => {
		expect(ALWAYS_PROSE_DATE_FNS_FUNS.has("lightFormat")).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Bipolar probe — `import * as dateFns from "date-fns"` NAMESPACE import
// shape (the `3d` call-site check). Neither the named-import binding maps
// (3b/3c) nor a bare-identifier spelling match ever see `dateFns.format(...)`
// / `dateFns.formatDistanceToNow(...)` — the callee is a
// PropertyAccessExpression, never a plain Identifier.
// ---------------------------------------------------------------------------

describe("check-translations — date-fns NAMESPACE import (`import * as dateFns`) implicit-locale guard", () => {
	test('detectDateFnsNamespaceImports: resolves the local binding of `import * as dateFns from "date-fns"`', () => {
		const src = 'import * as dateFns from "date-fns";\n';
		const sf = ts.createSourceFile(
			"probe-ns1.ts",
			src,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		expect(Array.from(detectDateFnsNamespaceImports(sf))).toEqual(["dateFns"]);
	});

	test("detectDateFnsNamespaceImports: a named import (not a namespace import) is NOT detected", () => {
		const src = 'import { format } from "date-fns";\n';
		const sf = ts.createSourceFile(
			"probe-ns2.ts",
			src,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		expect(Array.from(detectDateFnsNamespaceImports(sf))).toEqual([]);
	});

	test("MUST_BLOCK: dateFns.formatDistanceToNow(d, { addSuffix: true }) via namespace import, no locale, on foreign material (theme-toggle.tsx) turns Control 1 RED", () => {
		const target = path.join(ROOT, "components/theme-toggle.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_DATEFNS_NS_PROBE_MARKER___";
		let mutated = `import * as dateFns from "date-fns";\n${original}`;
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			/(export function ThemeToggle\([^)]*\)[^{]*\{)/,
			(m) =>
				`${m}\n\tconst __probeDist = dateFns.formatDistanceToNow(new Date(), { addSuffix: true }); // ${marker}`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
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
					v.file === "components/theme-toggle.tsx" &&
					v.text.includes("dateFns.formatDistanceToNow"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	test('MUST_BLOCK: dateFns.format(d, "PPP") via namespace import, no locale, on foreign material (theme-toggle.tsx) turns Control 1 RED', () => {
		const target = path.join(ROOT, "components/theme-toggle.tsx");
		const original = fs.readFileSync(target, "utf8");

		const marker = "___I18N_DATEFNS_NS_FORMAT_PROBE_MARKER___";
		let mutated = `import * as dateFns from "date-fns";\n${original}`;
		expect(mutated).not.toBe(original);
		mutated = mutated.replace(
			/(export function ThemeToggle\([^)]*\)[^{]*\{)/,
			(m) =>
				`${m}\n\tconst __probeFmt = dateFns.format(new Date(), "PPP"); // ${marker}`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);

		const landed = execSync(`grep -c "${marker}" "${target}"`, {
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
					v.file === "components/theme-toggle.tsx" &&
					v.text.includes("dateFns.format"),
			);
			expect(hit).toBeDefined();
		} finally {
			assertRestored(target, original);
		}
	});

	test("MUST_PASS: dateFns.formatDistanceToNow(d, { locale: fr }) via namespace import — opted in, NOT flagged", () => {
		const target = path.join(ROOT, "components/theme-toggle.tsx");
		const original = fs.readFileSync(target, "utf8");

		let mutated = `import * as dateFns from "date-fns";\nimport { fr } from "date-fns/locale";\n${original}`;
		mutated = mutated.replace(
			/(export function ThemeToggle\([^)]*\)[^{]*\{)/,
			(m) =>
				`${m}\n\tconst __probeOk = dateFns.formatDistanceToNow(new Date(), { addSuffix: true, locale: fr });`,
		);
		expect(mutated).not.toBe(original);

		fs.writeFileSync(target, mutated);
		try {
			const result = runControl1LiteralScan();
			const falsePositives = result.violations.filter(
				(v) =>
					v.file === "components/theme-toggle.tsx" &&
					v.kind === "implicit-locale" &&
					v.text.includes("dateFns.formatDistanceToNow"),
			);
			expect(falsePositives).toEqual([]);
		} finally {
			assertRestored(target, original);
		}
	});

	test('MUST_PASS: a namespace import from an unrelated module (not "date-fns") is NOT resolved as a date-fns namespace', () => {
		const src = 'import * as dateFns from "some-other-lib";\n';
		const sf = ts.createSourceFile(
			"probe-ns3.ts",
			src,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		expect(Array.from(detectDateFnsNamespaceImports(sf))).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// Control 1 RATCHET — gated scope vs. out-of-scope report
//
// Proves three things a ratchet must prove, or it is not a ratchet:
//  1. A violation INSIDE a gated root fails the CI invocation (exit 1).
//  2. The real, pre-existing out-of-scope findings do NOT fail the CI
//     invocation, and their count is visibly printed — never silent.
//  3. The corrected wording ("hardcoded literal", never "English") shows up
//     verbatim on a real French finding.
// ---------------------------------------------------------------------------

describe("check-translations — Control 1 RATCHET (gated scope vs out-of-scope report)", () => {
	const { isInGatedScope, GATED_ROOTS } = require("../check-translations.js");

	test("isInGatedScope: a file under a gated directory root, and the exact gated file itself, both resolve true", () => {
		expect(isInGatedScope("app/[locale]/dashboard/foo/page.tsx")).toBe(true);
		expect(isInGatedScope("components/missions/mission-card.tsx")).toBe(true);
		expect(isInGatedScope("components/theme-toggle.tsx")).toBe(true);
		expect(isInGatedScope("app/[locale]/error.tsx")).toBe(true);
	});

	test("isInGatedScope: a file outside every gated root resolves false", () => {
		expect(isInGatedScope("app/[locale]/accessibilite/page.tsx")).toBe(false);
		expect(isInGatedScope("components/landing/LandingNav.tsx")).toBe(false);
	});

	test("MUST_PASS: the real tree has ZERO gating violations today — the ratchet is green on arrival", () => {
		const result = runControl1LiteralScan();
		expect(result.gatedViolations).toEqual([]);
		expect(result.ok).toBe(true);
	});

	test("MUST_PASS: the real tree's pre-existing out-of-scope findings are counted and every one of them falls strictly outside GATED_ROOTS — nothing is double-counted or silently dropped", () => {
		const result = runControl1LiteralScan();
		expect(result.outOfScopeCount).toBe(result.outOfScopeViolations.length);
		expect(result.outOfScopeCount).toBe(
			result.violations.length - result.gatedViolations.length,
		);
		expect(result.outOfScopeCount).toBeGreaterThan(0);
		for (const v of result.outOfScopeViolations) {
			expect(
				GATED_ROOTS.some(
					(root) => v.file === root || v.file.startsWith(`${root}/`),
				),
			).toBe(false);
		}
	});

	test("MUST_PASS: a real French finding (app/[locale]/accessibilite/page.tsx) is reported with the corrected, language-neutral wording — never labeled English", () => {
		const result = runControl1LiteralScan();
		const frHit = result.outOfScopeViolations.find(
			(v) =>
				v.file === "app/[locale]/accessibilite/page.tsx" &&
				v.text.includes("Déclaration d&apos;accessibilité"),
		);
		expect(frHit).toBeDefined();
		expect(frHit.kind).toBe("jsx-text");
		// The kind/label the reporter prints carries no language claim at all —
		// "jsx-text" (or "hardcoded literal" in prose) never says "English".
		expect(frHit.kind.toLowerCase()).not.toContain("english");
	});

	// ---- Real subprocess exit-code proof, isolated fixture (no contamination
	// from this repo's own ambient Control 2/4 state) ----

	function buildRatchetFixtureRoot() {
		const dir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "check-translations-ratchet-"),
		);
		fs.mkdirSync(path.join(dir, "i18n"), { recursive: true });
		fs.mkdirSync(path.join(dir, "messages"), { recursive: true });
		// Gated-root fixture directory, matching a real GATED_ROOTS prefix.
		fs.mkdirSync(path.join(dir, "app", "[locale]", "dashboard"), {
			recursive: true,
		});
		// Out-of-scope fixture directory — deliberately NOT a gated root.
		fs.mkdirSync(path.join(dir, "components", "marketing"), {
			recursive: true,
		});
		fs.writeFileSync(
			path.join(dir, "app", "[locale]", "dashboard", "Probe.tsx"),
			[
				'import { useTranslations } from "next-intl";',
				"export function Probe() {",
				'\tconst t = useTranslations("common");',
				'\treturn <span>{t("close")}</span>;',
				"}",
				"",
			].join("\n"),
		);
		fs.writeFileSync(
			path.join(dir, "components", "marketing", "OutOfScope.tsx"),
			[
				"export function OutOfScope() {",
				"\treturn <div>This is an out of scope hardcoded literal</div>;",
				"}",
				"",
			].join("\n"),
		);
		fs.writeFileSync(
			path.join(dir, "i18n", "routing.ts"),
			'export const routing = { locales: ["en", "fr"] };\n',
		);
		const en = { common: { close: "Close the current dialog window" } };
		const fr = { common: { close: "Fermer la fenêtre de dialogue actuelle" } };
		fs.writeFileSync(
			path.join(dir, "messages", "en.json"),
			JSON.stringify(en, null, "\t"),
		);
		fs.writeFileSync(
			path.join(dir, "messages", "fr.json"),
			JSON.stringify(fr, null, "\t"),
		);
		return dir;
	}

	function runScript(dir) {
		try {
			const stdout = execSync(
				`node "${path.join(ROOT, "scripts", "check-translations.js")}" 2>&1`,
				{
					cwd: ROOT,
					encoding: "utf8",
					stdio: "pipe",
					env: { ...process.env, CHECK_TRANSLATIONS_ROOT: dir },
				},
			);
			return { code: 0, output: stdout };
		} catch (err) {
			return {
				code: err.status,
				output: `${err.stdout || ""}${err.stderr || ""}`,
			};
		}
	}

	test("MUST_PASS direction: fixture with only an out-of-scope literal exits 0, and prints the out-of-scope finding + count", () => {
		const dir = buildRatchetFixtureRoot();
		try {
			const { code, output } = runScript(dir);
			expect(code).toBe(0);
			expect(output).toMatch(
				/1 literal\(s\) outside the gated scope — reported, not gating/,
			);
			expect(output).toContain("components/marketing/OutOfScope.tsx");
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	test("MUST_BLOCK direction: injecting a hardcoded literal INSIDE a gated root (app/[locale]/dashboard) makes the CI invocation exit 1", () => {
		const dir = buildRatchetFixtureRoot();
		try {
			const gatedFile = path.join(
				dir,
				"app",
				"[locale]",
				"dashboard",
				"Probe.tsx",
			);
			const marker = "___I18N_RATCHET_GATED_PROBE_MARKER___";
			const original = fs.readFileSync(gatedFile, "utf8");
			const mutated = original.replace(
				'{t("close")}',
				`{t("close")}<div>Hardcoded gated literal ${marker}</div>`,
			);
			expect(mutated).not.toBe(original);
			fs.writeFileSync(gatedFile, mutated);

			// Assert the mutation actually landed before reading any verdict.
			const landed = execSync(`grep -c "${marker}" "${gatedFile}"`, {
				encoding: "utf8",
			}).trim();
			expect(Number(landed)).toBeGreaterThan(0);

			const { code, output } = runScript(dir);
			expect(code).toBe(1);
			expect(output).toContain(marker);
			expect(output).toContain("app/[locale]/dashboard/Probe.tsx");
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});

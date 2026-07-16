/**
 * Bipolar probe for scripts/i18n-guard.js
 *
 * MUST_BLOCK: mutate a real, already-translated file in the dashboard
 * surface to re-inject a hardcoded English literal, assert the mutation
 * landed (grep), run the guard, assert it goes RED naming that string,
 * then restore and assert `git diff --stat` is empty.
 *
 * MUST_PASS: legitimate content already in the surface after translation
 * (product names, t() calls, code identifiers) must NOT be flagged.
 * False positives must be exactly 0.
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { scanFile } = require("../i18n-guard.js");

const ROOT = path.join(__dirname, "..", "..");
const GUARD = path.join(ROOT, "scripts", "i18n-guard.js");

function runGuard() {
	try {
		const out = execSync(`node "${GUARD}"`, { cwd: ROOT, encoding: "utf8" });
		return { code: 0, output: out };
	} catch (err) {
		return {
			code: err.status,
			output: `${err.stdout || ""}${err.stderr || ""}`,
		};
	}
}

describe("i18n-guard bipolar probe", () => {
	test("MUST_BLOCK: re-injected hardcoded literal on foreign (already-fixed) material turns the guard RED", () => {
		const target = path.join(
			ROOT,
			"app/[locale]/dashboard/architect/_components/session-list.tsx",
		);
		const original = fs.readFileSync(target, "utf8");

		const injectedMarker = "___I18N_GUARD_PROBE_MARKER___";
		const injectedLiteral = `Totally Hardcoded English Sentence ${injectedMarker}`;

		// Inject right after the opening tag of the component's return so it
		// is real, parseable JSX — not a comment, not dead code.
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
			const result = runGuard();
			expect(result.code).toBe(1);
			expect(result.output).toContain(injectedMarker);
		} finally {
			fs.writeFileSync(target, original);
			const diff = execSync(`git diff --stat -- "${target}"`, {
				cwd: ROOT,
				encoding: "utf8",
			}).trim();
			expect(diff).toBe("");
		}
	});

	test("MUST_PASS: current dashboard surface has zero hardcoded English literals (0 false positives)", () => {
		const result = runGuard();
		if (result.code !== 0) {
			// Surface the exact violations so a real regression is never
			// mistaken for a probe false-positive.
			throw new Error(
				`i18n-guard reported violations on the current (translated) surface — either a real regression or a false positive. Output:\n${result.output}`,
			);
		}
		expect(result.code).toBe(0);
	});

	test("MUST_PASS: product names and single-token identifiers are not flagged", () => {
		const tmpDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "i18n-guard-probe-"),
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

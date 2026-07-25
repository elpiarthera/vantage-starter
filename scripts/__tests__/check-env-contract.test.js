/**
 * Bipolar probe for scripts/check-env-contract.mjs — the first-run gate
 * (T7). MUST_BLOCK proves the guard actually mordre: mutate a scratch COPY
 * of the real `.env.example` (never the live file — same isolation pattern
 * as `CHECK_TRANSLATIONS_ROOT` in check-translations.test.js, to avoid
 * racing other Jest workers reading this repo concurrently), assert the
 * mutation landed, run the real script against the scratch root via the
 * `ENV_CONTRACT_ROOT` override, assert it fails and NAMES the missing
 * variable, then assert the real, unmutated `.env.example` still passes.
 *
 * MUST_PASS proves the guard does not cry wolf on the real, fixed contract.
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "check-env-contract.mjs");
const REAL_ENV_EXAMPLE = path.join(ROOT, ".env.example");

function runContract(scratchRoot) {
	try {
		const stdout = execFileSync("node", [SCRIPT], {
			cwd: ROOT,
			encoding: "utf8",
			env: scratchRoot
				? { ...process.env, ENV_CONTRACT_ROOT: scratchRoot }
				: process.env,
		});
		return { code: 0, stdout, stderr: "" };
	} catch (error) {
		return {
			code: error.status,
			stdout: error.stdout ?? "",
			stderr: error.stderr ?? "",
		};
	}
}

// Builds an isolated scratch dir carrying a COPY of the real .env.example —
// never mutates the real file on disk.
function buildScratchRoot() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "env-contract-probe-"));
	const original = fs.readFileSync(REAL_ENV_EXAMPLE, "utf8");
	fs.writeFileSync(path.join(dir, ".env.example"), original);
	return { dir, original };
}

describe("check-env-contract — MUST_PASS (real, fixed contract)", () => {
	it("passes against the real, current .env.example with exit code 0", () => {
		const result = runContract();
		expect(result.code).toBe(0);
		expect(result.stdout).toMatch(/check-env-contract: OK/);
	});

	it("states the lower-bound caveat explicitly (never a silent 'clean')", () => {
		const result = runContract();
		expect(result.stdout).toMatch(/lower-bound/i);
		expect(result.stdout).toMatch(/blind spot by construction/);
	});
});

describe("check-env-contract — MUST_BLOCK (real mutation, scratch copy)", () => {
	it("RED: removing a documented, genuinely-read variable fails and NAMES it", () => {
		const { dir, original } = buildScratchRoot();
		try {
			// Real mutation: delete the OPENAI_API_KEY line from the scratch copy.
			const scratchFile = path.join(dir, ".env.example");
			const mutated = original
				.split("\n")
				.filter((line) => !line.startsWith("OPENAI_API_KEY="))
				.join("\n");
			fs.writeFileSync(scratchFile, mutated);

			// Assert the mutation actually landed before reading any verdict.
			const reread = fs.readFileSync(scratchFile, "utf8");
			expect(reread).not.toMatch(/^OPENAI_API_KEY=/m);
			expect(original).toMatch(/^OPENAI_API_KEY=/m); // sanity: it WAS there

			const result = runContract(dir);
			expect(result.code).toBe(1);
			expect(result.stderr).toMatch(/OPENAI_API_KEY/);
			expect(result.stderr).toMatch(/FAIL/);

			// The scratch copy is discarded, not "restored" — the real file was
			// never touched. Prove that explicitly.
			const realStillIntact = fs.readFileSync(REAL_ENV_EXAMPLE, "utf8");
			expect(realStillIntact).toBe(original);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	it("RED: a variable read by the app but entirely absent from the contract is named, not swallowed", () => {
		const { dir, original } = buildScratchRoot();
		try {
			const scratchFile = path.join(dir, ".env.example");
			// Simulate the pre-T7 state on this one variable: strip every line
			// mentioning NEXT_PUBLIC_SITE_URL (live line + comments), reproducing
			// the exact defect the T7 audit found on `main`.
			const mutated = original
				.split("\n")
				.filter((line) => !line.includes("NEXT_PUBLIC_SITE_URL"))
				.join("\n");
			fs.writeFileSync(scratchFile, mutated);

			expect(fs.readFileSync(scratchFile, "utf8")).not.toMatch(
				/NEXT_PUBLIC_SITE_URL/,
			);

			const result = runContract(dir);
			expect(result.code).toBe(1);
			expect(result.stderr).toMatch(/NEXT_PUBLIC_SITE_URL/);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});

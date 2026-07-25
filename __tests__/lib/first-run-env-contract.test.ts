/**
 * first-run-env-contract — the enforcing mechanism for `docs/first-run.md`:
 * keeps the environment contract true so a fresh fork never silently fails to
 * reach its first screen.
 *
 * The required set has ONE source: the `# @required` markers in `.env.example`.
 * `lib/env/requiredEnv.ts` parses that file; this test parses it again with an
 * INDEPENDENT method (a grep-equivalent regex over the raw bytes) and asserts
 * the two agree — the two-source-agreement property. No count is typed from
 * memory here either; both sides derive from the file.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	assertRequiredEnv,
	MissingRequiredEnvError,
	parseRequiredEnv,
	REQUIRED_FIRST_RUN_ENV,
} from "@/lib/env/requiredEnv";

const REPO_ROOT = path.resolve(__dirname, "../..");
const ENV_EXAMPLE = fs.readFileSync(
	path.join(REPO_ROOT, ".env.example"),
	"utf-8",
);

/**
 * Count `# @required` markers by a method independent of the module's parser:
 * a straight line scan for the marker token following a `NAME=` assignment.
 * This is the "second source" the agreement property reconciles against.
 */
function independentlyMarkedVars(): string[] {
	const found: string[] = [];
	for (const line of ENV_EXAMPLE.split(/\r?\n/)) {
		if (/#\s*@required\b/.test(line)) {
			const name = line.match(/^([A-Z0-9_]+)=/);
			if (name) {
				found.push(name[1]);
			}
		}
	}
	return found;
}

describe("REQUIRED_FIRST_RUN_ENV is DERIVED from .env.example, not hand-typed", () => {
	it("the module's derived set equals an independent parse of the same file (two-source agreement)", () => {
		const independent = independentlyMarkedVars();
		expect([...REQUIRED_FIRST_RUN_ENV].sort()).toEqual([...independent].sort());
	});

	it("derives exactly the five documented first-run variables", () => {
		// The NAMES are asserted (content, fixed by docs/first-run.md), the
		// COUNT is derived — proving the marker set matches the documented
		// "Required to reach the first screen" table.
		expect([...REQUIRED_FIRST_RUN_ENV].sort()).toEqual(
			[
				"CLERK_JWT_ISSUER_DOMAIN",
				"CLERK_SECRET_KEY",
				"NEXT_PUBLIC_CLERK_DOMAIN",
				"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
				"NEXT_PUBLIC_CONVEX_URL",
			].sort(),
		);
	});

	it("every derived required variable actually appears as a real assignment in .env.example", () => {
		for (const name of REQUIRED_FIRST_RUN_ENV) {
			expect(ENV_EXAMPLE).toMatch(new RegExp(`^${name}=`, "m"));
		}
	});
});

describe("assertRequiredEnv names exactly which required variable(s) are missing", () => {
	const fullEnv: Record<string, string> = Object.fromEntries(
		REQUIRED_FIRST_RUN_ENV.map((name) => [name, `test-value-${name}`]),
	);

	it("does not throw when every required variable is present", () => {
		expect(() => assertRequiredEnv(fullEnv)).not.toThrow();
	});

	it("throws MissingRequiredEnvError naming the single missing variable", () => {
		const target = "CLERK_JWT_ISSUER_DOMAIN";
		expect(REQUIRED_FIRST_RUN_ENV).toContain(target);
		const { [target]: _omitted, ...envMissingOne } = fullEnv;

		let caught: unknown;
		try {
			assertRequiredEnv(envMissingOne);
		} catch (err) {
			caught = err;
		}

		expect(caught).toBeInstanceOf(MissingRequiredEnvError);
		expect(
			(caught as InstanceType<typeof MissingRequiredEnvError>).missing,
		).toEqual([target]);
		expect((caught as Error).message).toContain(target);
	});

	it("throws naming ALL missing variables, not just the first", () => {
		const present = REQUIRED_FIRST_RUN_ENV.slice(0, -2);
		const missing = REQUIRED_FIRST_RUN_ENV.slice(-2);
		const partialEnv = Object.fromEntries(
			present.map((name) => [name, `test-value-${name}`]),
		);

		let caught: unknown;
		try {
			assertRequiredEnv(partialEnv);
		} catch (err) {
			caught = err;
		}

		expect(caught).toBeInstanceOf(MissingRequiredEnvError);
		expect(
			(caught as InstanceType<typeof MissingRequiredEnvError>).missing.sort(),
		).toEqual([...missing].sort());
	});

	it("treats an empty string the same as absent (a blanked .env.local line)", () => {
		const envBlanked = { ...fullEnv, CLERK_SECRET_KEY: "" };
		let caught: unknown;
		try {
			assertRequiredEnv(envBlanked);
		} catch (err) {
			caught = err;
		}
		expect(caught).toBeInstanceOf(MissingRequiredEnvError);
		expect(
			(caught as InstanceType<typeof MissingRequiredEnvError>).missing,
		).toEqual(["CLERK_SECRET_KEY"]);
	});
});

describe("narrow-mutation proof: dropping ONE @required marker reddens the contract naming exactly that var", () => {
	it("removing a marker from an in-memory COPY drops precisely that var from the derived set (repo file never touched)", () => {
		const target = "CLERK_JWT_ISSUER_DOMAIN";
		const original = ENV_EXAMPLE;
		expect(parseRequiredEnv(original)).toContain(target);

		// Strip the marker from that one line only — in memory.
		const mutated = original.replace(
			new RegExp(`^(${target}=.*?)\\s*#\\s*@required\\b.*$`, "m"),
			"$1",
		);
		expect(mutated).not.toBe(original);

		const derivedAfter = parseRequiredEnv(mutated);
		expect(derivedAfter).not.toContain(target);
		// Every OTHER required var survives — the mutation is surgical.
		for (const name of REQUIRED_FIRST_RUN_ENV) {
			if (name !== target) {
				expect(derivedAfter).toContain(name);
			}
		}

		// Restoration proof: the real file on disk was never touched.
		const stillOnDisk = fs.readFileSync(
			path.join(REPO_ROOT, ".env.example"),
			"utf-8",
		);
		expect(stillOnDisk).toBe(original);
	});
});

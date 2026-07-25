/**
 * first-run-env-contract — the enforcing mechanism promised by
 * `docs/first-run.md` ("The enforcing test (to be built)"): keeps the
 * documented environment contract true so a fresh fork never silently
 * fails to reach its first screen.
 *
 * Two things are checked, both against real artifacts, never by eye:
 *
 *   1. Every variable in `REQUIRED_FIRST_RUN_ENV` (lib/env/requiredEnv.ts,
 *      the single declared list — see docs/first-run.md "Required to reach
 *      the first screen") is documented in `.env.example`, so a forker who
 *      copies it has a line for each one.
 *   2. `assertRequiredEnv` throws `MissingRequiredEnvError`, NAMING exactly
 *      which required variable(s) are absent, rather than the app crashing
 *      obscurely somewhere downstream. Proven both generically and via a
 *      narrow, single-variable mutation with a landed/restored assertion.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	assertRequiredEnv,
	MissingRequiredEnvError,
	REQUIRED_FIRST_RUN_ENV,
} from "@/lib/env/requiredEnv";

const REPO_ROOT = path.resolve(__dirname, "../..");

/** Every variable name declared in `.env.example` — derived, never retyped. */
function documentedEnvVarNames(): string[] {
	const content = fs.readFileSync(path.join(REPO_ROOT, ".env.example"), "utf-8");
	const names = new Set<string>();
	for (const match of content.matchAll(/^([A-Z0-9_]+)=/gm)) {
		names.add(match[1]);
	}
	return [...names];
}

describe("REQUIRED_FIRST_RUN_ENV is fully documented in .env.example", () => {
	it("has exactly the 5 required-to-reach-first-screen variables from docs/first-run.md", () => {
		// Sanity check on the declared list itself — proves this test tracks
		// the contract in docs/first-run.md rather than an independently
		// drifted count.
		expect(REQUIRED_FIRST_RUN_ENV.length).toBe(5);
	});

	it("every required variable appears in .env.example", () => {
		const documented = documentedEnvVarNames();
		const undocumented = REQUIRED_FIRST_RUN_ENV.filter(
			(name) => !documented.includes(name),
		);
		expect(undocumented).toEqual([]);
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
		expect((caught as InstanceType<typeof MissingRequiredEnvError>).missing).toEqual([
			target,
		]);
		expect((caught as Error).message).toContain(target);
	});

	it("throws naming ALL missing variables, not just the first", () => {
		const envMissingTwo = { ...fullEnv };
		delete envMissingTwo.NEXT_PUBLIC_CONVEX_URL;
		delete envMissingTwo.NEXT_PUBLIC_CLERK_DOMAIN;

		let caught: unknown;
		try {
			assertRequiredEnv(envMissingTwo);
		} catch (err) {
			caught = err;
		}

		expect(caught).toBeInstanceOf(MissingRequiredEnvError);
		expect((caught as InstanceType<typeof MissingRequiredEnvError>).missing).toEqual([
			"NEXT_PUBLIC_CONVEX_URL",
			"NEXT_PUBLIC_CLERK_DOMAIN",
		]);
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
		expect((caught as InstanceType<typeof MissingRequiredEnvError>).missing).toEqual([
			"CLERK_SECRET_KEY",
		]);
	});
});

describe("narrow-mutation proof: removing ONE required name from .env.example reddens the documentation check naming exactly that var", () => {
	it("the documentation check fails naming precisely the removed variable, against a mutated COPY of .env.example content (repo file never touched)", () => {
		const original = fs.readFileSync(path.join(REPO_ROOT, ".env.example"), "utf-8");
		const target = "CLERK_JWT_ISSUER_DOMAIN";
		expect(original).toMatch(new RegExp(`^${target}=`, "m"));

		// Mutate an in-memory copy only — never write to the repo file.
		const mutated = original.replace(new RegExp(`^${target}=.*$`, "m"), "");
		expect(mutated).not.toMatch(new RegExp(`^${target}=`, "m"));

		const documentedAfterMutation = new Set<string>();
		for (const match of mutated.matchAll(/^([A-Z0-9_]+)=/gm)) {
			documentedAfterMutation.add(match[1]);
		}
		const undocumented = REQUIRED_FIRST_RUN_ENV.filter(
			(name) => !documentedAfterMutation.has(name),
		);

		expect(undocumented).toEqual([target]);

		// Restoration proof: the real file on disk was never touched.
		const stillOnDisk = fs.readFileSync(path.join(REPO_ROOT, ".env.example"), "utf-8");
		expect(stillOnDisk).toBe(original);
	});
});

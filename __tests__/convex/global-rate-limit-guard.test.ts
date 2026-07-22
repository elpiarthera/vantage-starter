/// <reference types="vite/client" />
/**
 * Shared guard closing the class of defect that shipped twice
 * (`contactSubmissions.create`, `issueReports.submit`): a public write path
 * declares a global rate-limit bucket in `convex/ratelimit.ts`, the check is
 * correct on the day it lands, and no test ever calls it 31 times — so a
 * reviewer deleting the `if (!global.ok) throw ...` line stays green.
 *
 * `.claude/rules/derive-never-type.md`: the set of paths this guard checks
 * is DERIVED from `convex/ratelimit.ts` + the `convex/**\/*.ts` source, never
 * a hand-typed list of file names. A brand-new public mutation/action that
 * declares a `*Global` bucket next month is picked up automatically, with
 * zero edits to this file — that is the entire point of the exercise.
 *
 * What is derived, and how:
 *  1. Every rate-limit key ending in "Global" is read out of the
 *     `RateLimiter({ ... })` config object literal in `convex/ratelimit.ts`
 *     (regex over the source, not a copy of the object — the object itself
 *     is never exported, only the constructed `RateLimiter` instance is).
 *  2. For each such key, the ONE call site `rateLimiter.limit(ctx, "<key>",
 *     ...)` is located by scanning every file under `convex/` (excluding
 *     `_generated/` and `ratelimit.ts` itself). Zero or more-than-one call
 *     sites fails the guard LOUDLY (fail-closed, never a silent skip) —
 *     `.claude/rules/derive-never-type.md` bans a silent "return []" on an
 *     unmatched case.
 *  3. The exported function surrounding that call site (the nearest
 *     preceding `export const NAME = mutation(` / `= action(`) gives the
 *     Convex `api.<module>.<name>` reference to call.
 *  4. The function's OWN argument validator — read via the Convex-provided
 *     `.exportArgs()` on the raw (non-`api`) export, never retyped here —
 *     drives which fields to fill: every required `v.string()` field gets a
 *     fresh unique token per call, and any field literally named `email`
 *     (case-insensitive) is formatted as a valid, per-call-unique email,
 *     because `isValidEmail` gates every public path in this repo today
 *     (`lib/validation/email.ts`). This is a GENERAL, repo-wide convention,
 *     not a per-path fixture list.
 *  5. The bucket's own declared `capacity` (also read from
 *     `convex/ratelimit.ts`, never retyped) tells the guard how many
 *     DISTINCT-identity calls must succeed before the next one is expected
 *     to be refused.
 *
 * If a future global-bucket-declaring path takes a shape this guard cannot
 * fill generically (e.g. a required non-string argument), the guard throws
 * a named, loud error identifying exactly what it could not derive — never
 * a silent pass.
 */

import fs from "node:fs";
import path from "node:path";
import type { FunctionReference } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
// No public subpath export for the ratelimiter component's internal schema —
// same pattern as __tests__/convex/contactSubmissions.test.ts.
import ratelimiterSchema from "../../node_modules/@convex-dev/ratelimiter/dist/esm/component/schema.js";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

const ratelimiterModules = import.meta.glob(
	"../../node_modules/@convex-dev/ratelimiter/dist/esm/component/**/*.js",
);

function makeT() {
	const t = convexTest(schema, modules);
	t.registerComponent("ratelimiter", ratelimiterSchema, ratelimiterModules);
	return t;
}

const CONVEX_DIR = path.resolve(__dirname, "../../convex");
const RATELIMIT_SOURCE_PATH = path.join(CONVEX_DIR, "ratelimit.ts");

/** Every `.ts` file under `convex/`, excluding `_generated/` and itself. */
function listConvexSourceFiles(): string[] {
	const entries = fs.readdirSync(CONVEX_DIR, {
		recursive: true,
		withFileTypes: true,
	});
	const files: string[] = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
		const dir =
			(entry as unknown as { parentPath?: string; path?: string }).parentPath ??
			(entry as unknown as { path: string }).path;
		const full = path.join(dir, entry.name);
		if (full.includes(`${path.sep}_generated${path.sep}`)) continue;
		if (full === RATELIMIT_SOURCE_PATH) continue;
		files.push(full);
	}
	return files;
}

/** Every rate-limit key declared in `convex/ratelimit.ts` that ends in "Global", with its declared capacity. */
function deriveGlobalBuckets(): Array<{ key: string; capacity: number }> {
	const source = fs.readFileSync(RATELIMIT_SOURCE_PATH, "utf8");
	// Matches `keyName: {` at the start of a rate-limit entry inside the
	// `RateLimiter({ ... })` config object.
	const keyPattern = /(\w+):\s*\{\s*kind:\s*"token bucket"/g;
	const keys: string[] = [];
	for (const m of source.matchAll(keyPattern)) {
		keys.push(m[1]);
	}
	const globalKeys = keys.filter((k) => k.endsWith("Global"));
	if (globalKeys.length === 0) {
		throw new Error(
			'global-rate-limit-guard: derived ZERO keys ending in "Global" from ' +
				"convex/ratelimit.ts. Either the naming convention changed (update " +
				"the regex above) or every global bucket was removed — fail loudly " +
				"rather than silently passing with nothing checked.",
		);
	}
	return globalKeys.map((key) => {
		const entryMatch = source.match(
			new RegExp(`${key}:\\s*\\{[^}]*capacity:\\s*(\\d+)`),
		);
		if (!entryMatch) {
			throw new Error(
				`global-rate-limit-guard: could not derive a "capacity" for ` +
					`declared global bucket "${key}" — the entry shape in ` +
					`convex/ratelimit.ts no longer matches what this guard expects.`,
			);
		}
		return { key, capacity: Number(entryMatch[1]) };
	});
}

type DerivedCallSite = {
	globalKey: string;
	capacity: number;
	filePath: string;
	moduleRef: string; // dotted module path under convex/, e.g. "issueReports"
	exportName: string;
	kind: "mutation" | "action";
};

/**
 * For one global bucket key, find the exactly-one call site
 * `rateLimiter.limit(ctx, "<key>", ...)` under convex/, and the exported
 * mutation/action wrapping it.
 */
function deriveCallSite(globalKey: string, capacity: number): DerivedCallSite {
	const files = listConvexSourceFiles();
	const callPattern = new RegExp(
		`rateLimiter\\.limit\\(\\s*ctx\\s*,\\s*["'\`]${globalKey}["'\`]`,
	);
	const hits: Array<{ filePath: string; index: number; source: string }> = [];
	for (const filePath of files) {
		const source = fs.readFileSync(filePath, "utf8");
		const match = callPattern.exec(source);
		if (match) {
			hits.push({ filePath, index: match.index, source });
		}
	}
	if (hits.length === 0) {
		throw new Error(
			`global-rate-limit-guard: global bucket "${globalKey}" is declared ` +
				`in convex/ratelimit.ts but NO call site rateLimiter.limit(ctx, ` +
				`"${globalKey}", ...) exists anywhere under convex/. A declared, ` +
				`unenforced bucket is exactly the defect class this guard exists ` +
				`to close — fail loudly rather than silently passing.`,
		);
	}
	if (hits.length > 1) {
		throw new Error(
			`global-rate-limit-guard: global bucket "${globalKey}" has ` +
				`${hits.length} call sites (${hits.map((h) => h.filePath).join(", ")}) ` +
				`— this guard only knows how to derive ONE public entry point per ` +
				`bucket. Narrow the bucket to one call site, or extend this guard.`,
		);
	}
	const { filePath, index, source } = hits[0];

	// Nearest preceding `export const NAME = mutation(` / `= action(`.
	const exportPattern = /export const (\w+)\s*=\s*(mutation|action)\s*\(/g;
	let lastMatch: RegExpMatchArray | null = null;
	for (const m of source.matchAll(exportPattern)) {
		if (m.index !== undefined && m.index < index) {
			lastMatch = m;
		} else {
			break;
		}
	}
	if (!lastMatch) {
		throw new Error(
			`global-rate-limit-guard: found the call site for "${globalKey}" in ` +
				`${filePath} but could not derive the surrounding exported ` +
				`mutation/action (no preceding "export const NAME = mutation(" / ` +
				`"= action(" found).`,
		);
	}

	const relative = path
		.relative(CONVEX_DIR, filePath)
		.replace(/\.ts$/, "")
		.split(path.sep)
		.join(".");

	return {
		globalKey,
		capacity,
		filePath,
		moduleRef: relative,
		exportName: lastMatch[1],
		kind: lastMatch[2] as "mutation" | "action",
	};
}

/** Validator JSON shape emitted by Convex's `.exportArgs()` (`v.object({...}).json`). */
type ArgsJson = {
	type: "object";
	value: Record<string, { fieldType: { type: string }; optional: boolean }>;
};

/**
 * Load the co-located, non-test fixture a public path declaring a global
 * bucket is REQUIRED to ship: `__tests__/convex/fixtures/<moduleRef>.ts`
 * exporting `VALID_ARGS`. This is deliberately NOT a hand-maintained map
 * inside this guard — it is one small file per path, discovered by a fixed
 * naming convention derived from `moduleRef`, so the guard itself never
 * needs an edit when a new path is added. Some fields (e.g. an urgency or
 * category value validated against a declared mapping table, not merely
 * `v.string()`) cannot be filled generically from the args validator alone
 * — the fixture is the one place domain-valid values are allowed to live.
 *
 * Missing fixture -> loud, named failure. Never a silent skip.
 */
async function loadValidArgsFixture(
	moduleRef: string,
	exportName: string,
): Promise<Record<string, string>> {
	try {
		const fixtureModule: { VALID_ARGS: Record<string, string> } = await import(
			/* @vite-ignore */ `./fixtures/${moduleRef}.ts`
		);
		if (!fixtureModule.VALID_ARGS) {
			throw new Error("no VALID_ARGS export");
		}
		return fixtureModule.VALID_ARGS;
	} catch (_error) {
		throw new Error(
			`global-rate-limit-guard: api.${moduleRef}.${exportName} declares a ` +
				`global rate-limit bucket but has no ` +
				`__tests__/convex/fixtures/${moduleRef}.ts exporting VALID_ARGS. ` +
				`Add one (domain-valid args for this exact mutation/action) — this ` +
				`guard cannot call an arbitrary public path without knowing what a ` +
				`valid submission looks like, and refuses to guess rather than pass ` +
				`silently unchecked.`,
		);
	}
}

/**
 * Build ONE set of args for a call, starting from the path's own
 * domain-valid fixture and overriding ONLY the field(s) that this guard can
 * generically identify as the per-identity rate-limit key — any required
 * `v.string()` field named `email` (case-insensitive), the one convention
 * every public path with a global bucket in this repo shares today
 * (`lib/validation/email.ts` gates every one of them). Every other field is
 * left exactly as the fixture declares it, so enum-like values validated
 * against a declared mapping (e.g. `urgency`, `category`) stay valid.
 */
function buildArgs(
	validArgs: Record<string, string>,
	exportArgsJson: ArgsJson,
	unique: string,
): Record<string, string> {
	const args = { ...validArgs };
	for (const [field, def] of Object.entries(exportArgsJson.value)) {
		if (def.optional) continue;
		if (/email/i.test(field)) {
			args[field] = `guard-${unique}@example.com`;
		}
	}
	return args;
}

describe("global rate-limit guard (derived from convex/ratelimit.ts)", () => {
	const buckets = deriveGlobalBuckets();
	const callSites = buckets.map(({ key, capacity }) =>
		deriveCallSite(key, capacity),
	);

	it("derived at least one public path declaring a global bucket", () => {
		expect(callSites.length).toBeGreaterThan(0);
	});

	for (const site of callSites) {
		it(`${site.moduleRef}.${site.exportName} (bucket "${site.globalKey}") stops a rotating-identity attacker at exactly ${site.capacity} calls`, async () => {
			// Dynamic import path is derived at test time from
			// convex/ratelimit.ts + the call site scan, not known statically —
			// this is the one boundary a generic guard cannot avoid crossing.
			const rawModule: Record<string, { exportArgs: () => string }> =
				await import(/* @vite-ignore */ `../../convex/${site.moduleRef}.ts`);
			const registered = rawModule[site.exportName];
			if (!registered || typeof registered.exportArgs !== "function") {
				throw new Error(
					`global-rate-limit-guard: ${site.moduleRef}.${site.exportName} ` +
						`does not expose exportArgs() — expected a Convex-registered ` +
						`mutation/action.`,
				);
			}
			const argsJson = JSON.parse(registered.exportArgs()) as ArgsJson;

			// Derive the api.* reference by walking the dotted module path —
			// same file-based routing convex/_generated/ai/guidelines.md
			// documents ("a public function h in convex/messages/access.ts has
			// reference api.messages.access.h"). The api object's shape is only
			// known statically per-module; this walk is generic over whichever
			// module the scan derived.
			let ref: Record<string, unknown> = api as unknown as Record<
				string,
				unknown
			>;
			for (const part of site.moduleRef.split(".")) {
				ref = ref[part] as Record<string, unknown>;
			}
			const fnRef = ref[site.exportName] as
				| FunctionReference<"mutation" | "action", "public">
				| undefined;
			if (!fnRef) {
				throw new Error(
					`global-rate-limit-guard: could not resolve api.${site.moduleRef}.${site.exportName} ` +
						`from convex/_generated/api — regenerate the Convex codegen.`,
				);
			}

			const validArgs = await loadValidArgsFixture(
				site.moduleRef,
				site.exportName,
			);

			const t = makeT();
			const call = (args: Record<string, string>) =>
				site.kind === "mutation"
					? t.mutation(fnRef as FunctionReference<"mutation", "public">, args)
					: t.action(fnRef as FunctionReference<"action", "public">, args);

			for (let i = 0; i < site.capacity; i++) {
				await call(buildArgs(validArgs, argsJson, `ok-${i}-${site.globalKey}`));
			}

			await expect(
				call(
					buildArgs(
						validArgs,
						argsJson,
						`over-${site.capacity}-${site.globalKey}`,
					),
				),
			).rejects.toThrow(/rate limit/i);
		});
	}
});

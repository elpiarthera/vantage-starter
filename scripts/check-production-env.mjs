#!/usr/bin/env node
/**
 * check-production-env — fails when a production-scoped environment variable
 * names a DEVELOPMENT backend deployment.
 *
 * Genesis: analysis/t8-environment-audit.md found all three Vercel
 * environments (production, preview, development) pointing at the same
 * Convex deployment, and that deployment is `dev` — confirmed not by the
 * `dev:` prefix alone but by `npx convex deployments` (the service's own
 * answer). Repointing the wiring is a pending product decision (README/
 * provisioning) — this script is the independent half: a rule that fails
 * loudly the next time this happens, by accident or otherwise, whether or
 * not that decision has been made yet.
 *
 * DERIVE, NEVER TYPE (see .claude/rules/derive-never-type.md):
 * this script encodes no deployment name, project slug, or "known-good"
 * value. It encodes two things Convex's own tooling writes, not things a
 * human typed about this project:
 *
 *   1. `CONVEX_DEPLOYMENT` has the shape `<kind>:<name>` where `<kind>` is
 *      written by the Convex CLI itself (`dev`, `preview`, or `prod`) —
 *      see `npx convex deployments` in the audit, which independently
 *      confirms the prefix against the service rather than trusting the
 *      string blindly. This script trusts the shape convention (it is the
 *      CLI's own encoding, not project-specific knowledge) and — where a
 *      matching `NEXT_PUBLIC_CONVEX_URL` names the SAME deployment slug —
 *      cross-checks the two variables agree, so a hand-edited URL that
 *      drifts from `CONVEX_DEPLOYMENT` is caught too.
 *   2. A Convex deployment URL has the shape
 *      `https://<slug>.convex.cloud`. The `<slug>` is opaque and never
 *      compared against a literal — only used to cross-reference against
 *      `CONVEX_DEPLOYMENT`'s slug.
 *
 * No project name, deployment slug, or org appears literally in this file.
 *
 * FAIL LOUD ON UNREADABLE (see .claude/rules/measurement-integrity.md):
 * an environment that yields ZERO recognizable Convex-deployment-shaped
 * variables is not "nothing to check" — it is a measurement failure, and
 * exits non-zero naming what could not be read. An absence of signal is
 * never rendered as "clean".
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 * it never calls `vercel` itself and never requires a Vercel or Convex
 * credential to run. It reads an environment handed to it — either the
 * current process environment, or a dotenv-shaped file passed via
 * `--file=<path>` (used for local/manual verification against a real
 * `vercel env pull` output, and for the mutation-proof below). Fetching
 * that file IS a credentialed operation (`vercel env pull`), but it is
 * performed by the operator invoking this script, not by the script.
 *
 * WIRING (where this is actually exercised):
 * `package.json` `prebuild` now runs this script with
 * `--scope="${VERCEL_ENV:-development}"` on every build. `VERCEL_ENV` is set
 * by the Vercel platform itself (never typed here) to exactly `production`,
 * `preview`, or `development` — so a REAL Vercel production build reads the
 * REAL production environment directly from `process.env` and enforces the
 * rule with zero credentials and zero network call. Locally, or in GitHub
 * Actions (which has no Vercel/Convex credentials — see the top of
 * `.github/workflows/quality.yml`), `VERCEL_ENV` is unset, `--scope`
 * defaults to `development`, and the rule does not apply — this is the
 * environment CI/local dev actually has, not the one this rule polices.
 * A GitHub Actions job cannot exercise this rule honestly today because it
 * cannot see Vercel's production environment without a credential this repo
 * does not provision (see constraint in the task brief) — so the honest
 * exercised home is Vercel's own build, not a workflow file.
 *
 * Usage:
 *   node scripts/check-production-env.mjs --scope=production [--file=<path>]
 *
 * Exit codes:
 *   0 — every production-scoped Convex-deployment-shaped variable names a
 *       non-dev deployment (or scope is not "production": the rule is
 *       scoped to production on purpose, see analysis/t8-environment-audit.md
 *       "Independent of that decision").
 *   1 — at least one production-scoped variable names a dev deployment.
 *       Every offending variable is named, with its value.
 *   2 — could not measure: the given environment yielded no recognizable
 *       Convex-deployment-shaped variable at all, or a requested file could
 *       not be read.
 */

import { readFileSync } from "node:fs";

// The Convex CLI's own deployment-kind vocabulary — this is Convex's
// documented set of kinds (`npx convex deployments` reports one of these
// per deployment), not a value typed about THIS project. A generic
// `\w+:\w+` shape is too permissive: an unrelated variable such as
// `TURBO_CACHE=remote:rw` matches a bare "word colon word" shape and would
// be misread as a deployment identity. Anchoring on Convex's own kind
// vocabulary closes that false-positive class.
const CONVEX_KINDS = ["dev", "preview", "prod"];
const DEPLOYMENT_KIND_SHAPE = new RegExp(
	`^(${CONVEX_KINDS.join("|")}):([a-z0-9][a-z0-9-]*)$`,
);
// Case-insensitive twin of the shape above. Used ONLY to tell "no identity here"
// apart from "an identity the CLI would never have written". Two states printing
// the same thing is the defect this guard exists to catch, so it must not commit
// that defect itself.
const DEPLOYMENT_KIND_SHAPE_LOOSE = new RegExp(
	`^(${CONVEX_KINDS.join("|")}):([a-z0-9][a-z0-9-]*)$`,
	"i",
);
const DEPLOYMENT_URL_SHAPE =
	/^https:\/\/([a-z0-9-]+)\.convex\.(cloud|site)\/?$/;

// Kinds the Convex CLI itself writes that are NOT production. "prod" is the
// only kind this rule accepts for a production-scoped variable.
const NON_PRODUCTION_KINDS = new Set(CONVEX_KINDS.filter((k) => k !== "prod"));

function parseDotenv(text) {
	const out = {};
	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const eq = line.indexOf("=");
		if (eq === -1) continue;
		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		out[key] = value;
	}
	return out;
}

function loadEnvironment(filePath) {
	if (!filePath) {
		return { source: "process.env", env: { ...process.env } };
	}
	let text;
	try {
		text = readFileSync(filePath, "utf8");
	} catch (err) {
		return { source: filePath, env: null, readError: err.message };
	}
	return { source: filePath, env: parseDotenv(text) };
}

/**
 * Scans a key/value environment for every variable whose VALUE (never its
 * NAME — see derive-never-type.md) matches a Convex-deployment-identity
 * shape, and resolves the "kind" it asserts.
 *
 * Returns:
 *   findings: [{ key, value, kind, via }]   — kind resolved, via = "prefix" | "cross-reference"
 *   unresolved: [{ key, value }]            — deployment-shaped URL whose kind
 *                                              could not be cross-referenced
 *                                              against any CONVEX_DEPLOYMENT
 *                                              in the same environment
 */
function scanForDeploymentIdentities(env) {
	const findings = [];
	const unresolved = [];
	const miscased = [];
	const slugToKind = new Map();

	// First pass — CONVEX_DEPLOYMENT-shaped values carry their kind directly
	// in the prefix the Convex CLI writes.
	for (const [key, value] of Object.entries(env)) {
		if (typeof value !== "string") continue;
		const m = value.match(DEPLOYMENT_KIND_SHAPE);
		if (m) {
			const [, kind, slug] = m;
			findings.push({ key, value, kind, via: "prefix" });
			slugToKind.set(slug, kind);
			continue;
		}
		// Shape recognised, case is not what the CLI writes. Reported as its own
		// refusal rather than normalised: the CLI only ever emits lowercase, so an
		// uppercase prefix means the value was TYPED BY HAND. Accepting it silently
		// would hide exactly the class this repository's doctrine names — a value a
		// tool could have derived, written by a human instead.
		if (DEPLOYMENT_KIND_SHAPE_LOOSE.test(value)) {
			miscased.push({ key, value });
		}
	}

	// Second pass — deployment URLs carry only the slug; resolve the kind by
	// cross-referencing the slug against what pass one already established,
	// never by comparing the slug itself against any typed value.
	for (const [key, value] of Object.entries(env)) {
		if (typeof value !== "string") continue;
		const m = value.match(DEPLOYMENT_URL_SHAPE);
		if (m) {
			const [, slug] = m;
			const kind = slugToKind.get(slug);
			if (kind) {
				findings.push({ key, value, kind, via: "cross-reference" });
			} else {
				unresolved.push({ key, value });
			}
		}
	}

	return { findings, unresolved, miscased };
}

function parseArgs(argv) {
	const args = { scope: null, file: null };
	for (const arg of argv) {
		if (arg.startsWith("--scope=")) args.scope = arg.slice("--scope=".length);
		else if (arg.startsWith("--file=")) args.file = arg.slice("--file=".length);
	}
	return args;
}

function main() {
	const { scope, file } = parseArgs(process.argv.slice(2));

	if (!scope) {
		console.error(
			"check-production-env: --scope=<production|preview|development> is required. " +
				"The rule is scoped to production on purpose (analysis/t8-environment-audit.md " +
				'"Independent of that decision") — refusing to guess which environment is being checked.',
		);
		process.exit(2);
	}

	// APPLICABILITY IS DECIDED BEFORE MEASURABILITY, and the order is the whole
	// point. This rule constrains PRODUCTION-scoped variables only. Outside that
	// scope there is nothing it could refuse, so "I found no deployment identity"
	// is not a measurement failure — there was no measurement owed.
	//
	// Deciding this AFTER the scan is what broke the build for everyone: prebuild
	// runs `--scope="${VERCEL_ENV:-development}"`, so a fresh clone of this
	// TEMPLATE — no Convex variables yet, by definition — hit COULD NOT MEASURE
	// and exited 2. A correct refusal, on a path where nothing was at stake,
	// reads as "this repository does not build". A gate a legitimate build
	// cannot satisfy gets bypassed, then disabled.
	//
	// This is a REORDER, never a downgrade: inside production scope, COULD NOT
	// MEASURE still fails with exit 2 below. Folding a refusal into a pass where
	// the rule DOES apply is the exact defect this script exists to catch, and
	// doing it here to quiet a red would be that defect wearing the fix's name.
	if (scope !== "production") {
		console.log(
			`check-production-env: scope=${scope} is not production-scoped — rule does not apply, ` +
				"nothing was measured because nothing was owed. " +
				"See analysis/t8-environment-audit.md for why this is scoped to production only.",
		);
		process.exit(0);
	}

	const { source, env, readError } = loadEnvironment(file);

	if (readError) {
		console.error(
			`check-production-env: COULD NOT MEASURE — failed to read environment file "${file}": ${readError}`,
		);
		console.error(
			"An unreadable environment is a measurement failure, not a pass.",
		);
		process.exit(2);
	}

	const { findings, unresolved, miscased } = scanForDeploymentIdentities(env);

	if (miscased.length > 0) {
		console.error(
			`check-production-env: COULD NOT MEASURE — ${miscased.length} variable(s) in "${source}" ` +
				"carry a deployment-identity SHAPE the CLI would never write " +
				"(the kind prefix is not lowercase), so their kind cannot be trusted:",
		);
		for (const mc of miscased) {
			console.error(`  - ${mc.key}=${mc.value}`);
		}
		console.error(
			"The CLI only emits lowercase prefixes. A different case means the value was " +
				"typed by hand — reported rather than normalised, because guessing what a " +
				"hand-typed value meant is how the wrong backend reaches production.",
		);
		process.exit(2);
	}

	if (findings.length === 0 && unresolved.length === 0) {
		console.error(
			`check-production-env: COULD NOT MEASURE — environment "${source}" (scope=${scope}) ` +
				"yielded zero variables shaped like a Convex deployment identity " +
				"(neither `<kind>:<name>` nor `https://<slug>.convex.cloud`). " +
				"Refusing to report clean on an environment where nothing was found.",
		);
		process.exit(2);
	}

	if (unresolved.length > 0) {
		console.error(
			`check-production-env: COULD NOT MEASURE — ${unresolved.length} deployment URL(s) in "${source}" ` +
				"could not be cross-referenced against any CONVEX_DEPLOYMENT in the same environment, " +
				"so their kind is unknown:",
		);
		for (const u of unresolved) {
			console.error(`  - ${u.key}=${u.value}`);
		}
		process.exit(2);
	}

	console.log(`check-production-env: scope=${scope} source=${source}`);
	for (const f of findings) {
		console.log(`  ${f.key}=${f.value} -> kind="${f.kind}" (via ${f.via})`);
	}

	const offenders = findings.filter((f) => NON_PRODUCTION_KINDS.has(f.kind));

	if (offenders.length > 0) {
		console.error("");
		console.error(
			`check-production-env: FAIL — ${offenders.length} production-scoped variable(s) name a development deployment:`,
		);
		for (const o of offenders) {
			console.error(
				`  - ${o.key}="${o.value}" names a "${o.kind}" deployment (not "prod")`,
			);
		}
		console.error(
			"See analysis/t8-environment-audit.md — this is the audit's finding, reproduced by an instrument.",
		);
		process.exit(1);
	}

	console.log("");
	console.log(
		`check-production-env: PASS — every production-scoped Convex deployment identity in "${source}" is a "prod" deployment.`,
	);
	process.exit(0);
}

main();

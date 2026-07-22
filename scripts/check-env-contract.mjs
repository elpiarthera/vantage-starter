#!/usr/bin/env node
/**
 * check-env-contract — the first-run gate: `.env.example` must document
 * every environment variable that is genuinely required for a stranger's
 * `git clone` → `pnpm dev` to reach a working first screen. Missing =
 * a blank page and no clue why, for someone who has never seen this repo.
 *
 * DERIVE, NEVER TYPE (see .claude/rules/derive-never-type.md): the set of
 * names actually read via `process.env.X` in this repo's own source is
 * derived by scanning the source tree, never hand-typed here — the exact
 * `git grep` used by the T7 audit, ported to Node so it runs in CI without
 * a shell pipeline.
 *
 * THE ONE THING THIS SCRIPT CANNOT DERIVE (and states rather than hides):
 * a small number of variables are read INSIDE a vendor SDK's own compiled
 * code (Clerk, Resend, Polar), never as `process.env.X` in OUR source. A
 * source-tree scan is structurally blind to that — grepping our own repo
 * cannot see into `node_modules`. Those names are listed explicitly below,
 * each with the SDK file that reads them, so the exemption is visible and
 * traceable rather than a silent gap in the derivation.
 *
 * FAIL LOUD ON UNREADABLE (see .claude/rules/measurement-integrity.md):
 * every failure names the exact variable missing. No aggregate "contract
 * broken" message without a name attached.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ENV_CONTRACT_ROOT override — mirrors CHECK_TRANSLATIONS_ROOT
// (scripts/check-translations.js): lets a test point ONLY the
// `.env.example` read at a scratch copy, without mutating the real file on
// disk (avoids cross-worker races with other Jest suites reading this repo
// concurrently). The derived-names scan (`git grep` over the real source
// tree) is unaffected by this override — it always reads the real repo,
// since that is the ground truth being checked against.
const ROOT = process.env.ENV_CONTRACT_ROOT || path.join(__dirname, "..");
const REPO_ROOT = path.join(__dirname, "..");

// Same directories as the T7 audit sweep — the surface a running app can
// actually execute code from. node_modules and docs/ are intentionally
// excluded: docs may cite vendor env vars in prose without requiring them.
const SCAN_DIRS = [
	"app",
	"components",
	"convex",
	"lib",
	"hooks",
	"providers",
	"middleware.ts",
	"scripts",
	"src",
	"i18n",
];

/**
 * Names read only inside a vendor SDK's compiled code, never as
 * `process.env.X` in this repo's own source — so a source-tree grep is
 * structurally blind to them. Each entry states exactly which SDK file
 * proved the read, so this list is a traceable exemption, not a silent one.
 */
const SDK_INTERNAL_REQUIRED = [
	{
		name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
		provenance:
			"@clerk/nextjs/dist/{cjs,esm}/utils/mergeNextClerkPropsWithEnv.js",
	},
	{
		name: "RESEND_API_KEY",
		provenance:
			"resend/dist/index.{cjs,mjs} + @convex-dev/resend/dist/client/index.js " +
			"(both default apiKey to process.env.RESEND_API_KEY) — Convex-dashboard-set, " +
			"not .env.local; a missing key degrades gracefully (email send is try/caught " +
			"in convex webhook handlers) so it is documented OPTIONAL in .env.example, " +
			"never blocks the first screen.",
		optional: true,
	},
];

function deriveReadNames() {
	const out = execFileSync(
		"git",
		["grep", "-hoE", "process\\.env\\.[A-Z0-9_]+", "--", ...SCAN_DIRS],
		{ cwd: REPO_ROOT, encoding: "utf8" },
	);
	const names = new Set();
	for (const line of out.split("\n")) {
		const m = line.match(/process\.env\.([A-Z0-9_]+)/);
		if (m) names.add(m[1]);
	}
	return names;
}

function deriveDocumentedNames() {
	const text = readFileSync(path.join(ROOT, ".env.example"), "utf8");
	const names = new Set();
	for (const line of text.split("\n")) {
		// Matches both live (KEY=value) and commented-optional (# KEY=value) lines.
		const m = line.match(/^#?\s*([A-Z0-9_]+)=/);
		if (m) names.add(m[1]);
	}
	return names;
}

// Names that are read via process.env in OUR source, but are tooling-only
// (test harness / build scripts) — never needed by a stranger running the
// app locally, so their ABSENCE from .env.example is correct, not a gap.
// Each is traced to its sole reader.
const TOOLING_ONLY = new Set([
	"CHECK_TRANSLATIONS_ROOT", // scripts/check-translations.js test-harness override only
	"NODE_ENV", // set by the Node/Next.js toolchain itself, never hand-typed by a user
]);

// Names read via process.env in OUR source that are confirmed DEAD (residue
// from the video-product this repo was forked from, or stale hardcoded
// duplicates) — see T7 report for the full per-name evidence. Listed here
// so the contract does not re-demand documentation for something nobody
// reads for a genuine reason, while keeping the exemption visible and named
// rather than silently absent.
const CONFIRMED_DEAD = new Set([
	"BROWSERBASE_API_KEY", // lib/audio-processing.ts, lib/rendi-video-processing.ts — Browserbase banned fleet-wide, residue
	"BROWSERBASE_PROJECT_ID", // same
	"RENDI_API_KEY", // lib/audio-processing.ts, lib/rendi-video-processing.ts — paid-vendor residue
	"FAL_KEY", // no @fal-ai package installed; zero live reads outside docs/agent examples
	"TOGETHER_API_KEY", // zero live reads anywhere in app/convex code
	"CONVEX_URL", // bare (non-NEXT_PUBLIC) form; only NEXT_PUBLIC_CONVEX_URL is read
	"NEXT_PUBLIC_CLERK_SIGN_IN_URL", // path is hardcoded via localizedAuthPath(), never env-driven
	"NEXT_PUBLIC_CLERK_SIGN_UP_URL", // same
	"NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL", // same
	"NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL", // same
]);

function main() {
	const derived = deriveReadNames();
	const documented = deriveDocumentedNames();

	const missing = [];

	for (const name of derived) {
		if (TOOLING_ONLY.has(name)) continue;
		if (CONFIRMED_DEAD.has(name)) continue;
		if (!documented.has(name)) missing.push(name);
	}

	for (const { name, optional } of SDK_INTERNAL_REQUIRED) {
		if (optional) continue;
		if (!documented.has(name)) missing.push(name);
	}

	if (missing.length > 0) {
		console.error(
			"check-env-contract: FAIL — the following variable(s) are read by the " +
				"running app but are NOT documented in .env.example. A stranger " +
				"cloning this repo has no way to know they are needed:\n" +
				missing.map((n) => `  - ${n}`).join("\n"),
		);
		process.exit(1);
	}

	console.log(
		`check-env-contract: OK — ${derived.size} derived name(s) + ` +
			`${SDK_INTERNAL_REQUIRED.length} SDK-internal name(s) reconciled against ` +
			`${documented.size} documented name(s) in .env.example. ` +
			"Lower-bound caveat: this sweep only sees process.env.X reads in this " +
			"repo's own source plus the explicitly traced SDK-internal reads above — " +
			"any UNTRACED vendor-internal read remains a blind spot by construction.",
	);
}

main();

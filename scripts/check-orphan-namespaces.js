#!/usr/bin/env node
/**
 * check-orphan-namespaces — the guard that ships WITH the namespace-deletion
 * family it protects.
 *
 * WHAT IT REFUSES: a top-level namespace in `messages/en.json` that NO tracked
 * `.ts`/`.tsx` file consumes. That is the exact shape of the 23 video-fork
 * namespaces deleted in the same commit that introduced this file: whole
 * namespaces nobody reads, invisible to every other gate — `tsc --noEmit` at 0,
 * jest 281/281, `check-translations.js` Controls 1-4 all PASS, `pnpm build`
 * exit 0. A relapse here was PROVEN invisible, and this repository is a seed
 * everyone forks: an emptied family without its guard reopens at every fork.
 *
 * WHAT IT REFUSES TO JUDGE — declared, not silent:
 *   - Anything below the top level. A namespace that IS consumed is not opened
 *     up key-by-key; `check-translations.js` Control 4 already resolves called
 *     keys against every locale, and Control 2 already proves parity. This
 *     guard answers exactly one question: does anyone read this namespace at
 *     all.
 *   - Any locale other than `en`. Control 2 gates the other six against `en`,
 *     so a namespace orphaned in `en` is orphaned in all seven by construction.
 *     Reading seven files to re-derive one answer would be a second source of
 *     truth for the same fact.
 *   - Free prose. Comments, documentation, CHANGELOG.md, markdown: never read.
 *     A namespace name quoted in a doc-comment explaining why it was deleted is
 *     not a consumer, and a guard that scans prose is either too lax or too
 *     zealous — the zealous one gets deleted within the week. Only structured
 *     reads: parsed JSON, and namespaces resolved off real AST bindings.
 *   - Consumption from anything git does not track. The inventory is
 *     `git ls-files`, so an untracked scratch file can never bless a namespace.
 *
 * DERIVED, NEVER TYPED (the repository's mother rule, `.claude/rules/
 * derive-never-type.md`): the namespace list is read out of `messages/en.json`
 * at run time; the file inventory is read out of `git ls-files` at run time;
 * the consumer resolution is the SAME resolver `check-translations.js` Control
 * 4 uses — imported, not copied. That resolver already handles the three call
 * shapes this codebase writes (`useTranslations("x")`, `getTranslations("x")`,
 * `getTranslations({ namespace: "x" })`); the third was added precisely because
 * a single-shape matcher missed seventeen real call sites. Writing a fourth
 * matcher here would re-open that exact hole.
 *
 * THREE STATES, NEVER TWO:
 *   exit 0 — every namespace resolved, every orphan accounted for
 *   exit 1 — an UNDECLARED orphan, or a DECLARED_ORPHANS entry that is no
 *            longer orphan (a stale declaration rots into an exemption)
 *   exit 2 — COULD NOT CHECK, naming what it failed to read. An unreadable
 *            catalog, an unavailable inventory, an unparseable file, or a
 *            binding whose namespace is not statically resolvable all land
 *            here. A namespace whose consumers cannot be resolved is NOT
 *            clean, it is unchecked — `if (nothing_found) return []` is a blind
 *            spot, not a safe default.
 *
 * Usage: node scripts/check-orphan-namespaces.js [--json]
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const {
	detectTranslationBindings,
	detectTranslationCalls,
} = require("./check-translations.js");

// Overridable for probe isolation only (the third-state probe needs to point
// the resolver at ground that does not exist, without touching the repo).
// Production runs never set this and get the real repository root.
const ROOT =
	process.env.CHECK_ORPHAN_NAMESPACES_ROOT || path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// DECLARED ORPHANS — a RATCHET BASELINE, not an amnesty.
//
// Empty by construction. The 40 namespaces declared here at this guard's
// introduction were the SAME retired video product as the 23 namespaces
// deleted in the commit that introduced the guard — their values said so
// verbatim ("Manage your video projects", "Share your video invitation with
// guests", scene/frame/narration/transition/voice vocabulary). Zero false
// positives were found among them. They were declared rather than deleted
// only because an acceptance criterion pinned the key count at 1987 — a
// number typed into a brief that then constrained the work instead of being
// derived FROM it, exactly the defect `.claude/rules/derive-never-type.md`
// exists to name. That pin was corrected, the 40 were re-derived off this
// same guard (not off the list below, which is authority-adjacent, never
// authority), confirmed zero-consumer, and deleted from all seven locales in
// the same commit. Key count is an OUTPUT of the deletion, never an input.
//
// THE LIST CANNOT ROT. An entry that stops being orphan (someone wires a
// consumer) is reported as a VIOLATION, exit 1, so any future declaration
// must be deleted rather than left standing as an unexamined exemption. The
// list can only shrink — it is empty now because there was nothing left with
// a live reason to keep.
// ---------------------------------------------------------------------------
const DECLARED_ORPHANS = {};

// ---------------------------------------------------------------------------
// Could-not-check: a single failure shape, always named.
// ---------------------------------------------------------------------------
function unchecked(what) {
	return { state: "unchecked", unreadable: what };
}

// Tracked source inventory — `git ls-files`, never a walked directory list.
// "No consumer anywhere in the TRACKED code" is the claim, so the claim's own
// definition of "tracked" is the only honest source. Git being unavailable, or
// the root not being a work tree, is an EVENT: it lands in exit 2, never in a
// clean bill of health.
function deriveTrackedSourceFiles() {
	if (!fs.existsSync(ROOT)) {
		return unchecked(`repository root does not exist: ${ROOT}`);
	}
	let out;
	try {
		out = execFileSync("git", ["ls-files", "-z", "*.ts", "*.tsx"], {
			cwd: ROOT,
			encoding: "utf8",
			maxBuffer: 32 * 1024 * 1024,
		});
	} catch (err) {
		return unchecked(
			`git ls-files failed in ${ROOT} — cannot enumerate tracked sources: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
	const files = out
		.split("\0")
		.filter(Boolean)
		.filter((f) => !f.endsWith(".d.ts"))
		// Convex codegen output: machine-written, never a translation consumer.
		.filter((f) => !f.startsWith("convex/_generated/"));
	if (files.length === 0) {
		return unchecked(
			`git ls-files returned 0 tracked .ts/.tsx files under ${ROOT} — refusing to certify a catalog against an empty inventory`,
		);
	}
	return { state: "ok", files };
}

// Top-level namespaces of the catalog — read out of the artifact, never typed.
function deriveNamespaces() {
	const filePath = path.join(ROOT, "messages", "en.json");
	if (!fs.existsSync(filePath)) {
		return unchecked(`messages/en.json not found at ${filePath}`);
	}
	let parsed;
	try {
		parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (err) {
		return unchecked(
			`messages/en.json failed to parse: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
	const namespaces = Object.keys(parsed);
	if (namespaces.length === 0) {
		return unchecked("messages/en.json declares 0 top-level namespaces");
	}
	return { state: "ok", namespaces };
}

// The first dotted segment of `a.b.c` is the top-level namespace it lives in.
function topLevelOf(dotted) {
	return dotted.split(".")[0];
}

// Resolves the set of top-level namespaces the tracked code actually reads,
// using check-translations.js's OWN resolver (imported, never re-implemented).
//
// Two binding shapes, both handled by that resolver:
//   - namespaced: `useTranslations("share_tab")` -> the namespace is the
//     binding itself, and no call site needs to be read.
//   - root:       `useTranslations()` / `getTranslations({ locale })` -> keys
//     are full dotted paths, so the namespace lives in each `t("<path>")` call
//     and the calls must be resolved too.
//
// Unresolvable is never silence:
//   - a binding with a non-literal namespace hides WHICH namespace it reads;
//   - a call through a ROOT binding whose key is not statically resolvable
//     hides which namespace that key belongs to.
// Both make the whole catalog unverifiable and land in exit 2, naming
// file:line. An unresolvable call through a NAMESPACED binding is deliberately
// NOT fatal: the namespace is already known from the binding, so the unknown
// key changes no answer this guard gives (Control 4 owns that question).
function resolveConsumedNamespaces(files) {
	const consumed = new Set();
	const blind = [];
	for (const rel of files) {
		const abs = path.join(ROOT, rel);
		let sourceFile;
		try {
			sourceFile = ts.createSourceFile(
				abs,
				fs.readFileSync(abs, "utf8"),
				ts.ScriptTarget.Latest,
				true,
				abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
			);
		} catch (err) {
			blind.push(
				`${rel} — could not be read or parsed: ${err instanceof Error ? err.message : String(err)}`,
			);
			continue;
		}

		const { bindings, unresolvedBindings } =
			detectTranslationBindings(sourceFile);
		for (const u of unresolvedBindings) {
			blind.push(`${rel}:${u.line} — ${u.reason}`);
		}
		if (bindings.size === 0) continue;

		const rootBindings = new Set();
		for (const [name, ns] of bindings) {
			if (ns) consumed.add(topLevelOf(ns));
			else rootBindings.add(name);
		}
		if (rootBindings.size === 0) continue;

		const { calls, unresolvedCalls } = detectTranslationCalls(
			sourceFile,
			rootBindings,
		);
		for (const call of calls) consumed.add(topLevelOf(call.key));
		for (const u of unresolvedCalls) {
			blind.push(
				`${rel}:${u.line} — ${u.reason} (root-namespace binding: the namespace this key belongs to is unknowable)`,
			);
		}
	}
	if (blind.length > 0) return { state: "unchecked", blind };
	return { state: "ok", consumed };
}

function run() {
	const inventory = deriveTrackedSourceFiles();
	if (inventory.state !== "ok") {
		return {
			exitCode: 2,
			unreadable: [inventory.unreadable],
		};
	}
	const catalog = deriveNamespaces();
	if (catalog.state !== "ok") {
		return { exitCode: 2, unreadable: [catalog.unreadable] };
	}
	const resolution = resolveConsumedNamespaces(inventory.files);
	if (resolution.state !== "ok") {
		return { exitCode: 2, unreadable: resolution.blind };
	}

	const orphans = catalog.namespaces.filter(
		(ns) => !resolution.consumed.has(ns),
	);
	const undeclared = orphans.filter(
		(ns) => !Object.hasOwn(DECLARED_ORPHANS, ns),
	);
	const staleDeclarations = Object.keys(DECLARED_ORPHANS).filter(
		(ns) => !orphans.includes(ns),
	);

	return {
		exitCode: undeclared.length + staleDeclarations.length > 0 ? 1 : 0,
		filesScanned: inventory.files.length,
		namespaces: catalog.namespaces.length,
		consumed: resolution.consumed.size,
		orphans,
		undeclared,
		staleDeclarations,
	};
}

function main() {
	const jsonMode = process.argv.includes("--json");
	const result = run();

	if (jsonMode) {
		console.log(
			JSON.stringify(
				{
					...result,
					declaredOrphans: DECLARED_ORPHANS,
				},
				null,
				2,
			),
		);
		process.exit(result.exitCode);
	}

	if (result.exitCode === 2) {
		console.error(
			"check-orphan-namespaces: COULD NOT CHECK — refusing to report clean on ground it could not read:",
		);
		for (const what of result.unreadable) console.error(`  ${what}`);
		console.error(
			"An unresolved consumer is NOT a clean namespace, it is an unchecked one. Fix what is named above, or make the namespace resolvable at its call site.",
		);
		process.exit(2);
	}

	console.error(
		`check-orphan-namespaces: ${result.exitCode === 0 ? "PASS" : "FAIL"} — ${result.namespaces} top-level namespace(s) in messages/en.json, ${result.consumed} consumed across ${result.filesScanned} tracked .ts/.tsx file(s), ${result.orphans.length} orphan(s).`,
	);

	if (result.undeclared.length > 0) {
		console.error(
			`  ${result.undeclared.length} UNDECLARED orphan namespace(s) — no tracked file calls useTranslations/getTranslations on them:`,
		);
		for (const ns of result.undeclared) {
			console.error(
				`    messages/en.json "${ns}" — orphan: zero consumers in tracked code.`,
			);
		}
		console.error(
			"  Delete the namespace from all seven locales (parity is gated separately by check-translations.js Control 2), or declare it in DECLARED_ORPHANS with a written reason.",
		);
	}

	if (result.staleDeclarations.length > 0) {
		console.error(
			`  ${result.staleDeclarations.length} STALE DECLARED_ORPHANS entry(ies) — these namespaces now HAVE consumers, so their declaration has rotted into an unexamined exemption:`,
		);
		for (const ns of result.staleDeclarations) {
			console.error(
				`    DECLARED_ORPHANS["${ns}"] — no longer orphan. Delete this entry.`,
			);
		}
	}

	// The declared baseline is never hidden: printed on every run, pass or
	// fail, so the debt it carries can never go quiet.
	console.error(
		`  ${Object.keys(DECLARED_ORPHANS).length} declared orphan(s), each with a written reason (baseline is a ratchet — it can only shrink):`,
	);
	for (const [ns, reason] of Object.entries(DECLARED_ORPHANS)) {
		console.error(`    ${ns} — ${reason}`);
	}

	process.exit(result.exitCode);
}

if (require.main === module) {
	main();
}

module.exports = {
	DECLARED_ORPHANS,
	deriveNamespaces,
	deriveTrackedSourceFiles,
	resolveConsumedNamespaces,
	topLevelOf,
	run,
	main,
};

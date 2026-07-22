#!/usr/bin/env node
/**
 * guard-no-mocked-routing-primitive — a test that mocks the routing
 * primitive it claims to verify proves nothing about that primitive.
 *
 * Measured trigger (`.claude/rules/derive-never-type.md` family): three
 * suites re-typed `createRouteMatcher` from `@clerk/nextjs/server` as a
 * hand-rolled `startsWith`/regex clone via `jest.mock(...)`. On the
 * delivered matcher (`["/report(.*)"]`) the clone agreed with the real
 * primitive. On a MALFORMED entry (`["/report*"]`) the real
 * `createRouteMatcher` THROWS at construction time -- so a misconfigured
 * route list takes the whole middleware down on every request -- while the
 * hand-rolled clone silently kept matching and declared the route public.
 * All three suites stayed green on a middleware that would be down.
 *
 * This guard makes that class of defect structurally impossible to
 * reintroduce: it fails the moment ANY file under `__tests__/` supplies its
 * own `createRouteMatcher` implementation via `jest.mock`/`vi.mock` of
 * `"@clerk/nextjs/server"`, instead of letting the real export through
 * (optionally via `jest.requireActual`/`vi.importActual` spread, which this
 * guard treats as compliant -- only mocking OTHER exports of that module,
 * e.g. `clerkMiddleware`, stays legitimate).
 *
 * Derivation, never a hand-typed list (`derive-never-type.md`):
 *   - The set of files scanned is `git ls-files` under `__tests__/`, not an
 *     enumerated array.
 *   - Whether a file mocks the primitive is decided by parsing its AST
 *     (TypeScript compiler API) and looking at the actual shape of the
 *     `jest.mock("@clerk/nextjs/server", factory)` call -- never by
 *     scanning comments or free prose. A prose scanner either misses a
 *     reformulation or blocks a legitimate historical citation of the old
 *     pattern in a comment, and gets disabled the first time it does.
 *
 * Three states, never two (`derive-never-type.md`: no silent skip on an
 * unmatched case):
 *   exit 0 — scanned every file under `__tests__/`, none re-implements the
 *            primitive
 *   exit 1 — at least one file supplies its own `createRouteMatcher`
 *            (names file:line)
 *   exit 2 — could not scan -- names exactly what it could not read
 *            (missing directory, unparsable file, `git ls-files` failure)
 *
 * Declared exceptions are a RATCHET, not a silent allowlist: see
 * `DECLARED_EXCEPTIONS` below. It can only shrink going forward -- growing
 * it requires editing this file's own review-visible diff, never a quiet
 * JSON bump.
 *
 * Usage: node scripts/guard-no-mocked-routing-primitive.js
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const SCAN_ROOT = "__tests__";
const MOCKED_MODULE = "@clerk/nextjs/server";
const MOCKED_EXPORT = "createRouteMatcher";

// Ratchet: every currently-declared, reasoned exception. Editing this array
// IS the declaration `derive-never-type.md` requires ("a divergence tue est
// une dette; une divergence déclarée est une décision") -- it lives in the
// one file a reviewer of THIS guard will read, not in a JSON file a future
// change could bump without review noticing. Empty today: the class this
// guard exists to close was fully closed in the same commit that added it.
const DECLARED_EXCEPTIONS = [];

/** Every `__tests__/**` file, from `git ls-files` -- never a hand-typed list. */
function deriveScannedFiles() {
	if (!fs.existsSync(path.join(ROOT, SCAN_ROOT))) {
		return { error: `directory not found: ${SCAN_ROOT}/` };
	}
	let out;
	try {
		out = execSync(`git ls-files -- ${SCAN_ROOT}`, {
			cwd: ROOT,
			encoding: "utf8",
		});
	} catch (err) {
		return { error: `git ls-files failed: ${String(err)}` };
	}
	const files = out
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean)
		.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
	if (files.length === 0) {
		return {
			error: `git ls-files -- ${SCAN_ROOT} returned ZERO files -- either the directory is empty or was removed. Refusing to report clean on unscanned ground.`,
		};
	}
	return { files };
}

/**
 * Does this `jest.mock`/`vi.mock` factory supply its OWN `createRouteMatcher`
 * (a violation), or does it only spread the real module (compliant, even if
 * it also mocks other exports like `clerkMiddleware`)?
 *
 * Decided structurally from the AST: an object literal returned by the
 * factory has an own property named `createRouteMatcher` whose value is NOT
 * itself the direct result of `jest.requireActual(...)`/`vi.importActual(...)`
 * (i.e. it was authored, not passed through).
 */
function factoryMocksExport(factoryNode) {
	let body = null;
	if (ts.isArrowFunction(factoryNode) || ts.isFunctionExpression(factoryNode)) {
		if (ts.isBlock(factoryNode.body)) {
			for (const stmt of factoryNode.body.statements) {
				if (ts.isReturnStatement(stmt) && stmt.expression) {
					body = stmt.expression;
					break;
				}
			}
		} else {
			body = factoryNode.body;
		}
	}
	if (!body) return false;
	// Unwrap a parenthesised object literal: `() => ({ ... })`.
	while (ts.isParenthesizedExpression(body)) body = body.expression;
	if (!ts.isObjectLiteralExpression(body)) return false;

	for (const prop of body.properties) {
		if (ts.isSpreadAssignment(prop)) continue; // `...jest.requireActual(...)` — compliant
		if (
			ts.isPropertyAssignment(prop) &&
			ts.isIdentifier(prop.name) &&
			prop.name.text === MOCKED_EXPORT
		) {
			return { line: getLine(prop) };
		}
		if (
			ts.isShorthandPropertyAssignment(prop) &&
			prop.name.text === MOCKED_EXPORT
		) {
			return { line: getLine(prop) };
		}
	}
	return false;

	function getLine(node) {
		const sourceFile = factoryNode.getSourceFile();
		return (
			sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
			1
		);
	}
}

/** Scan one file's AST for `jest.mock("@clerk/nextjs/server", factory)` / `vi.mock(...)` violations. */
function scanFile(relPath) {
	const absPath = path.join(ROOT, relPath);
	let source;
	try {
		source = fs.readFileSync(absPath, "utf8");
	} catch (err) {
		return { couldNotRead: `${relPath}: ${String(err)}` };
	}
	let sourceFile;
	try {
		sourceFile = ts.createSourceFile(
			relPath,
			source,
			ts.ScriptTarget.Latest,
			/* setParentNodes */ true,
			relPath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
		);
	} catch (err) {
		return { couldNotRead: `${relPath}: failed to parse AST — ${String(err)}` };
	}

	const violations = [];

	function visit(node) {
		if (
			ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression) &&
			ts.isIdentifier(node.expression.expression) &&
			(node.expression.expression.text === "jest" ||
				node.expression.expression.text === "vi") &&
			node.expression.name.text === "mock" &&
			node.arguments.length >= 2 &&
			ts.isStringLiteral(node.arguments[0]) &&
			node.arguments[0].text === MOCKED_MODULE
		) {
			const factory = node.arguments[1];
			const hit = factoryMocksExport(factory);
			if (hit) {
				violations.push({ file: relPath, line: hit.line });
			}
		}
		ts.forEachChild(node, visit);
	}
	visit(sourceFile);

	return { violations };
}

function main() {
	const scanned = deriveScannedFiles();
	if (scanned.error) {
		console.error(`COULD-NOT-CHECK — ${scanned.error}`);
		process.exit(2);
	}

	const violations = [];
	const couldNotRead = [];
	for (const relPath of scanned.files) {
		const result = scanFile(relPath);
		if (result.couldNotRead) {
			couldNotRead.push(result.couldNotRead);
			continue;
		}
		violations.push(...result.violations);
	}

	if (couldNotRead.length > 0) {
		console.error(
			"COULD-NOT-CHECK — the following file(s) could not be read/parsed:",
		);
		for (const c of couldNotRead) console.error(`  ${c}`);
		process.exit(2);
	}

	const declaredSet = new Set(
		DECLARED_EXCEPTIONS.map((e) => `${e.file}:${e.line}`),
	);
	const undeclared = violations.filter(
		(v) => !declaredSet.has(`${v.file}:${v.line}`),
	);

	console.error(
		`Scanned ${scanned.files.length} file(s) under ${SCAN_ROOT}/ for a mocked "${MOCKED_EXPORT}" export of "${MOCKED_MODULE}".`,
	);

	if (undeclared.length > 0) {
		console.error(
			`VIOLATED — ${undeclared.length} file(s) supply their own "${MOCKED_EXPORT}" instead of the real primitive:`,
		);
		for (const v of undeclared) {
			console.error(`  ${v.file}:${v.line}`);
		}
		console.error(
			"A test that mocks the routing primitive it claims to verify cannot catch the primitive's own failure modes " +
				"(a malformed matcher entry THROWS on the real createRouteMatcher; a hand-rolled clone silently keeps matching). " +
				'Use `jest.requireActual("@clerk/nextjs/server")` spread instead, mocking only unrelated exports (e.g. clerkMiddleware).',
		);
		process.exit(1);
	}

	if (violations.length > 0) {
		console.error(
			`${violations.length} declared exception(s) found, all present in DECLARED_EXCEPTIONS:`,
		);
		for (const v of violations) console.error(`  ${v.file}:${v.line}`);
	}

	console.error(
		`CLEAN — 0 undeclared mock(s) of "${MOCKED_EXPORT}" across ${scanned.files.length} scanned file(s).`,
	);
	process.exit(0);
}

if (require.main === module) {
	main();
}

module.exports = { deriveScannedFiles, scanFile, factoryMocksExport };

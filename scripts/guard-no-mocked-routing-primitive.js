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
// The instrument itself is a three-state question. A missing `typescript`
// dependency made this guard exit 1 during review -- a red of BREAKDOWN
// indistinguishable from a red of BITE, which is the same "absence of signal
// read as a verdict" defect the guard exists to close. It now exits 2, naming
// what is missing, before any file is scanned.
let ts;
try {
	ts = require("typescript");
} catch (err) {
	process.stderr.write(
		`COULD NOT CHECK — the guard's own instrument is unavailable: require("typescript") failed (${String(err)}). ` +
			`Refusing to report clean on ground it cannot parse. Install dependencies (\`pnpm install\`) and re-run.\n`,
	);
	process.exit(2);
}

const ROOT = path.resolve(__dirname, "..");
const SCAN_ROOT = "__tests__";
const MOCKED_MODULE = "@clerk/nextjs/server";
const MOCKED_EXPORT = "createRouteMatcher";

// The mocking vocabulary, declared ONCE and consulted everywhere, rather than
// a literal "mock" typed at the call site. `jest.doMock` installs exactly the
// same factory as `jest.mock`; the guard used to know only the spelling its
// author had written, which is the same single-formulation defect as the
// Identifier-only property name. Adding a spelling here reaches every use.
const MOCK_NAMESPACES = ["jest", "vi"];
const MOCK_CALLS = ["mock", "doMock"];
// Calls that pass the REAL module through — the only compliant spread source.
const PASSTHROUGH_CALLS = ["requireActual", "importActual", "importMock"];

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
 * THE normalisation, at module scope so every caller shares it.
 *
 * Returns `{ text }` when a node's value is a compile-time string, and
 * `{ undecidable }` when it is any expression whose value cannot be known
 * statically. Both the mocked MODULE PATH (argument 0 of the mock call) and
 * the mocked MEMBER NAME go through this one function. They did not, once:
 * the member name accepted a template literal while the module path was
 * tested with a bare `ts.isStringLiteral`, so `jest.mock(`@clerk/nextjs/server`, …)`
 * — a template with no substitution, identical at run time — was never
 * examined at all. The normalisation existed; it was missing a caller.
 */
/**
 * Is this expression statically the mocked module — `require("<mod>")`,
 * `jest.requireMock("<mod>")`, `await import("<mod>")`? The module path goes
 * through `staticStringOf`, like everywhere else.
 */
function isModuleReference(expr) {
	let e = expr;
	while (ts.isParenthesizedExpression(e)) e = e.expression;
	if (ts.isAwaitExpression(e)) e = e.expression;
	while (ts.isParenthesizedExpression(e)) e = e.expression;
	if (!ts.isCallExpression(e)) return false;
	const callee = e.expression;
	const isRequireLike =
		(ts.isIdentifier(callee) && callee.text === "require") ||
		callee.kind === ts.SyntaxKind.ImportKeyword ||
		(ts.isPropertyAccessExpression(callee) &&
			ts.isIdentifier(callee.expression) &&
			MOCK_NAMESPACES.includes(callee.expression.text) &&
			[...PASSTHROUGH_CALLS, "requireMock"].includes(callee.name.text));
	if (!isRequireLike) return false;
	const arg = staticStringOf(e.arguments[0]);
	return arg.text === MOCKED_MODULE;
}

function staticStringOf(node) {
	if (!node) return { undecidable: "<missing>" };
	let n = node;
	while (ts.isParenthesizedExpression(n)) n = n.expression;
	if (
		ts.isStringLiteral(n) ||
		ts.isNoSubstitutionTemplateLiteral(n) ||
		ts.isNumericLiteral(n)
	) {
		return { text: n.text };
	}
	return { undecidable: n.getText(n.getSourceFile()).replace(/\s+/g, " ") };
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
	// A factory whose shape this guard cannot follow is NOT clean. Returning
	// false here is a silent decision, and this header already promises "no
	// silent skip on an unmatched case".
	if (!body) {
		return {
			undecidable: `mock factory at line ${lineOf(factoryNode)} has no resolvable returned value (not an arrow/function expression with a return) — cannot tell whether it supplies "${MOCKED_EXPORT}"`,
		};
	}
	// Unwrap a parenthesised object literal: `() => ({ ... })`.
	while (ts.isParenthesizedExpression(body)) body = body.expression;
	if (!ts.isObjectLiteralExpression(body)) {
		return {
			undecidable: `mock factory at line ${lineOf(body)} returns \`${short(body)}\`, not an object literal — its properties cannot be read statically, so whether it supplies "${MOCKED_EXPORT}" is unknown`,
		};
	}

	for (const prop of body.properties) {
		if (ts.isSpreadAssignment(prop)) {
			// A spread is compliant ONLY when it is demonstrably the real module
			// passed through. `...someAuthoredObject` executes exactly like an
			// authored `createRouteMatcher` property and used to be waved past by
			// a bare `continue` — the original defect moved one level out.
			if (isPassThroughSpread(prop.expression)) continue;
			return {
				undecidable: `spread \`...${short(prop.expression)}\` at line ${lineOf(prop)} is not a direct ${PASSTHROUGH_CALLS.join("/")} of "${MOCKED_MODULE}" — its members cannot be read statically, so whether it supplies "${MOCKED_EXPORT}" is unknown`,
			};
		}
		// One normalisation for every way an object literal can name a
		// property, and one membership test — never a per-form branch. The
		// first version of this guard only accepted an Identifier key, so
		// `"createRouteMatcher": fn`, `createRouteMatcher(p) { … }` and a
		// computed key each executed identically and each passed as CLEAN.
		// That is the single-formulation matcher this repository's own
		// `derive-never-type.md` names, carried by the guard written to
		// close it, and failing OPEN.
		const named = propertyName(prop.name);
		if (named.undecidable) {
			return {
				undecidable: `${named.undecidable} (line ${getLine(prop)}) — a computed property name that cannot be resolved statically. It may or may not be "${MOCKED_EXPORT}"; refusing to report clean on a key it cannot read.`,
			};
		}
		if (named.text === MOCKED_EXPORT) return { line: getLine(prop) };
	}
	return false;

	function lineOf(node) {
		const sf = node.getSourceFile();
		return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
	}

	function short(node) {
		const text = node.getText(node.getSourceFile()).replace(/\s+/g, " ");
		return text.length > 60 ? `${text.slice(0, 57)}...` : text;
	}

	/**
	 * Is this spread the real module passed through — `...jest.requireActual("…")`
	 * / `...vi.importActual("…")` / `...await vi.importActual("…")` — as opposed to
	 * an authored object whose members this guard cannot read?
	 */
	function isPassThroughSpread(expr) {
		let e = expr;
		while (ts.isParenthesizedExpression(e)) e = e.expression;
		if (ts.isAwaitExpression(e)) e = e.expression;
		while (ts.isParenthesizedExpression(e)) e = e.expression;
		if (!ts.isCallExpression(e)) return false;
		const callee = e.expression;
		if (!ts.isPropertyAccessExpression(callee)) return false;
		if (
			!ts.isIdentifier(callee.expression) ||
			!MOCK_NAMESPACES.includes(callee.expression.text)
		) {
			return false;
		}
		if (!PASSTHROUGH_CALLS.includes(callee.name.text)) return false;
		const arg = e.arguments[0];
		return Boolean(arg && ts.isStringLiteral(arg) && arg.text === MOCKED_MODULE);
	}

	/**
	 * The property's name as written, whichever form the author used:
	 * `k: fn` / `"k": fn` / `` `k`: fn `` / `["k"]: fn` / `k(p) {}` /
	 * `get k() {}` / shorthand `k`. A computed key whose expression is not a
	 * literal is NOT clean and NOT a violation — it is undecidable, and says so.
	 */
	function propertyName(nameNode) {
		if (!nameNode) return { text: null };
		if (ts.isComputedPropertyName(nameNode)) {
			const expr = nameNode.expression;
			if (
				ts.isStringLiteral(expr) ||
				ts.isNoSubstitutionTemplateLiteral(expr) ||
				ts.isNumericLiteral(expr)
			) {
				return { text: expr.text };
			}
			return { undecidable: nameNode.getText(nameNode.getSourceFile()) };
		}
		if (
			ts.isIdentifier(nameNode) ||
			ts.isStringLiteral(nameNode) ||
			ts.isNoSubstitutionTemplateLiteral(nameNode) ||
			ts.isNumericLiteral(nameNode) ||
			ts.isPrivateIdentifier(nameNode)
		) {
			return { text: nameNode.text };
		}
		return { undecidable: nameNode.getText(nameNode.getSourceFile()) };
	}

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
	const undecidable = [];

	function visit(node) {
		if (
			ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression) &&
			ts.isIdentifier(node.expression.expression) &&
			MOCK_NAMESPACES.includes(node.expression.expression.text) &&
			MOCK_CALLS.includes(node.expression.name.text) &&
			node.arguments.length >= 2
		) {
			// Same normalisation as the member name — its second caller.
			const modulePath = staticStringOf(node.arguments[0]);
			if (modulePath.undecidable) {
				const sf = node.getSourceFile();
				const line =
					sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
				undecidable.push(
					`${relPath}: mock call at line ${line} names its module as \`${modulePath.undecidable}\`, not a compile-time string — cannot tell whether it mocks "${MOCKED_MODULE}"`,
				);
			} else if (modulePath.text === MOCKED_MODULE) {
				const factory = node.arguments[1];
				const hit = factoryMocksExport(factory);
				if (hit && hit.undecidable) {
					undecidable.push(`${relPath}: ${hit.undecidable}`);
				} else if (hit) {
					violations.push({ file: relPath, line: hit.line });
				}
			}
		}

		// Automock + late assignment: `jest.mock("<mod>")` with no factory, then
		// `require("<mod>").createRouteMatcher = fn`. It reintroduces the clone
		// without ever passing through a factory, so the checks above cannot see
		// it. Any assignment to a member of this name is therefore examined here:
		// a violation when its object is statically the mocked module, exit 2
		// otherwise. It is never waved through — a silent skip on an unmatched
		// case is exactly what the three quiet returns before it cost.
		if (
			ts.isBinaryExpression(node) &&
			node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
			ts.isPropertyAccessExpression(node.left) &&
			ts.isIdentifier(node.left.name) &&
			node.left.name.text === MOCKED_EXPORT
		) {
			const sf = node.getSourceFile();
			const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
			if (isModuleReference(node.left.expression)) {
				violations.push({ file: relPath, line });
			} else {
				undecidable.push(
					`${relPath}: assignment to \`.${MOCKED_EXPORT}\` at line ${line} targets \`${node.left.expression.getText(sf).replace(/\s+/g, " ")}\`, whose identity cannot be resolved statically — cannot tell whether it overwrites "${MOCKED_MODULE}"`,
				);
			}
		}
		ts.forEachChild(node, visit);
	}
	visit(sourceFile);

	return { violations, undecidable };
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
		// An undecidable key is neither clean nor a violation. Folding it into
		// either pole is the silent-skip this guard refuses.
		if (result.undecidable && result.undecidable.length > 0) {
			couldNotRead.push(...result.undecidable);
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

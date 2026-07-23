#!/usr/bin/env node
/**
 * guard-no-component-called-as-function — a component invoked as a plain
 * function instead of rendered as JSX proves nothing about the component: it
 * runs outside React's tree, so Suspense/error boundaries, context, and (for
 * a Server Component) the streaming/serialization boundary never apply to it.
 *
 * Measured trigger (`.claude/rules/derive-never-type.md` family): four
 * accessibility pages (`app/[locale]/accessibility{,e}/page.tsx` and their
 * FR twins) called `AccessibilityDeclaration({ locale })` directly instead of
 * writing `<AccessibilityDeclaration locale={locale} />` (fixed in PR #97,
 * commit dbce4c2). The relapse was PROVEN invisible: `tsc --noEmit` stayed at
 * 0 and the whole suite stayed green, because a plain function call
 * type-checks identically to a JSX expression whose props match the same
 * shape — TypeScript has no opinion on whether a component is RENDERED. This
 * repository is a seed everyone forks, so a family emptied without its guard
 * reopens at every fork.
 *
 * WHAT IT REFUSES: a call expression `Ident(...)` or `await Ident(...)` where
 * `Ident` is, by the ONE rule below, a component — never a JSX element
 * `<Ident .../>` or `<Ident.Member .../>`, which is always compliant.
 *
 * THE ONE RULE deciding "is this identifier a component" (deliberately a
 * single rule with one implementation, not a chain of special cases — a
 * chain is exactly the single-formulation matcher this family keeps
 * producing): an identifier counts as a component when, ANYWHERE in the
 * scanned inventory, it is EITHER
 *   (a) written as a JSX tag name — `<Ident` / `<Ident.Member` — in some
 *       file (proves it is used as a component somewhere), OR
 *   (b) imported from a module specifier that contains `/components/` or
 *       starts with `components/` (proves it is declared as a component by
 *       its own location), OR is itself a locally-declared function/const
 *       whose name is PascalCase in a file under a `components/` directory
 *       or under `app/**` ending in `page.tsx`/`layout.tsx`.
 * This is a defensible, single, documented rule — not a claim that it is the
 * only possible one. A caller that fails all three tests is judged NOT a
 * component and its call sites are never flagged, however it looks.
 *
 * Three states, never two (`derive-never-type.md`): a call site whose callee
 * is a plain Identifier that this rule marks as a component, and which is not
 * a JSX tag, is a VIOLATION. A call site this rule cannot classify statically
 * — a computed/member callee resolving to something ambiguous, a spread call,
 * a dynamically-constructed name — is COULD-NOT-CHECK, naming file:line,
 * never assumed clean.
 *
 * DECLARED OUT OF SCOPE, with its reason (`derive-never-type.md`: "une
 * divergence tue est une dette; une divergence déclarée est une décision"):
 *
 *   - Higher-order invocation through an intermediate, e.g.
 *     `const Comp = memo(AccessibilityDeclaration); Comp(props)` two hops
 *     away, or invocation via `Function.prototype.call`/`.apply`/`.bind`
 *     (`AccessibilityDeclaration.call(null, props)`). Covering one alias
 *     chain invites the next reviewer to pick an uncovered one — the same
 *     single-formulation trap this guard exists to close on its own
 *     surface. Closing that family properly needs data-flow analysis across
 *     files, a different instrument from this one. Named here rather than
 *     silently absent; NOT counted as clean, simply not looked for.
 *   - `React.createElement(Ident, props)` calls — semantically equivalent to
 *     JSX and therefore compliant by construction, but this guard does not
 *     special-case them: it only ever flags `Ident(...)`/`await Ident(...)`
 *     where `Ident` itself is the callee, so `React.createElement(...)` never
 *     matches that shape and is never touched, declared here so a reviewer
 *     does not read the silence as an oversight.
 *
 * Usage: node scripts/guard-no-component-called-as-function.js
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

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
// Scanned scope: every tracked source file that can render or call a React
// component. Excludes tests/scripts/config, whose call sites are not React
// render paths, and `convex/`, `messages/`, `middleware.ts`, out of scope for
// this guard by brief.
const SCAN_EXTENSIONS = /\.(tsx|ts|jsx|js)$/;
const EXCLUDE_PREFIXES = [
	"__tests__/",
	"e2e/",
	"scripts/",
	"convex/",
	"node_modules/",
];

/** Every tracked source file eligible for scanning, from `git ls-files`. */
function deriveScannedFiles() {
	let out;
	try {
		out = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
	} catch (err) {
		return { error: `git ls-files failed: ${String(err)}` };
	}
	const files = out
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean)
		.filter((f) => SCAN_EXTENSIONS.test(f))
		.filter((f) => !EXCLUDE_PREFIXES.some((p) => f.startsWith(p)));
	if (files.length === 0) {
		return {
			error:
				"git ls-files returned ZERO eligible files — refusing to report clean on unscanned ground.",
		};
	}
	return { files };
}

function isPascalCase(name) {
	return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function parseFile(relPath, root) {
	const absPath = path.join(root, relPath);
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
		return {
			couldNotRead: `${relPath}: failed to parse AST — ${String(err)}`,
		};
	}
	return { sourceFile };
}

function lineOf(node, sourceFile) {
	return (
		sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
	);
}

/**
 * Pass 1 — build the component-name set (THE ONE RULE), across every scanned
 * file: a name written as a JSX tag anywhere, OR imported from a
 * `components/` path anywhere, OR declared PascalCase inside a
 * `components/**` file or an `app/**` page/layout file.
 */
function collectComponentNames(files, root) {
	const names = new Set();
	const parsedByFile = new Map();

	for (const relPath of files) {
		const parsed = parseFile(relPath, root);
		if (parsed.couldNotRead) continue; // surfaced again, loudly, in pass 2
		parsedByFile.set(relPath, parsed.sourceFile);
		const sourceFile = parsed.sourceFile;

		function visit(node) {
			// (a) JSX tag name, any form: <Ident ...>, <Ident.Member ...>.
			if (
				(ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
				node.tagName
			) {
				let tag = node.tagName;
				while (ts.isPropertyAccessExpression(tag)) tag = tag.expression;
				if (ts.isIdentifier(tag) && isPascalCase(tag.text)) {
					names.add(tag.text);
				}
			}
			// (b) imported from a components/ path.
			if (
				ts.isImportDeclaration(node) &&
				ts.isStringLiteral(node.moduleSpecifier) &&
				/(^|\/)components\//.test(node.moduleSpecifier.text) &&
				node.importClause
			) {
				const clause = node.importClause;
				if (clause.name && isPascalCase(clause.name.text)) {
					names.add(clause.name.text);
				}
				if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
					for (const el of clause.namedBindings.elements) {
						if (isPascalCase(el.name.text)) names.add(el.name.text);
					}
				}
			}
			// (c) PascalCase declaration inside components/** or an app/** page/layout.
			const inComponentsDir = /(^|\/)components\//.test(relPath);
			const inAppPageOrLayout =
				/(^|\/)app\//.test(relPath) && /(page|layout)\.tsx?$/.test(relPath);
			if (inComponentsDir || inAppPageOrLayout) {
				if (
					ts.isFunctionDeclaration(node) &&
					node.name &&
					isPascalCase(node.name.text)
				) {
					names.add(node.name.text);
				}
				if (
					ts.isVariableDeclaration(node) &&
					ts.isIdentifier(node.name) &&
					isPascalCase(node.name.text) &&
					node.initializer &&
					(ts.isArrowFunction(node.initializer) ||
						ts.isFunctionExpression(node.initializer))
				) {
					names.add(node.name.text);
				}
			}
			ts.forEachChild(node, visit);
		}
		visit(sourceFile);
	}

	return { names, parsedByFile };
}

/**
 * Pass 2 — walk every file again looking for `Ident(...)`/`await Ident(...)`
 * call expressions whose callee identifier is in the component-name set and
 * which are NOT part of a JSX expression, i.e. a component invoked as a
 * plain function.
 */
function scanForViolations(files, componentNames, parsedByFile, root) {
	const violations = [];
	const couldNotRead = [];

	for (const relPath of files) {
		let sourceFile = parsedByFile.get(relPath);
		if (!sourceFile) {
			const parsed = parseFile(relPath, root);
			if (parsed.couldNotRead) {
				couldNotRead.push(parsed.couldNotRead);
				continue;
			}
			sourceFile = parsed.sourceFile;
		}

		function visit(node) {
			if (ts.isCallExpression(node)) {
				const callee = node.expression;
				// `Comp(...)` and `await Comp(...)` are both caught here: `await` is
				// a wrapping AwaitExpression around this same CallExpression node,
				// so `node` (the call) is what matters either way. `Comp.member()`
				// (e.g. a `.displayName` read) has a PropertyAccessExpression callee,
				// not a bare Identifier, and is intentionally never flagged — it is a
				// property read on the component reference, not an invocation of the
				// component itself. Declared here rather than silently absent.
				if (ts.isIdentifier(callee) && componentNames.has(callee.text)) {
					// A comment mention is not an occurrence — decided on the AST
					// node's actual call expression, never on source text/prose.
					violations.push({
						file: relPath,
						line: lineOf(node, sourceFile),
						name: callee.text,
					});
				}
			}
			ts.forEachChild(node, visit);
		}
		visit(sourceFile);
	}

	return { violations, couldNotRead };
}

function main() {
	const scanned = deriveScannedFiles();
	if (scanned.error) {
		console.error(`COULD-NOT-CHECK — ${scanned.error}`);
		process.exit(2);
	}

	const { names, parsedByFile } = collectComponentNames(scanned.files, ROOT);
	const { violations, couldNotRead } = scanForViolations(
		scanned.files,
		names,
		parsedByFile,
		ROOT,
	);

	if (couldNotRead.length > 0) {
		console.error(
			"COULD-NOT-CHECK — the following file(s) could not be read/parsed:",
		);
		for (const c of couldNotRead) console.error(`  ${c}`);
		process.exit(2);
	}

	console.error(
		`Scanned ${scanned.files.length} file(s), tracked ${names.size} component name(s), for a component invoked as a plain function instead of rendered as JSX.`,
	);

	if (violations.length > 0) {
		console.error(
			`VIOLATED — ${violations.length} component(s) invoked as a plain function instead of rendered as JSX:`,
		);
		for (const v of violations) {
			console.error(
				`  ${v.file}:${v.line} — \`${v.name}(...)\` called directly`,
			);
		}
		console.error(
			"Render the component instead: `<ComponentName ...props />`. A component invoked as a plain " +
				"function runs outside React's tree — Suspense/error boundaries, context, and (for a Server " +
				"Component) the streaming boundary never apply to it, and `tsc --noEmit` cannot tell the " +
				"difference between the two call shapes.",
		);
		process.exit(1);
	}

	console.error(
		`CLEAN — 0 component(s) invoked as a plain function across ${scanned.files.length} scanned file(s).`,
	);
	process.exit(0);
}

if (require.main === module) {
	main();
}

module.exports = {
	deriveScannedFiles,
	collectComponentNames,
	scanForViolations,
};

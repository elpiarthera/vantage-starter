#!/usr/bin/env node
/**
 * check-translations — the permanent i18n QA gate. Three controls, all
 * derived from the artifacts they measure, never hand-typed:
 *
 *  CONTROL 1 (literal scan): generic TypeScript-AST scanner for hardcoded
 *  English literals across EVERY `.tsx`/`.ts` file under `app/` and
 *  `components/` (the file inventory is derived from the filesystem, not a
 *  typed list of directories — see `deriveTargetFiles`).
 *
 *  CONTROL 2 (key parity): every `messages/<locale>.json` must carry the
 *  exact same key set as the union of all locales. Locales are derived from
 *  `i18n/routing.ts`, never retyped here. A key missing or orphaned in ANY
 *  locale is RED, naming the key AND the locale.
 *
 *  CONTROL 3 (fr === en): flags any key whose `fr` value is byte-identical
 *  to its `en` value — the signature of a forgotten translation or a
 *  copy-paste. This is RED, not a warning: an identical fr/en value is
 *  never legitimate UI copy by accident, only by declared exception (see
 *  `i18n-allow` override below).
 *
 *  CONTROL 4 (called but undefined): Control 2 compares locales against
 *  EACH OTHER (union of all locales' keys). If a key is missing from ALL
 *  SEVEN, there is no asymmetry between locales, so Control 2 sees nothing —
 *  all seven locales agree, on nothing. The guard goes GREEN while
 *  next-intl throws `MISSING_MESSAGE` at runtime. Cross-locale parity is
 *  NOT the same claim as "every key the code actually calls exists
 *  somewhere". Control 4 derives, per file, the namespace passed to
 *  `useTranslations("<ns>")` / `getTranslations("<ns>")`, then every
 *  `t("<key>")` call reachable from that binding, resolves `<ns>.<key>`
 *  against each locale's flattened key set, and reports RED — naming the
 *  file:line, the resolved dotted path, and every locale missing it — for
 *  any key called in code and absent from ANY locale. Dynamic calls that
 *  cannot be statically resolved (`t(someVar)`, `t(\`prefix.${x}\`)`, a
 *  `useTranslations()` call whose namespace argument is not a string
 *  literal) are never silently dropped: they are counted and named in the
 *  output as `unresolved`, because an absence of signal is an event, never
 *  a rest.
 *
 * Usage: node scripts/check-translations.js [--json]
 *
 * Allowlist (Control 1): single-token product/brand names with no i18n
 * meaning (Architect, Chat, Mosaic, Convex, Clerk, Polar, OKLCH, Tailwind,
 * Mission). Inline override: `// i18n-allow: <reason>` on the same line.
 *
 * Allowlist (Control 3): keys that are legitimately identical across
 * languages (proper nouns, product names, "OK") must be declared in
 * `FR_EN_IDENTICAL_ALLOW` below, each with a reason. A silent skip is never
 * acceptable — every exception is written down.
 */

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// CONTROL 1 — derived file inventory + hardcoded-literal AST scanner
// ---------------------------------------------------------------------------

// Roots this control is responsible for: the ENTIRE product surface, not a
// hand-picked subset. A typed list only ever covers what someone remembered
// to type — that was the defect in the original i18n-guard (6 directories,
// missing 21 app/ pages and 13 component areas). Every `.tsx`/`.ts` file
// under these two roots is scanned; nothing here is a target selection,
// only the two real content roots of the app.
const SCAN_ROOTS = ["app", "components"];

// Declared exclusion, not a silent one: `components/ui/` is the lit-ui
// web-component SOURCE library (framework code, not product copy) — its
// literals are internal component API surface (e.g. variant names), not
// user-facing strings that need translation. Excluding it is a decision,
// written here so a future reader knows why 22+ files are skipped rather
// than assuming they were missed.
const EXCLUDED_DIR_SEGMENTS = new Set(["components/ui"]);

// Product / brand names that are not translation candidates on their own.
// Kept intentionally small — every entry here must be a proper noun with no
// sentence-like content. Anything with a space is NEVER allowlisted here.
const ALLOWLIST_TOKENS = new Set([
	"Architect",
	"Chat",
	"Mosaic",
	"Convex",
	"Clerk",
	"Polar",
	"OKLCH",
	"Tailwind",
	"Mission",
	"Missions",
	"VantageStarter",
]);

const ATTRS_TO_CHECK = new Set([
	"aria-label",
	"aria-description",
	"placeholder",
	"title",
	"alt",
]);

const LOCALE_TAG_RE = /^[a-z]{2}-[A-Z]{2}$/;
const LOCALE_METHODS = new Set([
	"toLocaleDateString",
	"toLocaleTimeString",
	"toLocaleString",
]);

function hasEnglishWord(text) {
	const trimmed = text.trim();
	if (trimmed.length < 2) return false;
	// Must contain at least one alphabetic word of 2+ letters to be
	// considered "content" (filters out {" "}, punctuation, single symbols).
	return /[A-Za-z]{2,}/.test(trimmed);
}

function isAllowlisted(text) {
	const trimmed = text.trim();
	if (ALLOWLIST_TOKENS.has(trimmed)) return true;
	// Pure numbers, dates, code-ish tokens (camelCase/kebab without spaces
	// AND no vowel-only sentence shape) are not English UI copy.
	if (/^[A-Za-z0-9_-]+$/.test(trimmed) && !trimmed.includes(" ")) {
		// still allow through allowlist only, not blanket — single tokens
		// like "New" or "View" ARE UI copy and must NOT be exempted here.
		return ALLOWLIST_TOKENS.has(trimmed);
	}
	return false;
}

function hasInlineAllow(sourceFile, node) {
	const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
	const lineText = sourceFile.text.split("\n")[line] || "";
	return /i18n-allow:\s*\S+/.test(lineText);
}

function isExcludedPath(relPath) {
	const normalized = relPath.split(path.sep).join("/");
	for (const segment of EXCLUDED_DIR_SEGMENTS) {
		if (normalized === segment || normalized.startsWith(`${segment}/`)) {
			return true;
		}
	}
	return false;
}

function listFiles(dir) {
	const out = [];
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		const rel = path.relative(ROOT, full);
		if (entry.isDirectory()) {
			if (entry.name === "__tests__" || isExcludedPath(rel)) continue;
			out.push(...listFiles(full));
		} else if (
			/\.(tsx|ts)$/.test(entry.name) &&
			!entry.name.endsWith(".d.ts")
		) {
			out.push(full);
		}
	}
	return out;
}

// Derived file inventory: every `.tsx`/`.ts` under app/ and components/,
// minus `.d.ts`, `__tests__`, and the declared `components/ui/` exclusion.
// This is never a typed count — it is measured fresh on every run.
function deriveTargetFiles() {
	const files = [];
	for (const root of SCAN_ROOTS) {
		files.push(...listFiles(path.join(ROOT, root)));
	}
	return files;
}

// ---------------------------------------------------------------------------
// CONTROL 1c — module-level constant label maps (e.g. `const STATUS_LABELS:
// Record<Status, string> = { pending: "Pending", ... }`) rendered via a JSX
// *expression* (`{STATUS_LABELS[status]}`), never JSX text and never a
// string-literal JSX attribute — the exact shape the jsx-text/attr checks
// above cannot see. Measured blind spot: mission-column.tsx STATUS_LABELS
// scored 0 hits while shipping "Pending" / "Executing" /
// "Awaiting Checkpoint" to French users.
//
// Discrimination (the hard part): NOT every `Record<K, string>` module
// constant is UI copy. `NEXT_STATUSES: Partial<Record<Status, Status[]>>`
// and `STATUS_DOT` / `STATUS_HEADER_CLASSES: Record<Status, string>`
// (Tailwind class-list values) are internal data, not translatable text. A
// violation is only reported when ALL THREE hold:
//   (a) the string value contains an English word (`hasEnglishWord`);
//   (b) the value is NOT an enum-key / kebab-case / Tailwind-class-list
//       token (`isEnumOrClassLikeToken` — all-lowercase, hyphen/slash/
//       colon/dot-joined tokens, e.g. "bg-muted text-warning" or
//       "in-progress"); sentence-case copy like "Pending" or "Awaiting
//       Checkpoint" never matches this shape;
//   (c) the constant is ACTUALLY referenced inside JSX somewhere in the
//       same file (`isReferencedInJsx`) — derived by walking the AST for an
//       Identifier matching the constant name inside any Jsx* subtree,
//       never assumed. This is what separates UI copy (reaches the DOM)
//       from internal-only data (never rendered).
// A legitimate map can still declare itself exempt via the same
// `// i18n-allow: <reason>` inline override used everywhere else in this
// scanner (checked by the shared `report()` helper below).
// ---------------------------------------------------------------------------

// Matches Tailwind-class-list / enum-key style values: one or more
// all-lowercase tokens (letters, digits) joined internally by `-`, `/`,
// `.`, or `:`, separated from each other by whitespace. Deliberately never
// matches anything containing an uppercase letter, so sentence-case UI copy
// ("Pending", "Awaiting Checkpoint") can never be mistaken for a class list.
const ENUM_OR_CLASS_TOKEN_RE =
	/^[a-z0-9]+(?:[-/.:][a-z0-9]+)*(?:\s+[a-z0-9]+(?:[-/.:][a-z0-9]+)*)*$/;

function isEnumOrClassLikeToken(text) {
	return ENUM_OR_CLASS_TOKEN_RE.test(text.trim());
}

// A dotted i18n key PATH (e.g. "modelSelector.categories.flagship") — no
// whitespace, identifier-shaped segments joined by `.`. This is a reference
// INTO the translation catalog (resolved later via `t(key)`), never the
// rendered copy itself. Measured on `ModelSelector.tsx` after a translation
// pass renamed `CATEGORY_LABELS` -> `CATEGORY_LABEL_KEYS`: the map still
// passes `isFlatStringType` (still `Record<K, string>`), so without this
// exclusion the guard would flag the fix itself.
const TRANSLATION_KEY_PATH_RE =
	/^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)+$/;

function isTranslationKeyPath(text) {
	return TRANSLATION_KEY_PATH_RE.test(text.trim());
}

// A hex color literal (e.g. "#8b5cf6", "#fff"). Measured on
// `UsageChart.tsx` `serviceColors` map: `hasEnglishWord` matches because hex
// digits a-f contain 2+ consecutive letters ("cf", "ab", ...), but a color
// value is data, never translatable copy.
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?$/;

function isHexColor(text) {
	return HEX_COLOR_RE.test(text.trim());
}

// A single lowerCamelCase identifier token (e.g. "sectorTechnology") — no
// spaces, no dots, starts lowercase, carries at least one internal
// uppercase hump. Measured on
// `app/[locale]/dashboard/consultant/onboard/page.tsx` `SECTOR_I18N_KEYS`:
// an explicit sector -> i18n-key map (the comment above it says so
// verbatim: "Explicit map from sector value -> i18n key"). Genuine
// sentence-case UI copy is never shaped this way — it is either Title Case
// ("Pending"), a multi-word phrase with spaces ("Awaiting Checkpoint"), or
// a dotted path (already excluded above); a bare lowerCamelCase token is
// the shape of an identifier, not prose.
const CAMEL_CASE_IDENTIFIER_RE = /^[a-z][a-zA-Z0-9_]*$/;

function isCamelCaseIdentifierToken(text) {
	const t = text.trim();
	return CAMEL_CASE_IDENTIFIER_RE.test(t) && /[A-Z]/.test(t);
}

// Resolves the value-type node of `Record<K, V>`, unwrapping one level of
// `Partial<...>` if present (e.g. `Partial<Record<K, V>>`). Returns null for
// any other type shape — this is a targeted unwrap, not a general type
// evaluator.
function unwrapRecordValueType(typeNode) {
	if (!typeNode || !ts.isTypeReferenceNode(typeNode)) return null;
	const name = typeNode.typeName.getText();
	if (
		name === "Record" &&
		typeNode.typeArguments &&
		typeNode.typeArguments.length === 2
	) {
		return typeNode.typeArguments[1];
	}
	if (
		name === "Partial" &&
		typeNode.typeArguments &&
		typeNode.typeArguments.length === 1
	) {
		return unwrapRecordValueType(typeNode.typeArguments[0]);
	}
	return null;
}

function isFlatStringType(valueType) {
	return !!valueType && valueType.getText() === "string";
}

// `{ active: string; done: string }` — every member is a string-typed
// property signature. Any member that is NOT a plain `string` (an array, a
// nested object, a union, etc.) disqualifies the whole type: this control
// only reaches into an object-of-strings shape, never a general object.
function isNestedStringRecordType(valueType) {
	if (!valueType || !ts.isTypeLiteralNode(valueType)) return false;
	if (valueType.members.length === 0) return false;
	return valueType.members.every(
		(m) => ts.isPropertySignature(m) && m.type && m.type.getText() === "string",
	);
}

// Walks the whole file for an Identifier matching `name` that sits inside
// any JSX subtree (element, fragment, attribute, or expression container).
// This is the derived proof that a constant reaches the rendered DOM,
// rather than being internal-only data (e.g. a status-transition table).
function isReferencedInJsx(sourceFile, name) {
	let found = false;
	function walk(node, insideJsx) {
		if (found) return;
		const isJsxNode =
			ts.isJsxElement(node) ||
			ts.isJsxSelfClosingElement(node) ||
			ts.isJsxFragment(node) ||
			ts.isJsxExpression(node) ||
			ts.isJsxAttribute(node);
		const nowInside = insideJsx || isJsxNode;
		if (nowInside && ts.isIdentifier(node) && node.getText() === name) {
			found = true;
			return;
		}
		ts.forEachChild(node, (child) => walk(child, nowInside));
	}
	walk(sourceFile, false);
	return found;
}

// Finds every module-level `const NAME: Record<K, string> = {...}` or
// `const NAME: Record<K, { ...all-string-members... }> = {...}` (with an
// optional one-level `Partial<...>` wrapper) in the file. Each entry
// carries the flattened list of string-literal leaves (dotted key path,
// value, and the AST node to report against).
function detectLabelMaps(sourceFile) {
	const maps = [];
	function walk(node) {
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isObjectLiteralExpression(node.initializer) &&
			node.type
		) {
			const valueType = unwrapRecordValueType(node.type);
			const flat = isFlatStringType(valueType);
			const nested = !flat && isNestedStringRecordType(valueType);
			if (flat || nested) {
				const name = node.name.getText();
				const leaves = [];
				for (const prop of node.initializer.properties) {
					if (!ts.isPropertyAssignment(prop)) continue;
					const keyName = prop.name.getText();
					if (flat) {
						if (ts.isStringLiteral(prop.initializer)) {
							leaves.push({
								keyPath: `${name}.${keyName}`,
								node: prop.initializer,
								value: prop.initializer.text,
							});
						}
					} else if (ts.isObjectLiteralExpression(prop.initializer)) {
						for (const inner of prop.initializer.properties) {
							if (
								ts.isPropertyAssignment(inner) &&
								ts.isStringLiteral(inner.initializer)
							) {
								leaves.push({
									keyPath: `${name}.${keyName}.${inner.name.getText()}`,
									node: inner.initializer,
									value: inner.initializer.text,
								});
							}
						}
					}
				}
				maps.push({ name, leaves });
			}
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return maps;
}

function scanFile(filePath) {
	const violations = [];
	const text = fs.readFileSync(filePath, "utf8");
	const sourceFile = ts.createSourceFile(
		filePath,
		text,
		ts.ScriptTarget.Latest,
		true,
		filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	function report(node, literal, kind) {
		if (isAllowlisted(literal)) return;
		if (hasInlineAllow(sourceFile, node)) return;
		const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		violations.push({
			file: path.relative(ROOT, filePath),
			line: line + 1,
			kind,
			text: literal.trim().slice(0, 80),
		});
	}

	function visit(node) {
		// 1. JSX text nodes
		if (ts.isJsxText(node)) {
			const raw = node.getText();
			if (hasEnglishWord(raw)) {
				report(node, raw, "jsx-text");
			}
		}

		// 2. JSX attributes: aria-label / placeholder / title / alt
		if (ts.isJsxAttribute(node)) {
			const attrName = node.name.getText();
			if (ATTRS_TO_CHECK.has(attrName) && node.initializer) {
				let expr = node.initializer;
				// `title={\`...\`}` is a JsxExpression wrapping the template.
				if (
					ts.isJsxExpression(expr) &&
					expr.expression &&
					(ts.isTemplateExpression(expr.expression) ||
						ts.isNoSubstitutionTemplateLiteral(expr.expression))
				) {
					expr = expr.expression;
				}
				if (ts.isStringLiteral(expr)) {
					const val = expr.text;
					if (hasEnglishWord(val)) {
						report(expr, val, `attr:${attrName}`);
					}
				} else if (ts.isNoSubstitutionTemplateLiteral(expr)) {
					const val = expr.text;
					if (hasEnglishWord(val)) {
						report(expr, val, `attr:${attrName}:template`);
					}
				} else if (ts.isTemplateExpression(expr)) {
					// Only the static text spans matter — the `head` chunk and
					// each `middle`/`tail` literal chunk between `${...}`
					// substitutions. Substitution expressions themselves
					// (e.g. `t("checkpoint")`) are deliberately NOT inspected
					// here: they are runtime values, not hardcoded copy, and
					// flagging them would produce false positives on every
					// legitimate `${t(...)}` interpolation.
					const staticSpans = [
						expr.head.text,
						...expr.templateSpans.map((span) => span.literal.text),
					];
					for (const span of staticSpans) {
						if (hasEnglishWord(span)) {
							report(expr, span, `attr:${attrName}:template`);
							break; // one violation per attribute is enough
						}
					}
				}
			}
		}

		// 3. Hardcoded locale tags, e.g. date.toLocaleDateString("en-US")
		//    AND no-arg locale calls, e.g. date.toLocaleDateString() — the
		//    latter silently falls back to the system/browser locale instead
		//    of the user's next-intl locale, which is the same defect
		//    (a date that ignores the user's language) invisible until now.
		if (
			ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression) &&
			LOCALE_METHODS.has(node.expression.name.getText())
		) {
			const methodName = node.expression.name.getText();
			if (node.arguments.length === 0) {
				report(
					node,
					`${methodName}() called with no arguments — falls back to system locale, not the user's next-intl locale. Pass useLocale() or use next-intl useFormatter().`,
					"implicit-locale",
				);
			}
			for (const arg of node.arguments) {
				if (ts.isStringLiteral(arg) && LOCALE_TAG_RE.test(arg.text)) {
					report(arg, arg.text, "hardcoded-locale");
				}
			}
		}
		if (
			ts.isNewExpression(node) &&
			node.expression.getText() === "Intl.DateTimeFormat"
		) {
			for (const arg of node.arguments || []) {
				if (ts.isStringLiteral(arg) && LOCALE_TAG_RE.test(arg.text)) {
					report(arg, arg.text, "hardcoded-locale");
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	// 4. Module-level constant label maps rendered via a JSX expression
	//    (see CONTROL 1c above for the full discrimination rationale).
	for (const map of detectLabelMaps(sourceFile)) {
		if (map.leaves.length === 0) continue;
		const referenced = isReferencedInJsx(sourceFile, map.name);
		if (!referenced) continue; // condition (c): never proven to reach JSX
		for (const leaf of map.leaves) {
			if (!hasEnglishWord(leaf.value)) continue;
			if (isEnumOrClassLikeToken(leaf.value)) continue;
			if (isTranslationKeyPath(leaf.value)) continue;
			if (isHexColor(leaf.value)) continue;
			if (isCamelCaseIdentifierToken(leaf.value)) continue;
			report(leaf.node, leaf.value, `label-map:${leaf.keyPath}`);
		}
	}
	return violations;
}

function runControl1LiteralScan() {
	const files = deriveTargetFiles();

	// Fail loud on zero files scanned — a control that scans nothing must
	// never report a clean bill of health.
	if (files.length === 0) {
		return {
			ok: false,
			fatal: true,
			message:
				`check-translations Control 1: FATAL — 0 files scanned across scan roots:\n` +
				SCAN_ROOTS.map((r) => `  - ${r}`).join("\n") +
				"\nThis is a control failure, not a pass. Check SCAN_ROOTS paths.",
		};
	}

	let allViolations = [];
	const readErrors = [];
	for (const file of files) {
		try {
			allViolations = allViolations.concat(scanFile(file));
		} catch (err) {
			readErrors.push({ file: path.relative(ROOT, file), error: String(err) });
		}
	}

	if (readErrors.length > 0) {
		return {
			ok: false,
			fatal: true,
			message:
				`check-translations Control 1: FATAL — ${readErrors.length} file(s) could not be parsed:\n` +
				readErrors.map((e) => `  - ${e.file}: ${e.error}`).join("\n"),
		};
	}

	return {
		ok: allViolations.length === 0,
		fatal: false,
		filesScanned: files.length,
		violations: allViolations,
	};
}

// ---------------------------------------------------------------------------
// CONTROL 2 — key parity across ALL declared locales (derived, not typed)
// ---------------------------------------------------------------------------

// Locales are parsed straight out of i18n/routing.ts — never retyped here.
// The original en/fr-only version of this check called an en/fr pair
// "parity" and blessed the `chat` namespace being absent from de/it/es/pt/ru.
function deriveLocales() {
	const routingPath = path.join(ROOT, "i18n", "routing.ts");
	if (!fs.existsSync(routingPath)) {
		return { ok: false, error: `i18n/routing.ts not found at ${routingPath}` };
	}
	const source = fs.readFileSync(routingPath, "utf8");
	const match = source.match(/locales:\s*\[([^\]]+)\]/);
	if (!match) {
		return {
			ok: false,
			error:
				"could not parse `locales: [...]` out of i18n/routing.ts — routing.ts shape changed, update the regex in deriveLocales()",
		};
	}
	const locales = Array.from(match[1].matchAll(/["']([a-z-]+)["']/g)).map(
		(m) => m[1],
	);
	if (locales.length === 0) {
		return { ok: false, error: "parsed 0 locales out of i18n/routing.ts" };
	}
	return { ok: true, locales };
}

// Flattens a nested messages object into dotted key -> value pairs.
function flattenMessages(obj, prefix = "") {
	const out = {};
	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(out, flattenMessages(value, fullKey));
		} else {
			out[fullKey] = value;
		}
	}
	return out;
}

function loadLocaleMessages(locale) {
	const filePath = path.join(ROOT, "messages", `${locale}.json`);
	if (!fs.existsSync(filePath)) {
		return { ok: false, error: `messages/${locale}.json not found` };
	}
	let parsed;
	try {
		parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (err) {
		return {
			ok: false,
			error: `messages/${locale}.json failed to parse: ${err}`,
		};
	}
	return { ok: true, flat: flattenMessages(parsed) };
}

function runControl2KeyParity() {
	const localesResult = deriveLocales();
	if (!localesResult.ok) {
		return {
			ok: false,
			fatal: true,
			message: `check-translations Control 2: FATAL — ${localesResult.error}`,
		};
	}
	const locales = localesResult.locales;

	const perLocale = {};
	for (const locale of locales) {
		const loaded = loadLocaleMessages(locale);
		if (!loaded.ok) {
			return {
				ok: false,
				fatal: true,
				message: `check-translations Control 2: FATAL — ${loaded.error}`,
			};
		}
		perLocale[locale] = loaded.flat;
	}

	// Union of every key seen across every locale.
	const unionKeys = new Set();
	for (const locale of locales) {
		for (const key of Object.keys(perLocale[locale])) unionKeys.add(key);
	}

	const violations = [];
	for (const key of unionKeys) {
		for (const locale of locales) {
			if (!(key in perLocale[locale])) {
				violations.push({ key, locale, issue: "missing" });
			}
		}
	}

	return {
		ok: violations.length === 0,
		fatal: false,
		locales,
		keysUnion: unionKeys.size,
		violations,
	};
}

// ---------------------------------------------------------------------------
// CONTROL 3 — fr value byte-identical to en value = RED (forgotten
// translation / copy-paste). This is intentionally a hard failure, not a
// warning: legitimate exceptions (proper nouns, "Convex", "OK") must be
// declared explicitly below, same shape as the `i18n-allow` mechanism used
// by Control 1. A silent pass-through would recreate exactly the defect
// this control exists to catch.
// ---------------------------------------------------------------------------

const FR_EN_IDENTICAL_ALLOW = {
	// "<dotted.key>": "<reason>"
};

function runControl3FrEqualsEn() {
	const en = loadLocaleMessages("en");
	const fr = loadLocaleMessages("fr");
	if (!en.ok) {
		return {
			ok: false,
			fatal: true,
			message: `check-translations Control 3: FATAL — ${en.error}`,
		};
	}
	if (!fr.ok) {
		return {
			ok: false,
			fatal: true,
			message: `check-translations Control 3: FATAL — ${fr.error}`,
		};
	}

	const violations = [];
	for (const [key, enValue] of Object.entries(en.flat)) {
		if (!(key in fr.flat)) continue; // Control 2 already flags this
		const frValue = fr.flat[key];
		if (typeof enValue !== "string" || typeof frValue !== "string") continue;
		if (enValue.trim().length === 0) continue; // empty strings are not copy
		if (enValue !== frValue) continue;
		if (FR_EN_IDENTICAL_ALLOW[key]) continue; // declared exception
		violations.push({ key, value: enValue });
	}

	return {
		ok: violations.length === 0,
		fatal: false,
		violations,
	};
}

// ---------------------------------------------------------------------------
// CONTROL 4 — keys the CODE calls that no locale defines. See the module
// doc-comment above for the full reasoning: Control 2 only catches
// asymmetry BETWEEN locales, never a key absent from all seven at once.
// ---------------------------------------------------------------------------

// Finds `const <name> = useTranslations("<ns>")` / `const <name> = await
// getTranslations("<ns>")` bindings in a file. Returns a map of binding name
// -> namespace (empty string for the no-namespace root form, which is a
// deliberate, resolvable case — NOT unresolved). A binding whose namespace
// argument exists but is not a string literal (e.g. `useTranslations(ns)`
// where `ns` is a variable) is reported as unresolved at the binding site
// itself, because every `t()` call through that binding is then
// unresolvable too.
function detectTranslationBindings(sourceFile) {
	const bindings = new Map(); // name -> namespace string
	const unresolvedBindings = []; // { line, reason }

	function unwrapAwait(node) {
		return ts.isAwaitExpression(node) ? node.expression : node;
	}

	function walk(node) {
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isIdentifier(node.name)
		) {
			const init = unwrapAwait(node.initializer);
			if (
				ts.isCallExpression(init) &&
				ts.isIdentifier(init.expression) &&
				(init.expression.text === "useTranslations" ||
					init.expression.text === "getTranslations")
			) {
				const bindingName = node.name.text;
				if (init.arguments.length === 0) {
					// No-namespace form: `t("some.full.path")` keys are already
					// full dotted paths — namespace is legitimately "".
					bindings.set(bindingName, "");
				} else if (ts.isStringLiteral(init.arguments[0])) {
					bindings.set(bindingName, init.arguments[0].text);
				} else {
					const { line } = sourceFile.getLineAndCharacterOfPosition(
						init.getStart(),
					);
					unresolvedBindings.push({
						line: line + 1,
						reason: `${init.expression.text}(<non-literal namespace>) — every t() call through "${bindingName}" is unresolvable`,
					});
				}
			}
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return { bindings, unresolvedBindings };
}

// Finds every `<bindingName>("<key>")` call in the file, for bindingNames
// known to be translation functions (from detectTranslationBindings). A
// call whose first argument is not a string literal (variable, template
// with substitutions, computed member expression, ...) is UNRESOLVABLE —
// reported by name and line, never silently dropped.
function detectTranslationCalls(sourceFile, bindingNames) {
	const calls = []; // { bindingName, key, line }
	const unresolvedCalls = []; // { bindingName, line, reason }

	function walk(node) {
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			bindingNames.has(node.expression.text) &&
			node.arguments.length > 0
		) {
			const arg = node.arguments[0];
			const { line } = sourceFile.getLineAndCharacterOfPosition(
				node.getStart(),
			);
			const bindingName = node.expression.text;
			if (ts.isStringLiteral(arg)) {
				calls.push({ bindingName, key: arg.text, line: line + 1 });
			} else if (ts.isNoSubstitutionTemplateLiteral(arg)) {
				calls.push({ bindingName, key: arg.text, line: line + 1 });
			} else {
				unresolvedCalls.push({
					bindingName,
					line: line + 1,
					reason: `${bindingName}(${arg.getText().slice(0, 60)}) — key not a static string literal`,
				});
			}
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return { calls, unresolvedCalls };
}

function runControl4CalledButUndefined() {
	const localesResult = deriveLocales();
	if (!localesResult.ok) {
		return {
			ok: false,
			fatal: true,
			message: `check-translations Control 4: FATAL — ${localesResult.error}`,
		};
	}
	const locales = localesResult.locales;

	const perLocale = {};
	for (const locale of locales) {
		const loaded = loadLocaleMessages(locale);
		if (!loaded.ok) {
			return {
				ok: false,
				fatal: true,
				message: `check-translations Control 4: FATAL — ${loaded.error}`,
			};
		}
		perLocale[locale] = loaded.flat;
	}

	const files = deriveTargetFiles();
	if (files.length === 0) {
		return {
			ok: false,
			fatal: true,
			message:
				"check-translations Control 4: FATAL — 0 files scanned, cannot resolve t() calls against locales.",
		};
	}

	const violations = []; // { file, line, path, missingLocales }
	const unresolved = []; // { file, line, reason }
	const readErrors = [];

	for (const file of files) {
		let sourceFile;
		try {
			const text = fs.readFileSync(file, "utf8");
			sourceFile = ts.createSourceFile(
				file,
				text,
				ts.ScriptTarget.Latest,
				true,
				file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
			);
		} catch (err) {
			readErrors.push({ file: path.relative(ROOT, file), error: String(err) });
			continue;
		}

		const relFile = path.relative(ROOT, file);
		const { bindings, unresolvedBindings } =
			detectTranslationBindings(sourceFile);
		for (const u of unresolvedBindings) {
			unresolved.push({ file: relFile, line: u.line, reason: u.reason });
		}
		if (bindings.size === 0) continue;

		const { calls, unresolvedCalls } = detectTranslationCalls(
			sourceFile,
			new Set(bindings.keys()),
		);
		for (const u of unresolvedCalls) {
			unresolved.push({ file: relFile, line: u.line, reason: u.reason });
		}

		for (const call of calls) {
			const ns = bindings.get(call.bindingName);
			const dottedPath = ns ? `${ns}.${call.key}` : call.key;
			const missingLocales = locales.filter(
				(locale) => !(dottedPath in perLocale[locale]),
			);
			if (missingLocales.length > 0) {
				violations.push({
					file: relFile,
					line: call.line,
					path: dottedPath,
					missingLocales,
				});
			}
		}
	}

	if (readErrors.length > 0) {
		return {
			ok: false,
			fatal: true,
			message:
				`check-translations Control 4: FATAL — ${readErrors.length} file(s) could not be parsed:\n` +
				readErrors.map((e) => `  - ${e.file}: ${e.error}`).join("\n"),
		};
	}

	return {
		ok: violations.length === 0,
		fatal: false,
		filesScanned: files.length,
		violations,
		unresolved,
	};
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
	const jsonMode = process.argv.includes("--json");
	const control1 = runControl1LiteralScan();
	const control2 = runControl2KeyParity();
	const control3 = runControl3FrEqualsEn();
	const control4 = runControl4CalledButUndefined();

	const fatal = [control1, control2, control3, control4].find((c) => c.fatal);
	if (fatal) {
		console.error(fatal.message);
		process.exit(2);
	}

	const results = { control1, control2, control3, control4 };

	if (jsonMode) {
		console.log(JSON.stringify(results, null, 2));
	} else {
		console.error(
			`Control 1 (hardcoded literals): ${control1.ok ? "PASS" : "FAIL"} — ${control1.filesScanned} files scanned, ${control1.violations.length} violation(s)`,
		);
		if (!control1.ok) {
			for (const v of control1.violations) {
				console.error(`  ${v.file}:${v.line} [${v.kind}] "${v.text}"`);
			}
		}

		console.error(
			`Control 2 (key parity across ${control2.locales.join(", ")}): ${control2.ok ? "PASS" : "FAIL"} — ${control2.keysUnion} keys in union, ${control2.violations.length} violation(s)`,
		);
		if (!control2.ok) {
			for (const v of control2.violations) {
				console.error(`  ${v.key} — ${v.issue} in [${v.locale}]`);
			}
		}

		console.error(
			`Control 3 (fr === en byte-identical): ${control3.ok ? "PASS" : "FAIL"} — ${control3.violations.length} violation(s)`,
		);
		if (!control3.ok) {
			for (const v of control3.violations) {
				console.error(`  ${v.key} — fr value identical to en: "${v.value}"`);
			}
		}

		console.error(
			`Control 4 (called but undefined): ${control4.ok ? "PASS" : "FAIL"} — ${control4.filesScanned} files scanned, ${control4.violations.length} violation(s), ${control4.unresolved.length} unresolvable dynamic t() call(s)`,
		);
		if (!control4.ok) {
			for (const v of control4.violations) {
				console.error(
					`  ${v.file}:${v.line} "${v.path}" — missing in [${v.missingLocales.join(", ")}]`,
				);
			}
		}
		if (control4.unresolved.length > 0) {
			console.error(
				`  check-translations Control 4: ${control4.unresolved.length} dynamic t() call(s) not statically resolvable — verify by hand:`,
			);
			for (const u of control4.unresolved) {
				console.error(`    ${u.file}:${u.line} — ${u.reason}`);
			}
		}
	}

	const allOk = control1.ok && control2.ok && control3.ok && control4.ok;
	process.exit(allOk ? 0 : 1);
}

if (require.main === module) {
	main();
}

module.exports = {
	scanFile,
	listFiles,
	deriveTargetFiles,
	deriveLocales,
	flattenMessages,
	loadLocaleMessages,
	runControl1LiteralScan,
	runControl2KeyParity,
	runControl3FrEqualsEn,
	runControl4CalledButUndefined,
	detectTranslationBindings,
	detectTranslationCalls,
	main,
};

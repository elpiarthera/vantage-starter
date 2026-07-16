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
 *  to its `en` value — a POSSIBLE forgotten translation or copy-paste.
 *  This is SIGNALED, not gated: measured on this codebase, ~100% of
 *  fr===en occurrences are true French/English cognates (Description,
 *  Type, Menu...), proper nouns/product names (Convex, MiniMax Speech 2.8
 *  HD, WhatsApp...), named style-catalog labels (Vintage, Film Noir...),
 *  ICU/format templates (`{count, plural, ...}`), or raw technical
 *  identifiers (URLs, placeholder example tokens). A control whose
 *  findings are essentially never real defects cannot be a build gate: it
 *  cries wolf, CI goes permanently red, and the team disables the whole
 *  script — the guard then protects nothing, including Controls 1/2/4
 *  which ARE reliable. So Control 3 always reports its findings (for human
 *  review) but never fails the build; see `allOk` in `main()`.
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
 * Allowlist (Control 3): Control 3 is a SIGNAL, not a gate (see doc-comment
 * on `runControl3FrEqualsEn` for the measured false-positive analysis).
 * Exclusions from its reported list are still never silent — each is a
 * named, derived rule (ICU/format templates, raw technical identifiers) or
 * a declared value in `FR_EN_IDENTICAL_ALLOW`, each with a reason. Keys can
 * repeat the same fr/en string (e.g. "Description" used across a dozen
 * unrelated screens), so the allowlist is keyed by VALUE, not by key — one
 * declared reason covers every occurrence of that exact string.
 */

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Overridable for test isolation only (the gating probe needs a controlled
// fixture tree to prove the exit code in both directions without depending
// on this repo's ambient, possibly-dirty working tree). Production runs
// (`node scripts/check-translations.js`) never set this and get the real repo root.
const ROOT = process.env.CHECK_TRANSLATIONS_ROOT || path.join(__dirname, "..");

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
	// Tech-stack proper nouns rendered from `components/landing/TechStackSection.tsx`
	// `TECH_STACK[].name` — product/brand names, never translated.
	"Next.js",
	"Vercel AI SDK",
	"fal.ai",
	"Firecrawl",
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

// ---------------------------------------------------------------------------
// date-fns `format(date, pattern)` locale-sensitivity discrimination — the
// SEVENTH blind spot: `format(targetDate, "PPP")` with no `{ locale }` option
// silently renders en-US, the exact same defect class as the no-arg
// `toLocaleDateString()` case above, but through a different library. The
// hard part is NOT flagging `format(startDate, "yyyy-MM-dd")`
// (create-mission-modal.tsx:414/471) — a machine-readable ISO date for a
// form `<input type="date">` value, locale-independent BY DESIGN. The
// discriminator is the PATTERN's token shape, never the call site: tokenize
// the format string into runs of identical letters (skipping `'literal'`
// spans, which date-fns itself treats as fixed text), then a run is
// locale-sensitive only when it renders a NAME or an ORDINAL rather than a
// zero-padded number — `P`/`p` (localized date/time presets, always
// locale-based), `E` (weekday name, always locale-based), `o` (ordinal
// number: "1st" vs "1er", locale-dependent), or `M`/`L`/`c`/`q`/`Q` runs of
// length >= 3 (month/weekday/quarter NAME forms — `MMM`/`MMMM`, as opposed to
// the 1-2 length zero-padded NUMBER forms `M`/`MM`). This is exactly why
// "yyyy-MM-dd" (`y` len4, `M` len2, `d` len2) never matches: every run is a
// fixed-width number, never a name or ordinal.
// ---------------------------------------------------------------------------

function tokenizeDateFnsPattern(pattern) {
	const runs = [];
	let i = 0;
	while (i < pattern.length) {
		const ch = pattern[i];
		if (ch === "'") {
			// Literal text span (date-fns escape) — never a token, skip verbatim.
			let j = i + 1;
			while (j < pattern.length && pattern[j] !== "'") j++;
			i = j + 1;
			continue;
		}
		if (/[A-Za-z]/.test(ch)) {
			let j = i;
			while (j < pattern.length && pattern[j] === ch) j++;
			runs.push({ char: ch, len: j - i });
			i = j;
		} else {
			i++;
		}
	}
	return runs;
}

function isLocaleSensitiveDateFnsPattern(pattern) {
	const runs = tokenizeDateFnsPattern(pattern);
	for (const { char, len } of runs) {
		if (char === "P" || char === "p") return true; // localized date/time preset
		if (char === "E") return true; // weekday name
		if (char === "o") return true; // ordinal suffix ("1st" vs "1er")
		if ((char === "M" || char === "L") && len >= 3) return true; // month name
		if (char === "c" && len >= 3) return true; // standalone weekday name
		if ((char === "q" || char === "Q") && len >= 4) return true; // quarter name
	}
	return false;
}

// Resolves the LOCAL binding name(s) `format` is imported as from
// `"date-fns"` in this file — named import (`import { format } from
// "date-fns"`), aliased named import (`import { format as fmt } from
// "date-fns"`), and subpath default import (`import format from
// "date-fns/format"`, whose exported name is derived from the subpath
// itself, never retyped). Never matches a same-named local `format` helper
// unrelated to date-fns — the import binding is the derived proof, not the
// bare identifier spelling. `import * as dateFns from "date-fns"` is a
// distinct clause shape (`NamespaceImport`, not `NamedImports`) resolved
// separately by `detectDateFnsNamespaceImports` + the `3d` call-site check.
function detectDateFnsFormatImportNames(sourceFile) {
	const names = new Set();
	function walk(node) {
		if (
			ts.isImportDeclaration(node) &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			const spec = node.moduleSpecifier.text;
			if (
				spec === "date-fns" &&
				node.importClause &&
				node.importClause.namedBindings &&
				ts.isNamedImports(node.importClause.namedBindings)
			) {
				for (const el of node.importClause.namedBindings.elements) {
					const imported = el.propertyName
						? el.propertyName.text
						: el.name.text;
					if (imported === "format") names.add(el.name.text);
				}
			}
			if (spec === "date-fns/format" && node.importClause?.name) {
				names.add(node.importClause.name.text);
			}
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return names;
}

// date-fns functions that ALWAYS render human-readable prose — every output is
// locale-sensitive by definition (relative/distance phrases, localized weekday
// or month names rendered as words). Unlike `format`, there is NO pattern
// argument to discriminate: ANY call with no { locale } option silently falls
// back to en-US prose. `lightFormat` is intentionally excluded: it only
// accepts numeric-only format tokens (no P/E/MMM/o), produces zero-padded
// numbers, and never renders prose names — it is locale-safe by design.
// `intlFormatDistance` delegates to `Intl.RelativeTimeFormat` and therefore
// always renders prose in the runtime locale — it belongs here.
const ALWAYS_PROSE_DATE_FNS_FUNS = new Set([
	"formatDistance",
	"formatDistanceToNow",
	"formatDistanceStrict",
	"formatDistanceToNowStrict",
	"formatRelative",
	"formatDuration",
	"intlFormatDistance",
]);

// Returns true if any argument to `callNode` is an ObjectLiteralExpression
// carrying a `locale` property (as a named assignment or shorthand). Covers
// every call-site shape regardless of which positional argument holds the
// options object — `format(d, p, { locale })` AND
// `formatDistanceToNow(d, { addSuffix: true, locale })` both return true.
function callHasLocaleOption(callNode) {
	for (const arg of callNode.arguments) {
		if (!ts.isObjectLiteralExpression(arg)) continue;
		for (const prop of arg.properties) {
			let propName = null;
			if (
				ts.isPropertyAssignment(prop) ||
				ts.isShorthandPropertyAssignment(prop)
			) {
				propName = prop.name.getText();
			}
			if (propName === "locale") return true;
		}
	}
	return false;
}

// Resolves the LOCAL binding name(s) for ALWAYS-PROSE date-fns functions
// imported in this file. Returns a Map<localName, canonicalFunctionName> so
// the reporter can name the canonical function in its message. Covers:
//   Named imports:   import { formatDistanceToNow } from "date-fns"
//   Aliased imports: import { formatDistanceToNow as dist } from "date-fns"
//   Subpath imports: import formatDistanceToNow from "date-fns/formatDistanceToNow"
// Never matches a same-named local helper unrelated to date-fns — the import
// binding is the derived proof, not the bare identifier spelling.
function detectDateFnsProseImportNames(sourceFile) {
	const names = new Map(); // localName -> canonicalFunctionName
	function walk(node) {
		if (
			ts.isImportDeclaration(node) &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			const spec = node.moduleSpecifier.text;
			if (
				spec === "date-fns" &&
				node.importClause &&
				node.importClause.namedBindings &&
				ts.isNamedImports(node.importClause.namedBindings)
			) {
				for (const el of node.importClause.namedBindings.elements) {
					const imported = el.propertyName
						? el.propertyName.text
						: el.name.text;
					if (ALWAYS_PROSE_DATE_FNS_FUNS.has(imported)) {
						names.set(el.name.text, imported);
					}
				}
			}
			// Subpath import: import formatDistanceToNow from "date-fns/formatDistanceToNow"
			const subpathMatch = spec.match(/^date-fns\/(.+)$/);
			if (subpathMatch) {
				const canonical = subpathMatch[1];
				if (
					ALWAYS_PROSE_DATE_FNS_FUNS.has(canonical) &&
					node.importClause &&
					node.importClause.name
				) {
					names.set(node.importClause.name.text, canonical);
				}
			}
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return names;
}

// Resolves the LOCAL binding name(s) a `date-fns` NAMESPACE import is bound
// to in this file — `import * as dateFns from "date-fns"`. Every member
// access off this binding (`dateFns.format(...)`, `dateFns.formatDistanceToNow(...)`)
// is resolved at the call site (see the `3d` check in `scanFile`), not
// pre-expanded here, because the namespace object exposes every date-fns
// export, not just the prose-returning subset. This closes the import shape
// neither `detectDateFnsFormatImportNames` nor `detectDateFnsProseImportNames`
// can see: both match a `NamedImports` clause, so `import * as dateFns` (a
// `NamespaceImport` clause) walks past both, silently, without this.
function detectDateFnsNamespaceImports(sourceFile) {
	const names = new Set();
	function walk(node) {
		if (
			ts.isImportDeclaration(node) &&
			ts.isStringLiteral(node.moduleSpecifier) &&
			node.moduleSpecifier.text === "date-fns" &&
			node.importClause &&
			node.importClause.namedBindings &&
			ts.isNamespaceImport(node.importClause.namedBindings)
		) {
			names.add(node.importClause.namedBindings.name.text);
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return names;
}

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

// ---------------------------------------------------------------------------
// CONTROL 1f — module-level ARRAY-OF-OBJECTS copy (e.g. `const quickLinks =
// [{ label: "Dashboard", href: "/dashboard" }, ...]` rendered as
// `{link.label}`). This is a different AST shape than Control 1c/1d
// (`Record<K, string>` / `Record<K, {...string members}>`): an array literal
// of object literals, usually with NO type annotation at all (the element
// shape is inferred), so `detectLabelMaps` (which requires a `Record<...>`
// type node) never sees it. Measured blind spot: `components/search-modal.tsx`
// `quickLinks[].label` ("Dashboard", "Chat", "Missions", "Architect",
// "Settings", rendered `{link.label}` at line 255) and
// `components/design-system/menu-picker.tsx` `MENU_OPTIONS[].label`
// ("Default / Solid", ...) both scored 0 hits.
//
// Reach-JSX proof, generalized (not a filename list): `isReferencedInJsx`
// (used by Control 1c/1d) requires the CONSTANT's own identifier to appear
// inside JSX. That is too narrow here: `menu-picker.tsx` never writes
// `MENU_OPTIONS` inside JSX — it renders `currentMenu?.label`, where
// `currentMenu = MENU_OPTIONS.find(...)`, one indirection away. What is
// invariant across every array-of-objects copy site is the PROPERTY NAME
// itself being read via property access inside JSX — `link.label`,
// `currentMenu?.label`, `lang.label` all read `.label` in JSX regardless of
// which local variable holds the array element. `isPropertyNameReferencedInJsx`
// below proves that invariant directly, rather than assuming a fixed
// indirection depth.
// ---------------------------------------------------------------------------

// Copy-bearing property names considered: identical set used across the
// literal-scan attribute check (title, alt, placeholder) plus the additional
// names an array-of-objects copy table commonly uses for its rendered text.
const OBJECT_COPY_PROPERTY_NAMES = new Set([
	"label",
	"title",
	"name",
	"text",
	"heading",
	"description",
	"placeholder",
	"alt",
]);

// Walks the whole file for a PropertyAccessExpression (including optional
// chaining, e.g. `currentMenu?.label`) whose accessed member is `propName`,
// sitting inside any JSX subtree. This is the generalized "reaches JSX" proof
// for Control 1f: it holds regardless of how many local variables sit between
// the array declaration and the JSX read.
function isPropertyNameReferencedInJsx(sourceFile, propName) {
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
		if (
			nowInside &&
			ts.isPropertyAccessExpression(node) &&
			node.name.getText() === propName
		) {
			found = true;
			return;
		}
		ts.forEachChild(node, (child) => walk(child, nowInside));
	}
	walk(sourceFile, false);
	return found;
}

// Counts every Identifier in the file matching `name` (including the
// declaration itself). A module-level array declared but never used again
// (count === 1) cannot reach JSX by any indirection, so it is not worth
// walking further — this is the "actually used somewhere" sanity check that
// pairs with the property-name-in-JSX proof above.
function countIdentifierUsages(sourceFile, name) {
	let count = 0;
	function walk(node) {
		if (ts.isIdentifier(node) && node.getText() === name) count++;
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return count;
}

// A string literal value that is EXACTLY one of the declared locale codes
// (`i18n/routing.ts`). Locale-picker tables (`SUPPORTED_LANGUAGES`,
// `localeMeta`) legitimately hardcode each language's OWN name in that
// language ("Deutsch", "Français", "Русский") — a language picker always
// renders each entry endonym-first, so translating "Deutsch" into French
// would be the defect, not the fix. Derived from `i18n/routing.ts`, never a
// hardcoded filename list, so it generalizes to any future locale-keyed table.
function isLocaleKeyedObject(objLiteral, localeCodes) {
	if (localeCodes.size === 0) return false;
	for (const prop of objLiteral.properties) {
		if (
			ts.isPropertyAssignment(prop) &&
			ts.isStringLiteral(prop.initializer) &&
			localeCodes.has(prop.initializer.text)
		) {
			return true;
		}
	}
	return false;
}

// Finds every module-level `const NAME = [ { ...copy props... }, ... ]` array
// literal in the file. Each entry carries the flattened list of copy-bearing
// string-literal leaves (dotted keyPath, the property name itself, the AST
// node to report against, and the value).
function detectArrayObjectCopyMaps(sourceFile, localeCodes) {
	const maps = [];
	function walk(node) {
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isArrayLiteralExpression(node.initializer) &&
			ts.isIdentifier(node.name)
		) {
			const arr = node.initializer;
			const objElements = arr.elements.filter((el) =>
				ts.isObjectLiteralExpression(el),
			);
			if (objElements.length > 0) {
				const name = node.name.text;
				const leaves = [];
				objElements.forEach((objLit, idx) => {
					// Exemption: locale-display row — this element renders its own
					// language's endonym by design (see isLocaleKeyedObject doc).
					if (isLocaleKeyedObject(objLit, localeCodes)) return;
					for (const prop of objLit.properties) {
						if (!ts.isPropertyAssignment(prop)) continue;
						const propName = prop.name.getText();
						if (!OBJECT_COPY_PROPERTY_NAMES.has(propName)) continue;
						if (!ts.isStringLiteral(prop.initializer)) continue;
						leaves.push({
							keyPath: `${name}[${idx}].${propName}`,
							propName,
							node: prop.initializer,
							value: prop.initializer.text,
						});
					}
				});
				if (leaves.length > 0) maps.push({ name, leaves });
			}
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return maps;
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

// ---------------------------------------------------------------------------
// CONTROL 1e — bare English string literals inside a JSX *expression
// container* used in CHILD position (`{...}` directly inside an element or
// fragment's children), e.g. `{query ? "Results" : "Quick access"}` or a
// bare `{"Text"}`. Control 1's jsx-text check only sees `ts.JsxText` nodes
// (literal text between tags) and the attr check only sees JSX attribute
// values — a `ts.StringLiteral` sitting inside a `{...}` JSX *child*
// expression is invisible to both. Measured blind spot:
// `components/search-modal.tsx:242` renders
// `{query ? "Results" : "Quick access"}` to the DOM and scored 0 hits.
//
// Discrimination (position, not spelling): a node only qualifies when the
// `JsxExpression` node's PARENT is a `JsxElement` or `JsxFragment` — i.e. the
// `{...}` sits directly in the children list, which is what actually
// renders. This is exactly what excludes, by construction, without any
// spelling-based guesswork:
//   - `t("key")` / `useTranslations(...)` — a `CallExpression`, never a
//     `StringLiteral` leaf, so `collectJsxExpressionLiterals` never
//     collects anything from it (it isn't walked into at all).
//   - `className={cn("flex", isOpen && "hidden")}` — the `JsxExpression`'s
//     parent is the `JsxAttribute`, not a `JsxElement`/`JsxFragment`, so the
//     position check excludes it before any string is even inspected. This
//     is the same reason `style={{ color: "red" }}` and any other prop value
//     is never touched by this check.
// Only three literal shapes are walked, because these are the only shapes
// that hand a plain string straight to the renderer: a bare string/template
// literal (`{"Text"}`), a ternary's branches (`{cond ? "A" : "B"}`,
// recursing through nested ternaries), and a logical-AND/OR's right operand
// (`{cond && "Text"}`). Anything else reachable from the expression — a
// `CallExpression`, `Identifier`, `JsxElement`, a template literal WITH
// substitutions — is deliberately not descended into: it is either a
// function call (data, not a literal), a reference (resolved elsewhere), or
// itself JSX (handled by the normal jsx-text/attr walk when visited).
// `hasEnglishWord` / `isAllowlisted` / the inline `// i18n-allow:` override
// are reused unchanged via the shared `report()` helper below, so
// enum/route/icon-name tokens and declared exceptions behave identically to
// every other Control 1 check.
// ---------------------------------------------------------------------------

function collectJsxExpressionLiterals(expr) {
	const leaves = [];
	function walk(node) {
		if (!node) return;
		if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
			leaves.push(node);
		} else if (ts.isConditionalExpression(node)) {
			walk(node.whenTrue);
			walk(node.whenFalse);
		} else if (
			ts.isBinaryExpression(node) &&
			(node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
				node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
		) {
			walk(node.right);
		} else if (ts.isParenthesizedExpression(node)) {
			walk(node.expression);
		}
		// Deliberately NOT walked: CallExpression (t("key"), cn(...), any
		// function call), Identifier/PropertyAccess (references, resolved
		// elsewhere), JsxElement/JsxFragment (nested markup, walked normally
		// by the outer AST visitor), and TemplateExpression-with-substitutions
		// (has no single static literal leaf to report).
	}
	walk(expr);
	return leaves;
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

	const dateFnsFormatNames = detectDateFnsFormatImportNames(sourceFile);
	const dateFnsProseNames = detectDateFnsProseImportNames(sourceFile);
	const dateFnsNamespaceNames = detectDateFnsNamespaceImports(sourceFile);

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

		// 3a. Bare English string literals inside a JSX expression container
		//    used in CHILD position (see CONTROL 1e above for the full
		//    discrimination rationale — position, not spelling, is what
		//    separates this from `t("key")` calls and attribute values).
		if (
			ts.isJsxExpression(node) &&
			node.expression &&
			(ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
		) {
			for (const leaf of collectJsxExpressionLiterals(node.expression)) {
				const val = leaf.text;
				if (hasEnglishWord(val)) {
					report(leaf, val, "jsx-expression");
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

		// 3b. date-fns `format(date, pattern)` — only when `format` is the
		// name this file actually imported from "date-fns" (never a same-named
		// unrelated local helper). A locale-sensitive pattern (see
		// `isLocaleSensitiveDateFnsPattern` doc-comment above) with no third
		// `{ locale }` argument silently renders en-US. `format(d,
		// "yyyy-MM-dd")` (create-mission-modal.tsx:414/471) is deliberately
		// NEVER flagged: every run in that pattern is a fixed-width number, not
		// a name/ordinal — a machine-readable form value, not user-facing copy.
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			dateFnsFormatNames.has(node.expression.text) &&
			node.arguments.length >= 2
		) {
			const patternArg = node.arguments[1];
			let patternText = null;
			if (
				ts.isStringLiteral(patternArg) ||
				ts.isNoSubstitutionTemplateLiteral(patternArg)
			) {
				patternText = patternArg.text;
			}
			if (
				patternText !== null &&
				isLocaleSensitiveDateFnsPattern(patternText)
			) {
				const hasLocaleOption = node.arguments.length >= 3;
				if (!hasLocaleOption) {
					report(
						node,
						`${node.expression.text}(..., "${patternText}") called with no { locale } option — this date-fns pattern renders a month/weekday name or an ordinal/preset and silently falls back to en-US. Pass { locale } (a date-fns locale object matched to useLocale()) or use next-intl's useFormatter().`,
						"implicit-locale",
					);
				}
			}
		}

		// 3c. date-fns prose functions (formatDistanceToNow, formatDistance,
		//     formatDistanceStrict, formatDistanceToNowStrict, formatRelative,
		//     formatDuration, intlFormatDistance) — ANY call with no { locale }
		//     option silently falls back to en-US prose. No pattern to inspect:
		//     all output is human-readable prose by definition. Derived from
		//     the import binding, never from the bare identifier name, so a
		//     non-date-fns local function named `formatDistanceToNow` is NEVER
		//     flagged.
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			dateFnsProseNames.has(node.expression.text) &&
			!callHasLocaleOption(node)
		) {
			const localName = node.expression.text;
			const canonicalName = dateFnsProseNames.get(localName);
			report(
				node,
				`${localName}(...) called with no { locale } option — ${canonicalName} always renders human-readable prose and silently falls back to en-US. Pass { locale } (a date-fns locale object matched to useLocale()) or use next-intl's useFormatter().`,
				"implicit-locale",
			);
		}

		// 3d. `import * as dateFns from "date-fns"` namespace-import call sites —
		// `dateFns.format(...)` / `dateFns.formatDistanceToNow(...)`. Neither the
		// named-import binding maps (3b/3c) nor `hasEnglishWord`-style spelling
		// matches ever see this shape: the call's callee is a
		// PropertyAccessExpression, never a bare Identifier, so it is resolved
		// here against the SAME two rule sets (pattern discrimination for
		// `format`, always-prose for the rest) rather than duplicating them.
		if (
			ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression) &&
			ts.isIdentifier(node.expression.expression) &&
			dateFnsNamespaceNames.has(node.expression.expression.text)
		) {
			const memberName = node.expression.name.getText();
			if (memberName === "format" && node.arguments.length >= 2) {
				const patternArg = node.arguments[1];
				let patternText = null;
				if (
					ts.isStringLiteral(patternArg) ||
					ts.isNoSubstitutionTemplateLiteral(patternArg)
				) {
					patternText = patternArg.text;
				}
				if (
					patternText !== null &&
					isLocaleSensitiveDateFnsPattern(patternText) &&
					node.arguments.length < 3
				) {
					report(
						node,
						`${node.expression.expression.text}.format(..., "${patternText}") called with no { locale } option — this date-fns pattern renders a month/weekday name or an ordinal/preset and silently falls back to en-US. Pass { locale } (a date-fns locale object matched to useLocale()) or use next-intl's useFormatter().`,
						"implicit-locale",
					);
				}
			} else if (
				ALWAYS_PROSE_DATE_FNS_FUNS.has(memberName) &&
				!callHasLocaleOption(node)
			) {
				report(
					node,
					`${node.expression.expression.text}.${memberName}(...) called with no { locale } option — ${memberName} always renders human-readable prose and silently falls back to en-US. Pass { locale } (a date-fns locale object matched to useLocale()) or use next-intl's useFormatter().`,
					"implicit-locale",
				);
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

	// 5. Module-level array-of-objects copy tables rendered via a JSX
	//    property read (see CONTROL 1f above for the full discrimination
	//    rationale — a different AST shape than #4, usually with no type
	//    annotation at all).
	const localesResult = deriveLocales();
	const localeCodeSet = localesResult.ok
		? new Set(localesResult.locales)
		: new Set();
	for (const map of detectArrayObjectCopyMaps(sourceFile, localeCodeSet)) {
		if (countIdentifierUsages(sourceFile, map.name) < 2) continue; // never used beyond its own declaration
		for (const leaf of map.leaves) {
			if (!hasEnglishWord(leaf.value)) continue;
			if (isEnumOrClassLikeToken(leaf.value)) continue;
			if (isTranslationKeyPath(leaf.value)) continue;
			if (isHexColor(leaf.value)) continue;
			if (isCamelCaseIdentifierToken(leaf.value)) continue;
			if (!isPropertyNameReferencedInJsx(sourceFile, leaf.propName)) continue; // condition (c): never proven to reach JSX
			report(leaf.node, leaf.value, `object-copy:${leaf.keyPath}`);
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
// CONTROL 3 — fr value byte-identical to en value = SIGNALED, NOT GATED.
//
// Measured on this codebase (2026-07, 7 locales, `messages/{en,fr}.json`):
// 161 fr===en occurrences (109 distinct values). Sampling every one of them
// shows essentially none are forgotten translations. They fall into three
// derived buckets, checked in order below:
//
//   1. STRUCTURAL — the value collapses to no real prose once ICU/format
//      placeholders (`{count, plural, ...}`, `{title}`, ...) are stripped,
//      AND what remains has no alphabetic run of 3+ characters. This is the
//      signature of aspect ratios ("16:9"), resolution codes ("4K", "Y2K"),
//      file-format acronyms ("PNG", "WebP"), hex colors ("#FF6B6B"), and
//      bare punctuation ("—") — none of these are translatable copy.
//      Measured false positive closed: `image_generator.model_v3` etc were
//      never real defects, they carry no lowercase word content.
//   2. TECHNICAL IDENTIFIER — a raw URL (`https://...`) or a bare
//      snake_case/kebab example token shown as placeholder text
//      (`voice_id_1`, `occasion`) — these are illustrative values, not UI
//      copy, so translating them would be wrong, not missing.
//      Measured false positive closed: `admin.*.placeholders.image_url` =
//      "https://..." repeated across 4 unrelated admin dialogs.
//   3. DECLARED COGNATES / PROPER NOUNS — `FR_EN_IDENTICAL_ALLOW`, keyed by
//      VALUE (not by key, since the same string repeats across many
//      unrelated keys — e.g. "Description" appears in 12 different dialogs).
//      Grouped by category, each with a reason:
//        - product/brand names never translated in either language
//          (Convex, GitHub, MiniMax Speech 2.8 HD, Qwen 3 TTS, WhatsApp...)
//        - proper nouns: TTS voice names (Aiden, Dylan, Serena...)
//        - named catalog labels acting as proper nouns in this product's own
//          taxonomy (Vintage, Film Noir, Baby Shower — these are the NAME of
//          a style/occasion preset, not a sentence describing one)
//        - true French/English cognates: words spelled identically in both
//          languages by etymology (Description, Type, Menu, Volume,
//          Marketing, Agriculture, Hindi...) — an identical spelling here is
//          correct French, not an oversight
//        - fixed format-template strings whose only non-ICU content is a
//          declared brand name or loanword (`{title} | VantageStarter`,
//          `+{count} bonus` — "bonus" is used unchanged in French)
//
// A control whose findings are ~100% legitimate cannot be a build gate: it
// cries wolf, CI goes permanently red on every run, and the team disables
// the whole script — the guard then protects nothing, including Controls
// 1/2/4 which ARE reliable RED signals. So Control 3 always REPORTS its
// remaining findings (human review signal) but its `ok` field never feeds
// the exit code — see `allOk` in `main()`. Every exclusion below is a named
// rule or a declared value with a reason: nothing is silently dropped.
// ---------------------------------------------------------------------------

// Value -> reason. Keyed by the literal fr/en string (not the dotted key),
// because the exact same string legitimately repeats across unrelated
// screens (e.g. "Description" is a field label reused in a dozen dialogs).
const FR_EN_IDENTICAL_ALLOW = {
	// Product / brand names — never translated in either language.
	Convex: "product name",
	Discord: "product name",
	GitHub: "product name",
	"Next.js": "product name",
	"Next.js 15 + App Router": "product name + version, not prose",
	VantageStarter: "product name",
	"{title} | VantageStarter":
		"page-title template, only variable content is the brand name",
	"MiniMax Speech 2.8 HD": "TTS model name",
	"MiniMax Speech 2.8 Turbo": "TTS model name",
	"Qwen 3 TTS": "TTS model name",
	"Kling O3 Pro": "video model name",
	"Kling v3 Pro": "video model name",
	WhatsApp: "product name",
	Twitter: "product name",
	Facebook: "product name",
	Aa: "typographic type-sample glyph, not copy",

	// Proper nouns — TTS voice names, never translated.
	Aiden: "TTS voice proper name",
	Dylan: "TTS voice proper name",
	Eric: "TTS voice proper name",
	Ryan: "TTS voice proper name",
	Serena: "TTS voice proper name",
	Sohee: "TTS voice proper name",
	Vivian: "TTS voice proper name",
	"Ono Anna": "TTS voice proper name",

	// This product's own style/occasion catalog labels act as proper nouns
	// (the NAME of a preset), not as descriptive prose to translate.
	Vintage: "named style-preset label, proper noun in this product's catalog",
	Storyboard: "named style-preset label",
	Grunge: "named style-preset label",
	Boost: "named style-preset label",
	"Film Noir":
		"named style-preset label (established genre term, unchanged in French)",
	Anime: "named style-preset label (loanword, identical in French)",
	Pop: "named style-preset label",
	"Low Key": "named style-preset label (photography term of art)",
	"Baby Shower":
		"named occasion-preset label (English term used as-is in French)",
	Turbo: "product tier / model badge label",
	Pro: "product tier / model badge label",
	Starter: "plan name, proper noun",
	"v3 (standard)": "model variant label, not prose",

	// True French/English cognates — identical spelling is correct French,
	// not a missed translation.
	Description: "FR/EN cognate",
	Type: "FR/EN cognate",
	Date: "FR/EN cognate",
	Options: "FR/EN cognate",
	Menu: "FR/EN cognate",
	Style: "FR/EN cognate",
	Volume: "FR/EN cognate",
	Distance: "FR/EN cognate",
	Image: "FR/EN cognate",
	Images: "FR/EN cognate",
	Audio: "FR/EN cognate",
	Notifications: "FR/EN cognate",
	Occasion: "FR/EN cognate",
	Contact: "FR/EN cognate",
	Service: "FR/EN cognate",
	Questions: "FR/EN cognate",
	Sessions: "FR/EN cognate",
	Missions: "FR/EN cognate",
	Vision: "FR/EN cognate",
	Global: "FR/EN cognate",
	Brief: "FR/EN cognate",
	Accent: "FR/EN cognate",
	Architect:
		"FR/EN cognate (Architecte -> Architect is a UI proper-noun feature name here)",
	Radial: "FR/EN cognate",
	Auto: "FR/EN cognate",
	Zoom: "FR/EN cognate",
	Pause: "FR/EN cognate",
	Ambiance:
		"FR/EN cognate (French spelling identical, word originates in French)",
	Interjections: "FR/EN cognate",
	Portrait: "FR/EN cognate (word originates in French)",
	Narration: "FR/EN cognate",
	Narrations: "FR/EN cognate",
	"Max Tokens": "ML hyperparameter name, not prose",
	Hindi: "language name, identical in French",
	Marketing: "FR/EN cognate (loanword)",
	Construction: "FR/EN cognate",
	Agriculture: "FR/EN cognate",
	"20-30 min": "UI copy value, abbreviation not translatable prose", // allow-time-estimate: literal i18n content value being allowlisted, not an effort estimate
	"MP4/MOV, 3–10s, max 200MB": "technical file-spec string, not prose",
	"+{count} bonus": "format template; 'bonus' is used unchanged in French",
};

// Structural check: strip ICU/format placeholders (including one level of
// nesting, e.g. ICU plural `{count, plural, one {x} other {y}}`), then
// require at least one 3+ char lowercase alphabetic run in what remains.
// Values with no such run (numbers, aspect ratios, acronyms, hex codes,
// bare punctuation) carry no translatable prose content.
function stripIcuPlaceholders(value) {
	let prev;
	let out = value;
	// Repeat until stable to also unwrap one level of ICU nesting.
	do {
		prev = out;
		out = out.replace(/\{[^{}]*\}/g, "");
	} while (out !== prev && out.includes("{"));
	return out;
}

function hasProseContent(value) {
	const stripped = stripIcuPlaceholders(value).trim();
	if (stripped.length === 0) return false;
	return /[a-z]{3,}/.test(stripped);
}

// Technical-identifier check: raw URLs and bare snake_case/kebab example
// tokens shown as placeholder text are illustrative values, not UI copy.
function isTechnicalIdentifier(value) {
	if (/^https?:\/\//.test(value)) return true;
	if (/^[a-z][a-z0-9_-]*(\n[a-z][a-z0-9_-]*)*$/.test(value)) return true;
	return false;
}

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
		if (!hasProseContent(enValue)) continue; // structural: no real word content
		if (isTechnicalIdentifier(enValue)) continue; // raw URL / example token
		if (Object.hasOwn(FR_EN_IDENTICAL_ALLOW, enValue)) continue; // declared exception
		violations.push({ key, value: enValue });
	}

	// Control 3 never gates the build (see doc-comment above): `ok` is
	// still reported for humans, but is deliberately excluded from `allOk`
	// in `main()`.
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

// ---------------------------------------------------------------------------
// CONTROL 4 static-map resolution — closes the erosion where our own
// recommended fix (converting a hardcoded `label: "Dashboard"` into a
// `labelKey` + `t(map[k].labelKey)` indirection, per Control 1c/1f above)
// moves the CALLED key out of Control 4's static reach. Before this, every
// `t(MAP[k])` / `t(item.labelKey)` call landed in `unresolvable`, merely
// COUNTED — never actually verified against the locale files. Two shapes are
// now resolved:
//
//  (A) `t(SOME_MAP[k])` — SOME_MAP is a module-level `const NAME = { ...:
//      "string", ... }` object literal whose EVERY property value is a
//      string literal (the i18n key, e.g. `menu_option_default_solid`).
//      Every value in the map is a possible resolved key — all are checked.
//  (B) `t(item.propName)` — `item` came, directly or through one level of
//      indirection (`.find(...)`, a `.map()` loop variable, destructuring),
//      from a module-level `const NAME = [ { propName: "string", ... }, ...
//      ]` array-of-objects literal. Rather than tracing the indirection
//      (fragile), this resolves on the INVARIANT that survives every
//      indirection depth: the PROPERTY NAME itself. Every string value ever
//      assigned to `propName` across every array-of-objects const in the
//      file is a possible resolved key.
//
// Real sites this closes: `components/design-system/menu-picker.tsx:89`
// `t(currentMenu.labelKey)`, `components/chat/ModelSelector.tsx:269`
// `t(CATEGORY_LABEL_KEYS[cat])`,
// `app/[locale]/dashboard/consultant/onboard/page.tsx:300`
// `t(SECTOR_I18N_KEYS[s])`, `components/landing/LandingNav.tsx:163,272`
// `t(link.labelKey)`.
//
// Anything else (a `t(\`prefix.${x}\`)` template with substitutions, a
// namespace argument that is a variable, a key sourced from a non-literal
// value, a union-typed template placeholder) remains in `unresolvedCalls` —
// COUNTED AND NAMED, never silently dropped. The goal is the unresolvable
// number visibly going DOWN and being accounted for, not reaching zero.
// ---------------------------------------------------------------------------

// Unwraps `expr as T` / `expr satisfies T` (and any nesting of the two) down
// to the underlying expression. `as const` is the idiomatic way these label
// maps/array tables are declared in this codebase (`MENU_OPTIONS = [...] as
// const`, `labelKey: "nav.features" as const`) — without this unwrap, the
// array literal / string literal is invisible one level down inside an
// AsExpression node, and every static-map resolution below silently misses
// every `as const`-declared table (measured: menu-picker.tsx and
// LandingNav.tsx both scored 0 hits without this unwrap).
function unwrapAsExpression(node) {
	if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
		return unwrapAsExpression(node.expression);
	}
	return node;
}

// Collects module-level `const NAME = { k: "v", ... }` object literals whose
// EVERY property value is a string literal (typed `Record<K, string>` or
// untyped — the type annotation is not required, only the shape). Returns
// Map<constName, string[]> of every possible value.
function collectStringValuedObjectConsts(sourceFile) {
	const map = new Map();
	function walk(node) {
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isIdentifier(node.name)
		) {
			const init = unwrapAsExpression(node.initializer);
			if (ts.isObjectLiteralExpression(init)) {
				const values = [];
				let allString = init.properties.length > 0;
				for (const prop of init.properties) {
					const propValue = ts.isPropertyAssignment(prop)
						? unwrapAsExpression(prop.initializer)
						: null;
					if (propValue && ts.isStringLiteral(propValue)) {
						values.push(propValue.text);
					} else {
						allString = false;
					}
				}
				if (allString) map.set(node.name.text, values);
			}
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return map;
}

// Collects, across every module-level `const NAME = [ { propName: "v", ... },
// ... ]` array-of-objects literal in the file, every string value ever
// assigned to a given property name. Returns Map<propName, Set<string>>. The
// property-name invariant is what survives arbitrary indirection depth
// between the array declaration and the `t(item.propName)` read site (see
// the doc-comment above `detectTranslationCalls`).
function collectArrayObjectStringProps(sourceFile) {
	const map = new Map();
	function walk(node) {
		if (ts.isVariableDeclaration(node) && node.initializer) {
			const init = unwrapAsExpression(node.initializer);
			if (ts.isArrayLiteralExpression(init)) {
				for (const rawEl of init.elements) {
					const el = unwrapAsExpression(rawEl);
					if (!ts.isObjectLiteralExpression(el)) continue;
					for (const prop of el.properties) {
						if (!ts.isPropertyAssignment(prop)) continue;
						const propValue = unwrapAsExpression(prop.initializer);
						if (!ts.isStringLiteral(propValue)) continue;
						const propName = prop.name.getText();
						if (!map.has(propName)) map.set(propName, new Set());
						map.get(propName).add(propValue.text);
					}
				}
			}
		}
		ts.forEachChild(node, walk);
	}
	walk(sourceFile);
	return map;
}

// Finds every `<bindingName>("<key>")` call in the file, for bindingNames
// known to be translation functions (from detectTranslationBindings). A
// call whose first argument is not a string literal is first attempted
// against the static-map resolution above (shapes A and B); only if that
// ALSO fails to resolve is it UNRESOLVABLE — reported by name and line,
// never silently dropped.
function detectTranslationCalls(sourceFile, bindingNames) {
	const calls = []; // { bindingName, key, line, resolvedFrom? }
	const unresolvedCalls = []; // { bindingName, line, reason }
	const stringConstMap = collectStringValuedObjectConsts(sourceFile);
	const arrayPropMap = collectArrayObjectStringProps(sourceFile);

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
			} else if (
				ts.isElementAccessExpression(arg) &&
				ts.isIdentifier(arg.expression) &&
				stringConstMap.has(arg.expression.text)
			) {
				// Shape (A): t(SOME_MAP[k]) — resolve every possible value in the
				// module-level string-valued const map.
				const mapName = arg.expression.text;
				const values = stringConstMap.get(mapName);
				for (const key of values) {
					calls.push({
						bindingName,
						key,
						line: line + 1,
						resolvedFrom: `static map ${mapName}`,
					});
				}
			} else if (
				ts.isPropertyAccessExpression(arg) &&
				arrayPropMap.has(arg.name.getText())
			) {
				// Shape (B): t(item.propName) — resolve every possible value ever
				// assigned to `propName` across module-level array-of-objects
				// consts, regardless of indirection depth between the array and
				// this read site (see the doc-comment above this function).
				const propName = arg.name.getText();
				const values = arrayPropMap.get(propName);
				for (const key of values) {
					calls.push({
						bindingName,
						key,
						line: line + 1,
						resolvedFrom: `array property .${propName}`,
					});
				}
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

	const violations = []; // { file, line, path, missingLocales, resolvedFrom? }
	const unresolved = []; // { file, line, reason }
	const readErrors = [];
	// Distinct call sites (file:line) resolved via static-map/array-property
	// resolution (Control 4 static-map erosion fix) — reported separately from
	// `unresolved` so the split is always visible: resolved-from-static-map
	// vs. still-genuinely-unresolvable.
	const resolvedStaticCallSites = new Set();

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
			if (call.resolvedFrom) {
				resolvedStaticCallSites.add(`${relFile}:${call.line}`);
			}
			if (missingLocales.length > 0) {
				violations.push({
					file: relFile,
					line: call.line,
					path: dottedPath,
					missingLocales,
					...(call.resolvedFrom ? { resolvedFrom: call.resolvedFrom } : {}),
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
		resolvedFromStaticMap: resolvedStaticCallSites.size,
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
			`Control 3 (fr === en byte-identical): ${control3.ok ? "CLEAN" : "SIGNALED (non-blocking)"} — ${control3.violations.length} finding(s) for human review`,
		);
		if (!control3.ok) {
			for (const v of control3.violations) {
				console.error(`  ${v.key} — fr value identical to en: "${v.value}"`);
			}
		}

		console.error(
			`Control 4 (called but undefined): ${control4.ok ? "PASS" : "FAIL"} — ${control4.filesScanned} files scanned, ${control4.violations.length} violation(s)`,
		);
		console.error(
			`  ${control4.resolvedFromStaticMap} call site(s) resolved from static maps/array-properties, ${control4.unresolved.length} still unresolvable — verify by hand`,
		);
		if (!control4.ok) {
			for (const v of control4.violations) {
				const origin = v.resolvedFrom
					? ` (resolved from ${v.resolvedFrom})`
					: "";
				console.error(
					`  ${v.file}:${v.line} "${v.path}"${origin} — missing in [${v.missingLocales.join(", ")}]`,
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

	// Control 3 is deliberately excluded here: it is a SIGNAL (human review
	// of possible forgotten translations), not a gate — see the doc-comment
	// on `runControl3FrEqualsEn`. Controls 1, 2 and 4 remain hard gates.
	const allOk = control1.ok && control2.ok && control4.ok;
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
	isLocaleSensitiveDateFnsPattern,
	detectDateFnsFormatImportNames,
	detectDateFnsProseImportNames,
	detectDateFnsNamespaceImports,
	ALWAYS_PROSE_DATE_FNS_FUNS,
	callHasLocaleOption,
	collectStringValuedObjectConsts,
	collectArrayObjectStringProps,
	main,
};

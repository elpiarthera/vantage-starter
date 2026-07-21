/**
 * route-tree-guard — proves the class this delivery closes stays closed:
 * "an internal route path written by hand rather than derived from the
 * route tree" (see `.claude/rules/derive-never-type.md`,
 * `.claude/rules/fix-the-class.md`).
 *
 * Three things are checked, all against the FILESYSTEM (the real route
 * tree), never by eye:
 *
 *   1. Every static path in `lib/routes.ts` (`ROUTES`) corresponds to a
 *      real `app/[locale]/**\/page.tsx`.
 *   2. Every real route is reachable from `lib/routes.ts` (nothing in the
 *      tree is missing from the module) — this is what makes the
 *      `/dashboard/configurator` orphan detectable mechanically instead of
 *      by inspection.
 *   3. Every `router.push` / `router.replace` / `redirect(...)` call and
 *      every JSX `href` at a navigation site, under
 *      `app/ components/ lib/ hooks/ providers/`, PROVES it consumed a
 *      value produced by `lib/routes.ts` — never merely that a hand-typed
 *      literal happens to be valid today. A literal string/template quoted
 *      at the call site (`href="/dashboard"`, `` router.push(`/dashboard`) ``)
 *      is a violation even when `/dashboard` is a real route, because the
 *      call site bypassed the single source of truth; `lib/routes.ts`'s own
 *      header requires every internal navigation to consume `ROUTES`, not
 *      merely to agree with it by coincidence. This is a source-provenance
 *      check (does the call site's source text reference `ROUTES.`), never
 *      a value allow-list — see `.claude/rules/derive-never-type.md`.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DYNAMIC_ROUTE_PREFIXES, STATIC_ROUTE_PATHS } from "@/lib/routes";

const REPO_ROOT = path.resolve(__dirname, "../..");

/** The real route tree, derived from disk — never hand-typed. */
function realRoutePaths(): string[] {
	const out = execSync(
		`find "app/[locale]" -name 'page.tsx' | sed 's|^app/\\[locale\\]||; s|/page.tsx$||'`,
		{ cwd: REPO_ROOT, encoding: "utf-8" },
	);
	const lines = out.split("\n").map((line) => line.trim());
	// `find | sed` always ends the stream in a trailing newline, so `split`
	// always leaves one spurious empty entry at the end — drop exactly that
	// one, never a blanket `filter(Boolean)`, which would also silently
	// discard the genuine "" produced by the home route (`app/[locale]/page.tsx`
	// reduces to the empty string, mapped to "/" below).
	if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
	return lines.map((p) => (p === "" ? "/" : p));
}

/** True if `routePath` (from the ROUTES module) matches a dynamic segment shape. */
function matchesDynamicSegment(realPath: string, routePath: string): boolean {
	const realSegments = realPath.split("/");
	const routeSegments = routePath.split("/");
	// Catch-all optional segments ([[...x]]) match zero segments too, e.g.
	// "/sign-in/[[...sign-in]]" matches "/sign-in" — strip them before the
	// length check so a base-path ROUTES entry is recognized.
	const trailingCatchAll = realSegments[realSegments.length - 1];
	const realSegmentsNoCatchAll =
		trailingCatchAll?.startsWith("[[...") && trailingCatchAll?.endsWith("]]")
			? realSegments.slice(0, -1)
			: realSegments;
	if (
		realSegmentsNoCatchAll.length === routeSegments.length &&
		realSegmentsNoCatchAll.every((seg, i) => seg === routeSegments[i])
	) {
		return true;
	}
	if (realSegments.length !== routeSegments.length) return false;
	return realSegments.every((seg, i) => {
		if (seg.startsWith("[") && seg.endsWith("]")) return true;
		return seg === routeSegments[i];
	});
}

describe("lib/routes.ts matches the real route tree", () => {
	const real = realRoutePaths();

	it("derives at least the routes this delivery depends on (sanity check on the derivation itself)", () => {
		expect(real).toContain("/dashboard/missions/[missionId]");
		expect(real).toContain("/dashboard/configurator");
		expect(real).not.toContain("/missions/[id]");
	});

	it("every static ROUTES entry corresponds to a real page.tsx", () => {
		const unmatched = STATIC_ROUTE_PATHS.filter(
			(routePath) =>
				!real.some((realPath) => matchesDynamicSegment(realPath, routePath)),
		);
		expect(unmatched).toEqual([]);
	});

	it("every real route is reachable from ROUTES (nothing left orphaned like /dashboard/configurator was)", () => {
		const allRouteValues = [...STATIC_ROUTE_PATHS, ...DYNAMIC_ROUTE_PREFIXES];
		const unreachable = real.filter((realPath) => {
			// Dynamic real routes ([id]) are covered by a builder whose prefix
			// is a leading substring of the real path with its param stripped.
			const staticPrefix = realPath.split("/[")[0];
			return !allRouteValues.some(
				(routeValue) =>
					routeValue === realPath ||
					(staticPrefix !== "" && routeValue.startsWith(staticPrefix)),
			);
		});
		expect(unreachable).toEqual([]);
	});
});

describe("no navigation call site bypasses lib/routes.ts (provenance, not value validity)", () => {
	const scanDirs = ["app", "components", "lib", "hooks", "providers"];
	const targetPattern =
		/\b(?:router\.push|router\.replace|redirect)\(\s*[`"](\/[^"`]*)[`"]/g;

	// JSX `href={...}` attribute, either a plain string literal
	// (`href="/dashboard"`) or a template literal (`` href={`/dashboard/${id}`} ``).
	// Deliberately distinct from `targetPattern` above (different call shape:
	// an attribute, not a function call) rather than folded into one
	// alternation, so each keeps its own capture semantics.
	const hrefPattern = /\bhref=(?:[`"](\/[^"`]*)[`"]|\{\s*[`"](\/[^"`]*)[`"])/g;

	/**
	 * A literal internal path is exempt from the ROUTES check when it is
	 * DERIVABLY not a navigable app route, never via a hand-typed filename
	 * allow-list:
	 *   - a static asset: its final path segment carries a file extension
	 *     (e.g. `/styles/presets/amber.css`, `/favicon.ico`).
	 *   - an external/special-scheme URL: `http(s)://`, `mailto:`, `tel:`,
	 *     a bare `#anchor`, or a protocol-relative `//host/...`.
	 * Both properties are read off the string itself — no filename or path
	 * is named here (see `.claude/rules/derive-never-type.md`).
	 */
	function isExemptLiteral(literal: string): boolean {
		if (/^(https?:)?\/\//.test(literal)) return true; // external / protocol-relative
		if (/^(mailto|tel):/.test(literal)) return true;
		if (literal.startsWith("#")) return true; // in-page anchor
		const lastSegment = literal.split("/").pop() ?? "";
		const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(lastSegment);
		return hasFileExtension;
	}

	function scanFile(filePath: string): {
		line: number;
		literal: string;
		hasInterpolation: boolean;
		consumesRoutesModule: boolean;
	}[] {
		const content = fs.readFileSync(filePath, "utf-8");
		const hits: {
			line: number;
			literal: string;
			hasInterpolation: boolean;
			consumesRoutesModule: boolean;
		}[] = [];

		let match: RegExpExecArray | null;
		targetPattern.lastIndex = 0;
		// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
		while ((match = targetPattern.exec(content)) !== null) {
			const raw = match[1];
			const literal = raw.split("${")[0]; // static prefix of template literals
			const line = content.slice(0, match.index).split("\n").length;
			hits.push({
				line,
				literal,
				hasInterpolation: raw.includes("${"),
				consumesRoutesModule: raw.includes("ROUTES."),
			});
		}

		hrefPattern.lastIndex = 0;
		// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
		while ((match = hrefPattern.exec(content)) !== null) {
			const raw = match[1] ?? match[2];
			if (isExemptLiteral(raw)) continue;
			const literal = raw.split("${")[0];
			const line = content.slice(0, match.index).split("\n").length;
			hits.push({
				line,
				literal,
				hasInterpolation: raw.includes("${"),
				consumesRoutesModule: raw.includes("ROUTES."),
			});
		}

		return hits;
	}

	function walk(dir: string): string[] {
		const abs = path.join(REPO_ROOT, dir);
		if (!fs.existsSync(abs)) return [];
		const entries = fs.readdirSync(abs, { withFileTypes: true });
		return entries.flatMap((entry) => {
			if (entry.name === "node_modules" || entry.name.startsWith(".")) {
				return [];
			}
			const rel = path.join(dir, entry.name);
			if (entry.isDirectory()) return walk(rel);
			if (/\.(tsx?|jsx?)$/.test(entry.name)) return [rel];
			return [];
		});
	}

	it("finds no router.push/router.replace/redirect/href call site whose literal path was typed instead of consumed from ROUTES", () => {
		const files = scanDirs.flatMap(walk);
		const violations: string[] = [];

		for (const file of files) {
			// The routes module itself defines the literals; skip it.
			if (file === path.join("lib", "routes.ts")) continue;
			const hits = scanFile(path.join(REPO_ROOT, file));
			for (const hit of hits) {
				// The ONLY thing that clears a hit: the call site's own source
				// text references `ROUTES.` — proof the value was consumed from
				// the module, not retyped. A literal that happens to equal a
				// real, valid ROUTES value (e.g. a hand-typed `"/dashboard"`) is
				// STILL a violation: value-validity is not provenance. This is
				// the property `lib/routes.ts`'s header actually requires
				// ("every internal navigation MUST consume a value produced by
				// this module") — see the file docstring above.
				if (!hit.consumesRoutesModule) {
					violations.push(`${file}:${hit.line} -> "${hit.literal}..."`);
				}
			}
		}

		expect(violations).toEqual([]);
	});
});

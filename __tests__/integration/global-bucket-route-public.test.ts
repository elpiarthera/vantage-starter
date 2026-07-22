/**
 * Regression + class guard: a public write path that declares a global
 * rate-limit bucket in `convex/ratelimit.ts` has NO per-caller identity
 * (`__tests__/convex/global-rate-limit-guard.test.ts` proves the bucket
 * itself is enforced). That absence of identity is exactly why the page
 * hosting the mutation must be reachable WITHOUT an account -- yet nothing
 * asserted that `middleware.ts`'s `isPublicRoute` actually lets the page
 * through. `/report` shipped 307-redirecting to `/sign-up` while every
 * other test stayed green, because no test ever opened the page.
 *
 * Everything this guard checks is DERIVED, never hand-typed
 * (`.claude/rules/derive-never-type.md`):
 *  1. Every rate-limit key ending in "Global" is read out of
 *     `convex/ratelimit.ts` (same regex `global-rate-limit-guard.test.ts`
 *     uses -- duplicated here rather than imported because that file
 *     exports nothing; the derivation itself is the shared approach, not a
 *     shared module).
 *  2. For each key, the ONE call site `rateLimiter.limit(ctx, "<key>", ...)`
 *     under `convex/` gives the module (e.g. "issueReports") and the
 *     exported mutation/action name (e.g. "submit").
 *  3. The literal client reference `api.<module>.<export>` is located under
 *     `components/` -- the ONE component file calling that public function.
 *  4. The ONE `app/[locale]/**\/page.tsx` importing that component's export
 *     name gives the route segment (its parent directory name).
 *  5. `isPublicRoute` (the REAL export from `middleware.ts`, not a re-typed
 *     copy) must accept both the bare and the locale-prefixed form of that
 *     route.
 *
 * Any step that cannot resolve fails LOUDLY, naming exactly what it could
 * not read -- never a silent skip (`derive-never-type.md` bans a quiet
 * `return`/`skip` on an unmatched case).
 */

import fs from "node:fs";
import path from "node:path";
import { isPublicRoute } from "@/middleware";

// Same module-load-time stubs as legal-pages-public.test.ts -- middleware.ts
// touches Clerk/next-intl/CSP at import time in a way jsdom can't satisfy.
jest.mock("@clerk/nextjs/server", () => ({
	clerkMiddleware: jest.fn((fn) => fn),
	createRouteMatcher: jest.fn(
		(routes: string[]) => (req: { nextUrl?: { pathname: string } }) => {
			const path = req.nextUrl?.pathname ?? "";
			return routes.some((route) => {
				const pattern = route
					.replace(/\(en\|fr\|de\|it\|es\|pt\|ru\)/g, "(en|fr|de|it|es|pt|ru)")
					.replace(/\(\.\*\)/g, ".*");
				const regex = new RegExp(`^${pattern}$`);
				return regex.test(path);
			});
		},
	),
}));

jest.mock("next-intl/middleware", () => ({
	__esModule: true,
	default: jest.fn(() => jest.fn()),
}));

jest.mock("next/server", () => ({
	NextResponse: { next: jest.fn(() => ({ headers: new Map() })) },
}));

jest.mock("@/lib/csp.mjs", () => ({ buildCsp: jest.fn(() => "") }));

jest.mock("@/i18n/routing", () => ({
	routing: {
		locales: ["en", "fr", "de", "it", "es", "pt", "ru"],
		defaultLocale: "en",
	},
}));

const mockRequest = (pathname: string) =>
	({ nextUrl: { pathname }, url: `http://localhost${pathname}` }) as never;

const REPO_ROOT = path.resolve(__dirname, "../..");
const CONVEX_DIR = path.join(REPO_ROOT, "convex");
const RATELIMIT_SOURCE_PATH = path.join(CONVEX_DIR, "ratelimit.ts");
const COMPONENTS_DIR = path.join(REPO_ROOT, "components");
const APP_LOCALE_DIR = path.join(REPO_ROOT, "app", "[locale]");

/** Every rate-limit key declared in `convex/ratelimit.ts` ending in "Global". */
function deriveGlobalBucketKeys(): string[] {
	const source = fs.readFileSync(RATELIMIT_SOURCE_PATH, "utf8");
	const keyPattern = /(\w+):\s*\{\s*kind:\s*"token bucket"/g;
	const keys: string[] = [];
	for (const m of source.matchAll(keyPattern)) {
		keys.push(m[1]);
	}
	const globalKeys = keys.filter((k) => k.endsWith("Global"));
	if (globalKeys.length === 0) {
		throw new Error(
			'global-bucket-route-public: derived ZERO keys ending in "Global" ' +
				"from convex/ratelimit.ts -- either the naming convention changed " +
				"(update the regex above) or every global bucket was removed. " +
				"Failing loudly rather than silently checking nothing.",
		);
	}
	return globalKeys;
}

/** Recursively list every `.ts` file under a directory, excluding `_generated`. */
function listSourceFiles(dir: string, extensions: string[]): string[] {
	const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		if (!entry.isFile()) continue;
		if (!extensions.some((ext) => entry.name.endsWith(ext))) continue;
		const dir_ =
			(entry as unknown as { parentPath?: string; path?: string }).parentPath ??
			(entry as unknown as { path: string }).path;
		const full = path.join(dir_, entry.name);
		if (full.includes(`${path.sep}_generated${path.sep}`)) continue;
		files.push(full);
	}
	return files;
}

type DerivedCallSite = {
	globalKey: string;
	moduleRef: string;
	exportName: string;
};

/** For one global bucket key, find the ONE `rateLimiter.limit(ctx, "<key>", ...)` call site and its wrapping export. */
function deriveCallSite(globalKey: string): DerivedCallSite {
	const files = listSourceFiles(CONVEX_DIR, [".ts"]).filter(
		(f) => f !== RATELIMIT_SOURCE_PATH,
	);
	const callPattern = new RegExp(
		`rateLimiter\\.limit\\(\\s*ctx\\s*,\\s*["'\`]${globalKey}["'\`]`,
	);
	const hits: Array<{ filePath: string; index: number; source: string }> = [];
	for (const filePath of files) {
		const source = fs.readFileSync(filePath, "utf8");
		const match = callPattern.exec(source);
		if (match) hits.push({ filePath, index: match.index, source });
	}
	if (hits.length !== 1) {
		throw new Error(
			`global-bucket-route-public: expected exactly ONE call site for ` +
				`global bucket "${globalKey}" under convex/, found ${hits.length} ` +
				`(${hits.map((h) => h.filePath).join(", ") || "none"}).`,
		);
	}
	const { filePath, index, source } = hits[0];
	const exportPattern = /export const (\w+)\s*=\s*(mutation|action)\s*\(/g;
	let lastMatch: RegExpMatchArray | null = null;
	for (const m of source.matchAll(exportPattern)) {
		if (m.index !== undefined && m.index < index) lastMatch = m;
		else break;
	}
	if (!lastMatch) {
		throw new Error(
			`global-bucket-route-public: found the call site for "${globalKey}" ` +
				`in ${filePath} but could not derive the surrounding exported ` +
				`mutation/action.`,
		);
	}
	const moduleRef = path
		.relative(CONVEX_DIR, filePath)
		.replace(/\.ts$/, "")
		.split(path.sep)
		.join(".");
	return { globalKey, moduleRef, exportName: lastMatch[1] };
}

/** The ONE component file under `components/` calling `api.<moduleRef>.<exportName>`. */
function deriveClientComponent(moduleRef: string, exportName: string): string {
	const files = listSourceFiles(COMPONENTS_DIR, [".tsx", ".ts"]);
	const refToken = `api.${moduleRef}.${exportName}`;
	const hookPattern = /use(Mutation|Action)\(/;
	const hits: string[] = [];
	for (const filePath of files) {
		const source = fs.readFileSync(filePath, "utf8");
		const hasRefOnHookLine = source
			.split("\n")
			.some((line) => line.includes(refToken) && hookPattern.test(line));
		if (hasRefOnHookLine) hits.push(filePath);
	}
	if (hits.length !== 1) {
		throw new Error(
			`global-bucket-route-public: expected exactly ONE component under ` +
				`components/ calling api.${moduleRef}.${exportName} via ` +
				`useMutation/useAction, found ${hits.length} (${hits.join(", ") || "none"}).`,
		);
	}
	return hits[0];
}

/** The exported component name declared in a component file (`export function Name` / `export const Name`). */
function deriveExportedComponentName(componentFilePath: string): string {
	const source = fs.readFileSync(componentFilePath, "utf8");
	const match = source.match(
		/export\s+(?:async\s+)?(?:function|const)\s+(\w+)/,
	);
	if (!match) {
		throw new Error(
			`global-bucket-route-public: could not derive an exported component ` +
				`name from ${componentFilePath}.`,
		);
	}
	return match[1];
}

/** The ONE `app/[locale]/<segment>/page.tsx` importing `componentName`; returns `<segment>`. */
function deriveRouteSegment(componentName: string): string {
	const pageFiles = listSourceFiles(APP_LOCALE_DIR, ["page.tsx"]);
	const hits: string[] = [];
	for (const filePath of pageFiles) {
		const source = fs.readFileSync(filePath, "utf8");
		if (new RegExp(`\\b${componentName}\\b`).test(source)) hits.push(filePath);
	}
	if (hits.length !== 1) {
		throw new Error(
			`global-bucket-route-public: expected exactly ONE app/[locale] page ` +
				`importing "${componentName}", found ${hits.length} (${hits.join(", ") || "none"}).`,
		);
	}
	const relative = path.relative(APP_LOCALE_DIR, hits[0]);
	const segment = relative.split(path.sep)[0];
	if (!segment || segment === "page.tsx") {
		throw new Error(
			`global-bucket-route-public: could not derive a route segment from ` +
				`${hits[0]} (page lives directly under app/[locale], no segment ` +
				`directory to derive).`,
		);
	}
	return segment;
}

describe("public routes hosting a global-rate-limit-bucket mutation (derived from convex/ratelimit.ts)", () => {
	const globalKeys = deriveGlobalBucketKeys();

	it("derived at least one global bucket to check", () => {
		expect(globalKeys.length).toBeGreaterThan(0);
	});

	for (const globalKey of globalKeys) {
		const { moduleRef, exportName } = deriveCallSite(globalKey);
		const componentFile = deriveClientComponent(moduleRef, exportName);
		const componentName = deriveExportedComponentName(componentFile);
		const segment = deriveRouteSegment(componentName);

		it(`"/${segment}" (hosting api.${moduleRef}.${exportName}, bucket "${globalKey}") is public without an account, bare and locale-prefixed`, () => {
			expect(isPublicRoute(mockRequest(`/${segment}`))).toBe(true);
			expect(isPublicRoute(mockRequest(`/en/${segment}`))).toBe(true);
			expect(isPublicRoute(mockRequest(`/fr/${segment}`))).toBe(true);
		});
	}
});

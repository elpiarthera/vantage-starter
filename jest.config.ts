import type { Config } from "jest";
// Explicit `.js` extension: `next` publishes no exports-map entry for `./jest`,
// so ESM resolution (used by the CI runner) requires the real filename.
// Extensionless resolves only under CommonJS/ts-node — green locally, red in CI.
import nextJest from "next/jest.js";
import { deriveOwnership } from "./scripts/derive-test-runner-ownership.js";

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: "./",
});

// Jest's OLD `testMatch` (`**/__tests__/**/*.[jt]s?(x)` + `**/?(*.)+(spec|test).[jt]s?(x)`)
// matched every `.test.*`/`.spec.*` file in the repo — including 6
// Playwright specs under `e2e/` and 35+ Vitest suites (they `import` from
// `"vitest"`, which Jest's transform cannot parse). Jest reported each as a
// FAILED SUITE while its "Tests: N/N passed" line stayed a perfect ratio —
// that line only ever counts tests inside suites that actually started, so
// "94/94 passed" printed directly above "91 failed, 4 passed" (Test Suites)
// read as 100% green while 96% of the suite never ran. `testMatch` below is
// DERIVED from `scripts/derive-test-runner-ownership.js` (which itself reads
// `playwright.config.ts`'s own `testDir` and greps each file's source for a
// `from "vitest"` import) — never a hand-typed list, and it cannot drift out
// of sync with `vitest.config.ts`'s own derived `include`, because both call
// the exact same function.
const ownership = deriveOwnership();

// Add any custom config to be passed to Jest
const config: Config = {
	coverageProvider: "v8",
	testEnvironment: "jsdom",
	// `@clerk/backend`'s package.json resolves its "browser" condition to an
	// ESM-only file (`dist/runtime/browser/crypto.mjs`) when the active
	// environment is jsdom. Jest's transform pipeline (via next/jest) does
	// not transform node_modules ESM by default, so any suite that imports
	// the real (unmocked) `@clerk/nextjs/server` -- as the three
	// `createRouteMatcher` suites now do, precisely so they exercise the
	// real primitive instead of a re-typed mock -- fails with
	// `SyntaxError: Unexpected token 'export'` before a single test runs.
	// Forcing the "node" export condition makes Node's module resolution
	// pick `@clerk/backend`'s CommonJS build instead, which Jest already
	// knows how to load without a transform.
	testEnvironmentOptions: { customExportConditions: ["node"] },
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
	testMatch: ownership.jest.map((rel) => `<rootDir>/${rel}`),
	collectCoverageFrom: [
		"app/**/*.{js,jsx,ts,tsx}",
		"components/**/*.{js,jsx,ts,tsx}",
		"lib/**/*.{js,jsx,ts,tsx}",
		"!**/*.d.ts",
		"!**/node_modules/**",
		"!**/.next/**",
	],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);

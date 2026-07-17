import type { Config } from "jest";
import nextJest from "next/jest";
import { deriveOwnership } from "./scripts/derive-test-runner-ownership";

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

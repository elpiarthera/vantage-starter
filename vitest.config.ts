import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { deriveOwnership } from "./scripts/derive-test-runner-ownership";

// Load all .env.local vars (no prefix filter) so POLAR_* vars are available in tests
const env = loadEnv("test", process.cwd(), "");

// Vitest previously declared NO `test.include` at all, so a bare `vitest run`
// fell back to its own default glob and picked up EVERY `.test.*`/`.spec.*`
// file in the repo — including the 3 real Jest suites (jsdom +
// @testing-library) and the 1 orphan (`ma-state-machine.test.ts`, since
// fixed). `include` below is DERIVED from
// `scripts/derive-test-runner-ownership.js` (the exact same function
// `jest.config.ts` calls) — a file is Vitest's iff its own source imports
// from the literal module string `"vitest"`, never a hand-typed directory
// list, so this cannot drift out of sync with Jest's own derived `testMatch`.
const ownership = deriveOwnership();

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: ownership.vitest,
		env,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
	},
});

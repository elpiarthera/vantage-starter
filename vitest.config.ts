import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Load all .env.local vars (no prefix filter) so POLAR_* vars are available in tests
const env = loadEnv("test", process.cwd(), "");

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		env,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
	},
});

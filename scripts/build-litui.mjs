#!/usr/bin/env node

/**
 * Build lit-ui web components into a single ES module bundle.
 * Output: public/lit-ui/bundle.js
 *
 * Handles:
 * - TypeScript decorators (@customElement, @property)
 * - ?inline CSS imports (inlined as strings)
 * - @lit-ui/core alias → src/lib/lit-ui/core.ts
 * - @lit-ui/core/floating alias → src/lib/lit-ui/floating.ts
 * - @lit-ui/calendar alias → src/lib/lit-ui/calendar.ts
 * - .js → .ts resolution for src/ files only
 */

import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const srcDir = resolve(root, "src");

// Ensure output directory exists
await mkdir(resolve(root, "public/lit-ui"), { recursive: true });

/**
 * Plugin: resolve ?inline CSS imports.
 * Strips the ?inline suffix and loads the file as a string (text loader).
 * Only one onResolve handler — the second regex is more specific so it wins.
 */
const inlineCssPlugin = {
	name: "inline-css",
	setup(build) {
		// Intercept any import ending with ?inline
		build.onResolve({ filter: /\.css\?inline$/ }, (args) => {
			const cleanPath = args.path.replace(/\?inline$/, "");
			const resolved = resolve(args.resolveDir, cleanPath);
			return {
				path: resolved,
				namespace: "inline-css",
			};
		});

		// Load as text string (exported as a JS default export)
		build.onLoad({ filter: /.*/, namespace: "inline-css" }, async (args) => {
			const contents = await readFile(args.path, "utf8");
			return {
				contents: `export default ${JSON.stringify(contents)};`,
				loader: "js",
			};
		});
	},
};

/**
 * Plugin: alias @lit-ui/core and sub-paths to local shims.
 */
const coreAliasPlugin = {
	name: "lit-ui-core-alias",
	setup(build) {
		// Must match /floating sub-path BEFORE the bare package match
		build.onResolve({ filter: /^@lit-ui\/core\/floating$/ }, () => ({
			path: resolve(srcDir, "lib/lit-ui/floating.ts"),
		}));

		build.onResolve({ filter: /^@lit-ui\/core$/ }, () => ({
			path: resolve(srcDir, "lib/lit-ui/core.ts"),
		}));

		build.onResolve({ filter: /^@lit-ui\/calendar$/ }, () => ({
			path: resolve(srcDir, "lib/lit-ui/calendar.ts"),
		}));
	},
};

/**
 * Plugin: resolve .js imports to .ts source files — src/ only.
 * Components import siblings as './accordion-item.js' but the source is .ts.
 * Guard: only applies when resolveDir is inside srcDir to avoid
 * catching node_modules internal .js imports.
 */
const tsResolvePlugin = {
	name: "ts-resolve",
	setup(build) {
		build.onResolve({ filter: /\.js$/ }, (args) => {
			// Only handle relative imports inside our src directory
			if (!args.path.startsWith(".")) return null;
			if (!args.resolveDir.startsWith(srcDir)) return null;
			const tsPath = resolve(
				args.resolveDir,
				args.path.replace(/\.js$/, ".ts"),
			);
			return { path: tsPath };
		});
	},
};

const startTime = Date.now();

try {
	await build({
		entryPoints: [resolve(srcDir, "components/ui/register-all.ts")],
		bundle: true,
		format: "esm",
		outfile: resolve(root, "public/lit-ui/bundle.js"),
		minify: process.env.NODE_ENV === "production",
		sourcemap: process.env.NODE_ENV !== "production",
		target: ["es2022"],
		tsconfig: resolve(srcDir, "tsconfig.litui.json"),
		// Plugin order matters: aliases resolved before css, before ts-resolve
		plugins: [coreAliasPlugin, inlineCssPlugin, tsResolvePlugin],
		external: [],
		define: {
			"import.meta.env.DEV": JSON.stringify(
				process.env.NODE_ENV !== "production",
			),
		},
		logLevel: "info",
	});

	const elapsed = Date.now() - startTime;
	console.log(
		`\x1b[32m✓ lit-ui bundle built in ${elapsed}ms → public/lit-ui/bundle.js\x1b[0m`,
	);
} catch (error) {
	console.error("\x1b[31m✗ lit-ui build failed:\x1b[0m", error.message);
	process.exit(1);
}

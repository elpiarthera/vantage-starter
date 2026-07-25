/**
 * requiredEnv — the first-run environment contract, DERIVED from the single
 * canonical source `.env.example`, never a second hand-typed list.
 *
 * A variable is "required to reach the first authenticated screen" iff its
 * line in `.env.example` carries the machine-readable `# @required` marker.
 * That file is the ONE authority (see `.claude/rules/derive-never-type.md`
 * and `one-identity-layer.md`): the set here is parsed from it, so the code
 * and the documentation can never drift into two contradicting truths.
 *
 * `assertRequiredEnv` is the loud-failure primitive: given an env object
 * (defaults to `process.env`), it throws a single error NAMING every missing
 * required variable, rather than letting the app crash later at an unrelated
 * call site with no indication of which key was absent. A first-run that
 * fails silently loses the forker in the first minute (see `docs/first-run.md`).
 */

import fs from "node:fs";
import path from "node:path";

/**
 * The marker that promotes a `.env.example` line into the first-run contract.
 * A trailing comment token — comment-only, it changes no value.
 */
const REQUIRED_MARKER = "@required";

/** Matches `NAME=...  # @required`, capturing `NAME`. Built from the one marker. */
const REQUIRED_LINE = new RegExp(`^([A-Z0-9_]+)=.*#\\s*${REQUIRED_MARKER}\\b`);

/**
 * Parse the required-variable set out of a `.env.example` body. A line
 * `NAME=...  # @required` contributes `NAME`; every other line is ignored.
 * Exported so the enforcing test derives the expected set the same way the
 * runtime does — one parser, one source, zero retyping.
 */
export function parseRequiredEnv(envExampleBody: string): string[] {
	const required: string[] = [];
	for (const line of envExampleBody.split("\n")) {
		const match = line.match(REQUIRED_LINE);
		if (match) {
			required.push(match[1]);
		}
	}
	return required;
}

/** Absolute path to the canonical `.env.example` at the repository root. */
export const ENV_EXAMPLE_PATH = path.resolve(__dirname, "../../.env.example");

/** Read `.env.example` from disk and derive the required-variable set. */
export function loadRequiredFirstRunEnv(): string[] {
	const body = fs.readFileSync(ENV_EXAMPLE_PATH, "utf-8");
	return parseRequiredEnv(body);
}

/**
 * The required set, derived once at module load from `.env.example`. This is
 * NOT a hand-typed literal — it is the parse of the single source. Consumers
 * import this instead of retyping any variable name.
 */
export const REQUIRED_FIRST_RUN_ENV: readonly string[] =
	loadRequiredFirstRunEnv();

export class MissingRequiredEnvError extends Error {
	readonly missing: string[];

	constructor(missing: string[]) {
		super(
			`Missing required environment variable(s) for first run: ${missing.join(", ")}. ` +
				"See docs/first-run.md for where to obtain each one.",
		);
		this.name = "MissingRequiredEnvError";
		this.missing = missing;
	}
}

/**
 * Throws `MissingRequiredEnvError`, naming every absent variable, if any
 * entry of the derived required set is unset or empty in `env`.
 */
export function assertRequiredEnv(
	env: Record<string, string | undefined> = process.env,
	required: readonly string[] = REQUIRED_FIRST_RUN_ENV,
): void {
	const missing = required.filter((name) => !env[name]);
	if (missing.length > 0) {
		throw new MissingRequiredEnvError(missing);
	}
}

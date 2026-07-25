/**
 * requiredEnv — the single declared list of variables a fresh fork MUST set
 * to reach its first authenticated screen, per `docs/first-run.md`
 * ("Required to reach the first screen — auth + backend"). Never retype
 * this list anywhere else (see `.claude/rules/derive-never-type.md`) —
 * import `REQUIRED_FIRST_RUN_ENV` from here.
 *
 * `assertRequiredEnv` is the loud-failure primitive: given an env object
 * (defaults to `process.env`), it throws a single error NAMING every
 * missing required variable, rather than letting the app crash later at an
 * unrelated call site with no indication of which key was absent. A
 * first-run that fails silently loses the forker in the first minute —
 * see `docs/first-run.md` "The enforcing test (to be built)".
 */

export const REQUIRED_FIRST_RUN_ENV = [
	"NEXT_PUBLIC_CONVEX_URL",
	"CLERK_SECRET_KEY",
	"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
	"CLERK_JWT_ISSUER_DOMAIN",
	"NEXT_PUBLIC_CLERK_DOMAIN",
] as const;

export type RequiredFirstRunEnvVar = (typeof REQUIRED_FIRST_RUN_ENV)[number];

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
 * entry of `REQUIRED_FIRST_RUN_ENV` is unset or empty in `env`.
 */
export function assertRequiredEnv(
	env: Record<string, string | undefined> = process.env,
): void {
	const missing = REQUIRED_FIRST_RUN_ENV.filter((name) => !env[name]);
	if (missing.length > 0) {
		throw new MissingRequiredEnvError(missing);
	}
}

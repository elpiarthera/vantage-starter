# One identity layer — no application defines its own authorization primitive

Always loaded. Fleet-wide, every application and every MCP server.

Class of failure addressed: the question "who is calling, and what may they see" gets answered independently in every codebase. Each answer is reasonable in isolation; together they diverge. A defect closed in one is invisible to the others, and a starter repository multiplies its own copy into every fork. Measured instance: three separate implementations of the same organisation check across three codebases, none aware of the other two, while a shared package existed and covered only half the question.

## The rule

1. **One package answers identity and scope for the whole fleet.** No application, no MCP server, and no starter defines its own primitive for: resolving a caller to a tenant, asserting membership of an organisation, filtering rows by a caller's scope, or validating a master credential.
2. **The package covers BOTH callers.** A human arriving through a sign-in provider and a machine arriving with a token are two entry paths to one contract. A package that serves only the machine path guarantees that every application will write the human path itself — which is exactly how divergence starts.
3. **A right is presented, never inferred from an absence.** No argument omitted, no field missing, no context undefined may ever produce a broader outcome than its presence. Anything that would be permissive on omission is a defect, whatever the compatibility motive that introduced it.
4. **Adaptation happens in the package, not beside it.** When the shared primitive does not fit a call site, the package evolves. A local variant that solves today's case is a divergence with a delay fuse.
5. **The starter ships it wired.** A seed repository carries the shared layer already connected, never a hand-written copy — otherwise every fork inherits a private implementation that no future correction can reach.

## What the shared layer must expose

Four things, and nothing an application should ever restate:

- **Resolution** — from a credential (human session or machine token), return the caller's tenant, subject and scope, or refuse. Refusal is the default when anything is missing.
- **Assertion** — require membership; raise a typed refusal otherwise.
- **Row visibility** — filter a result set by the caller's scope.
- **Credential validation** — constant-time comparison and master-token checks.

Framework-specific adapters wrap those four; they never reimplement them.

## Banned

- A local function that resolves a tenant, asserts membership, or filters by scope, in any repository that could depend on the shared package.
- Copying the shared implementation into an application "to adapt it".
- A permissive default on a missing argument, however documented.
- Keeping a local copy "as a fallback" after migration. Two authorities means one silently wins.

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Doctrine | this file (always loaded) | keeps the single-layer contract visible every cycle |
| Package | the shared identity package | the only implementation, covering both caller paths |
| Reactive gate | a guard refusing a diff that introduces a local tenant/membership/scope primitive where the package is available | catches the reflex at the moment it happens |
| Review gate | reviewer | a PR carrying a local variant is refused, citing this rule |
| Seed | the starter repository consumes the package | every fork inherits the layer instead of a copy |

## Cross-ref

- `no-hardcoded-business-knowledge.md` — same family: what must change once must not live in many places.
- `reuse-first-assets.md` — an existing asset is reused, never rebuilt.
- `derive-never-type.md` — a right, like a count, is derived from an authority rather than restated.
- `measurement-integrity.md` — a guard is proven by a bipolar probe: zero holes and zero false positives.

---

*Orchestrator: Pi — VantageOS Team | 2026-07-23*

# Phantom strings — a bundle grep hit on a vendor-example string is never a config defect

Always loaded. Fleet-wide.

Class of failure addressed: an orchestrator greps a served bundle, finds a vendor-example string (e.g. the Convex SDK example URL `happy-otter-123.convex.cloud`), reads it as the app's own broken configuration, and routes a fix. The string is vendored library text shipped inside every app that uses that vendor; the grep hit proves nothing about the app's config. This recurs because the bipolar-search lesson (in `measurement-integrity.md`) is passive prose — nobody re-reads it at the exact moment the trap closes.

## The rule

Any claim of the form "artifact X carries wrong value V" MUST come with the paired good-value read: "does X carry the expected value E?" — and V must be read IN CONTEXT (the surrounding line) before it is called configuration rather than vendored library text.

For a value that is a network/deployment identity (a URL, a deployment name), the good-value read is the value the app RETURNS (env pull, env list, status query), NEVER a bundle grep. A pinned or grepped string states what you looked at; it does not state what the app uses.

## Registry + active guard

- Registry: `.claude/config/known-phantom-strings.json` — vendor-example strings that are phantoms by default, each with its paired good-value check. Seed and extend as new phantoms surface.
- Guard: `.claude/hooks/enforce-phantom-string-check.py` (PreToolUse on send_message / create_task / block_task) — warns when a phantom is cited as a config defect without the paired good-value read. Advisory: it surfaces the check, it does not hard-block a legitimate citation.
- Override: `// allow-phantom-cite: <reason>` for a legitimate verbatim historical citation.

## Banned

- Routing a fix (to a human or a peer) on a bundle grep alone.
- Calling a string "the app's config" without reading its surrounding line.
- Reading a deployment/URL identity from a bundle instead of from what the app returns.

## Cross-ref

- `measurement-integrity.md` (bipolar search: finding the bad string proves nothing until you search for the good one; the returned value cannot be the one you typed).
- `derive-never-type.md` (state is derived/resolved, never typed or grepped from the wrong surface).
- `pi-verify-on-evidence.md` (pull the artifact, not the report).

---

*Orchestrator: Pi — VantageOS Team | 2026-07-17*

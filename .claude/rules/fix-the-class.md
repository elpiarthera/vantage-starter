# fix-the-class — close the class, not the instance

Always loaded. Fleet rule. Canonical source: elpi-corp `.claude/rules/fix-the-class.md`. This file is a mirror pending byte-exact re-sync (the canonical was not reachable from this host and the registry returned no content at copy time).

---

## Rule

No fix ships without a `CLASSE:` block in the task description, message, or PR comment, containing all three:

1. **The general pattern, named before the fix** — not "I fixed this line" but "the class is: every relative import without an extension in a config file loaded as ESM by CI".
2. **The sweep command, with its output pasted** — the `grep` (or equivalent) that enumerates every instance of the class, and what it returns.
3. **Remaining = 0, or traced** — the sweep proves no instance is left, or names the ones left and why.

## Why

A tool (CI, linter, guard) reports one parse error at a time. Fixing that one **reveals** the next, identical, often one line down — and the round-trip repeats. Correcting the first-named occurrence instead of the whole family is the recurring failure this rule closes.

## Operative test

Before saying "fixed", answer: **"what would the NEXT error the tool shows be?"**

- If the answer is not **"none, sweep attached"**, the fix is not done.
- "I don't know" means the fix is not done: the sweep was not run.

## Sweep examples

| Class | Sweep command |
|---|---|
| Extensionless relative imports (ESM/CI) | `grep -nE 'from "\./' *.config.ts \| grep -v '\.js"'` -> 0 |
| Test suites reading an env var | `grep -rlE 'process\.env\.[A-Z]\|import\.meta\.env' __tests__/` -> enumerate, keep each tripolar |
| Hand-typed state value | see `derive-never-type.md` — the parent class |
| Token vs raw color mapping | `grep -nE '(amber\|gray\|orange)-[0-9]{2,3}' <file>` -> 0 |

## Kinship

Operative sibling of `derive-never-type.md`: where that rule says "do not type a value a tool can read", this one says "do not fix an instance a `grep` can enumerate". Same mono-formulation disease — the fix (or guard) that knows only one form of the thing it treats. See also `measurement-integrity.md`: the proof is the pasted sweep, never the assertion "it's fine".

## Enforcement

- **Reviewers**: a fix shipped without a `CLASSE:` block is a form correction required in the verdict, before any approval.
- **Dispatchers**: require the `CLASSE:` block in every fix task dispatched.
- **All**: apply from the next fix.

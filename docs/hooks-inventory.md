# Hooks inventory — derived, not hand-typed

Every value below is DERIVED by the script embedded in this file's git history and re-runnable from the PR description of `tau/quality-gate-guard-decision`. No row is hand-typed.

**Sources of truth:** WIRED = `.claude/settings.json`. STAGED = `.claude/settings-wiring.json` (a real patch file, not a promise). DECLARED = `CLAUDE.md`, `AGENTS.md`, `docs/**.md`, `.claude/rules/**.md` — **excluding this file**: an inventory NAMES guards, it does not DECLARE them active, and counting itself as a declaration made every guard look declared (measured: it inflated LIE from 0 to 24).

**Totals:** 53 guard files. Wired: 23. Staged but not applied: 6. **LIE (declared active, invoked by nothing): 0.** Honestly dead (never declared, ordinary debt, out of the class by its own definition): 24.

A LIE count of 0 is the number this branch had to reach and reach honestly — not by narrowing what counts as a declaration.

| File | Wired in settings.json? | Declared in | Class |
|---|---|---|---|
| `.claude/hooks/auto-inject-signature.py` | yes | — | WIRED |
| `.claude/hooks/block-delete-on-prod.py` | yes | — | WIRED |
| `.claude/hooks/block-deploy-without-qa.py` | yes | — | WIRED |
| `.claude/hooks/block-orchestrator-code-edits.py` | yes | — | WIRED |
| `.claude/hooks/block-prod-deploy.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/block-task-in-message.py` | yes | — | WIRED |
| `.claude/hooks/block-time-estimates.py` | yes | — | WIRED |
| `.claude/hooks/check-file-size.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-brief-template.py` | yes | — | WIRED |
| `.claude/hooks/enforce-component-brief.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-decisive-messaging.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-delegation.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-eta-approval-before-npm-publish.py` | yes | — | WIRED |
| `.claude/hooks/enforce-evidence-bound-notify.py` | yes | — | WIRED |
| `.claude/hooks/enforce-friction-field.py` | yes | — | WIRED |
| `.claude/hooks/enforce-full-ids.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-git-pull-before-branch.py` | yes | — | WIRED |
| `.claude/hooks/enforce-irp-sequence.py` | yes | — | WIRED |
| `.claude/hooks/enforce-mission-template.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-no-claude-trailer.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-no-task-in-message.py` | yes | — | WIRED |
| `.claude/hooks/enforce-npm-publish-fleet-defaults.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-phantom-string-check.py` | yes | .claude/rules/phantom-string-registry.md | WIRED |
| `.claude/hooks/enforce-pi-authorization-before-prod-deploy.py` | yes | — | WIRED |
| `.claude/hooks/enforce-pi-verify-before-dispatch.py` | NO | CLAUDE.md,.claude/rules/pi-verify-before-dispatch.md | STAGED (patch exists, not applied) |
| `.claude/hooks/enforce-pr-mergeable-state.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-quality-gate.sh` | NO | CLAUDE.md | STAGED (patch exists, not applied) |
| `.claude/hooks/enforce-repo-routing.py` | yes | — | WIRED |
| `.claude/hooks/enforce-run-in-background.py` | yes | CLAUDE.md | WIRED |
| `.claude/hooks/enforce-ship-24-7.py` | yes | — | WIRED |
| `.claude/hooks/enforce-task-quality.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/enforce-trust-system.py` | yes | — | WIRED |
| `.claude/hooks/irp-breadcrumb.py` | yes | — | WIRED |
| `.claude/hooks/monitor-npm-version-vs-deployed.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/post-tool-use-qa.py` | NO | CLAUDE.md | STAGED (patch exists, not applied) |
| `.claude/hooks/post-tool-use-validate.py` | NO | CLAUDE.md | STAGED (patch exists, not applied) |
| `.claude/hooks/qa-breadcrumb.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/session-start.py` | yes | CLAUDE.md | WIRED |
| `.claude/hooks/strip-claude-from-pr.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/subagent-start-bootstrap.py` | NO | CLAUDE.md | STAGED (patch exists, not applied) |
| `.claude/hooks/test_block_deploy_without_qa.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/test_enforce_pi_authorization_comments.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/user-prompt-submit-routing.py` | NO | CLAUDE.md | STAGED (patch exists, not applied) |
| `.claude/hooks/validate-github-comment.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/verify-before-claim.py` | NO | — | dead (never declared — ordinary debt) |
| `.claude/hooks/verify-breadcrumb.py` | NO | — | dead (never declared — ordinary debt) |
| `hooks/block-orchestrator-code-edits.py` | yes | — | WIRED |
| `hooks/enforce-agent-rules.py` | NO | — | dead (never declared — ordinary debt) |
| `hooks/enforce-brief-template.py` | yes | — | WIRED |
| `hooks/enforce-peer-brief-format.py` | NO | — | dead (never declared — ordinary debt) |
| `hooks/post-agent-qa.py` | NO | — | dead (never declared — ordinary debt) |
| `hooks/post-agent-review.py` | NO | — | dead (never declared — ordinary debt) |
| `hooks/session-start-tau.py` | NO | — | dead (never declared — ordinary debt) |

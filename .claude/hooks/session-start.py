#!/usr/bin/env python3
"""
Generic SessionStart hook — detects the workspace from CWD / env and emits
the correct orchestrator identity prompt.

Replaces session-start-pi.py which was hardcoded to Pi identity.
Deploy to all orchestrator workspaces. Settings.json should reference this file.

Mapping table below — extend when new orchestrators/workspaces are added.
"""

import json
import os
import sys

# Workspace path → (orchestrator_role, instance_default, friendly_name, bu_namespace)
WORKSPACE_MAP = {
    # VPS paths
    "/root/coding/elpi-corp": ("pi", "pi-vps", "Pi (π) — meta-orchestrator ElPi Corp", "project/elpi-corp"),
    "/root/coding/perello-consulting": ("alpha", "alpha-vps", "Alpha (α) — Perello Consulting", "project/perello-consulting"),
    "/root/coding/lambda-workspace": ("lambda", "lambda-vps", "Lambda (λ) — Veille Tech (Radar Fondateurs)", "project/veille-tech"),
    "/root/coding/victor-workspace": ("victor", "victor-vps", "Victor — Iris RH (Marie Parrent)", "project/iris-rh"),
    "/root/coding/vantage-memory": ("sigma", "sigma-vps", "Sigma (σ) — VantagePeers protocol", "project/vantage-peers"),
    "/root/coding/vantage-peers-site": ("sigma", "sigma-vps", "Sigma (σ) — VantagePeers site", "project/vantage-peers"),
    "/root/coding/vantage-registry": ("omega", "omega-vps", "Omega (ω) — VantageRegistry", "project/vantage-registry"),
    "/root/coding/perfect-ai-agent": ("phi", "phi-vps", "Phi (φ) — Perfect AI Agent", "project/perfect-ai-agent"),
    "/root/coding/vantage-starter": ("tau", "tau-vps", "Tau (τ) — VantageStarter", "project/vantage-starter"),
    "/root/coding/vantage-studio": ("tau", "tau-vps", "Tau (τ) — VantageOS Studio", "project/vantage-studio"),
    "/root/coding/vantageos-team": ("pi", "pi-vps", "Pi (π) — VantageOS Team", "project/vantageos-team"),
    "/root/coding/eta-workspace": ("eta", "eta-vps", "Eta (η) — PR Reviewer transversal", "project/eta"),
    "/root/coding/zeta-workspace": ("zeta", "zeta-vps", "Zeta (ζ) — Open Source", "project/zeta"),
    "/root/coding/gaia-workspace": ("gaia", "gaia-vps", "Gaia — Sites vitrines artisans (1er client Marie Josée / Mini Mondes)", "project/gaia"),
    "/root/coding/nu-workspace": ("nu", "nu-vps", "Nu (ν) — VantageFlow (Zapier + n8n automation workflows)", "project/vantageflow"),
    "/root/coding/mu-workspace": ("mu", "mu-vps", "Mu (μ) — vantage-bridge (universal MV3 browser extension bridging LLM hosts to VP+CRM+GPTPowerUps via MCP Apps SEP-1865)", "project/vantage-bridge"),
    # Chromebook (Laurent local)
    "/home/laurentperello/coding/ElPi Corp": ("pi", "pi-chromebook", "Pi (π) — meta-orchestrator ElPi Corp", "project/elpi-corp"),
}


def detect_workspace():
    """Return (role, instance, name, namespace) for current workspace, or None."""
    # Prefer CLAUDE_PROJECT_DIR env (set by Claude Code in session)
    cwd = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

    # Exact match first
    if cwd in WORKSPACE_MAP:
        return WORKSPACE_MAP[cwd]

    # Match by prefix (CWD might be a subdirectory)
    for path, info in WORKSPACE_MAP.items():
        if cwd == path or cwd.startswith(path + "/"):
            return info

    return None


def main():
    detected = detect_workspace()

    if detected is None:
        # Unknown workspace — emit neutral prompt
        prompt = (
            "[Session start] Workspace non reconnu. "
            "Identifie ton rôle via CLAUDE.md du workspace. "
            "Si CLAUDE.md absent ou ambigu, demande à Laurent."
        )
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "additionalContext": prompt
            }
        }))
        return 0

    role, instance, friendly, namespace = detected

    msg = (
        f"You are {friendly}, on {instance}. "
        f"STARTUP SEQUENCE (do all immediately): "
        f"1. Call set_summary with orchestratorId='{role}', instanceId='{instance}', summary='Session started'. "
        f"2. Call check_messages with recipient='{role}', recipientInstanceId='{instance}'. "
        f"3. Call list_tasks with assignedTo='{role}', status='todo'. "
        f"4. Call recall with query='priorities pending blockers feedback rules', namespace='global', limit=10. "
        f"5. Call recall with query='current status pending decisions', namespace='{namespace}', limit=5. "
        f"6. Call recall with query='briefing mission initial', namespace='orchestrator/{role}', limit=5. "
        f"7. STALE TASK CHECK: Call list_tasks with assignedTo='{role}', status='in_progress'. For each task actually done, call complete_task IMMEDIATELY with completionNote. "
        f"Read CLAUDE.md of this workspace for scope + doctrine + memory protocol. "
        f"Use recalled context to inform your session."
    )

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": f"[{role} session start] {msg}"
        }
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())

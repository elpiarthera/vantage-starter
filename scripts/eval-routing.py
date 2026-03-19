#!/usr/bin/env python3
"""
Routing Eval — measures whether prompts route to the correct agent.

Reads evals/routing-eval-corpus.json and tests routing accuracy
using keyword overlap against agent descriptions.

This is a STATIC eval — tests description quality and routing table,
not live LLM behavior.

Usage:
    python3 scripts/eval-routing.py                # full report
    python3 scripts/eval-routing.py --short        # summary only
    python3 scripts/eval-routing.py --baseline     # save current pass rate as baseline

Exit code: 0 if pass rate >= 90%, 1 if below
"""

import json
import re
import sys
from pathlib import Path
from datetime import date

ROOT = Path(__file__).parent.parent
CORPUS_PATH = ROOT / "evals" / "routing-eval-corpus.json"
MANIFEST_PATH = ROOT / "generated" / "agent-manifest.json"
BASELINE_PATH = ROOT / "evals" / "routing-baseline.json"
REPORT_DIR = ROOT / "analysis" / "agent-health"


def load_corpus():
    with open(CORPUS_PATH) as f:
        return json.load(f)


def load_agents():
    """Load agents from manifest (preferred) or fall back to parsing agents dir."""
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH) as f:
            data = json.load(f)
        return [{"name": k, "description": v.get("description", "")} for k, v in data.get("agents", {}).items()]

    # Fallback: parse frontmatter directly
    agents = []
    agents_dir = ROOT / ".claude" / "agents"
    for f in agents_dir.glob("*.md"):
        try:
            content = f.read_text()[:2000]
            if "description:" in content:
                for line in content.splitlines():
                    if line.strip().startswith("description:"):
                        desc = line.partition(":")[2].strip().strip("\"'")
                        agents.append({"name": f.stem, "description": desc})
                        break
        except Exception:
            pass
    return agents


def tokenize(text: str) -> set:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def score_match(prompt_tokens: set, description: str, name: str) -> float:
    desc_tokens = tokenize(description)
    name_tokens = tokenize(name.replace("-", " "))

    # Exact name match in prompt
    name_phrase = name.replace("-", " ").lower()
    if name_phrase in " ".join(sorted(prompt_tokens)):
        return 100.0

    overlap = prompt_tokens & (desc_tokens | name_tokens)
    if not overlap:
        return 0.0
    return (len(overlap) / max(len(prompt_tokens), 1)) * 50


def find_best_match(prompt: str, agents: list) -> tuple:
    prompt_tokens = tokenize(prompt)
    best_name = None
    best_score = 0.0

    for agent in agents:
        score = score_match(prompt_tokens, agent.get("description", ""), agent.get("name", ""))
        if score > best_score:
            best_score = score
            best_name = agent.get("name")

    return best_name, best_score


def evaluate(corpus: dict, agents: list) -> dict:
    evals = corpus.get("evals", [])
    results = []

    for entry in evals:
        prompt = entry["prompt"]
        expected_agent = entry.get("expectedAgent")

        matched_agent, score = find_best_match(prompt, agents)

        passed = True
        if expected_agent:
            passed = matched_agent == expected_agent

        results.append({
            "id": entry["id"],
            "prompt": prompt[:60],
            "team": entry.get("team", "dev"),
            "expected_agent": expected_agent,
            "matched_agent": matched_agent,
            "score": score,
            "passed": passed,
            "tags": entry.get("tags", []),
        })

    total = len(results)
    passed_count = sum(1 for r in results if r["passed"])
    return {
        "total": total,
        "passed": passed_count,
        "failed": total - passed_count,
        "pass_rate": round(passed_count / max(total, 1) * 100, 1),
        "results": results,
    }


def print_report(data: dict, short: bool = False):
    rate = data["pass_rate"]
    print(f"\n{'='*56}")
    print(f"  Routing Eval — {date.today()}")
    print(f"{'='*56}")
    print(f"  Total    : {data['total']}")
    print(f"  PASS     : {data['passed']}")
    print(f"  FAIL     : {data['failed']}")
    print(f"  Rate     : {rate}%  {'PASS' if rate >= 90 else 'FAIL'}")
    print(f"{'='*56}\n")

    if not short:
        failures = [r for r in data["results"] if not r["passed"]]
        if failures:
            print("FAILURES")
            print("-" * 56)
            for r in failures:
                print(f"  #{r['id']} \"{r['prompt']}\"")
                print(f"    expected={r['expected_agent']}  got={r['matched_agent']}")
            print()

    if BASELINE_PATH.exists():
        with open(BASELINE_PATH) as f:
            baseline = json.load(f)
        baseline_rate = baseline.get("pass_rate", 0)
        delta = rate - baseline_rate
        direction = "improved" if delta > 0 else ("regressed" if delta < 0 else "unchanged")
        print(f"Baseline: {baseline_rate}% ({baseline.get('date', 'unknown')})")
        print(f"Delta:    {'+' if delta >= 0 else ''}{delta:.1f}% ({direction})")
        if delta < 0:
            print("WARNING: Regression detected!")
        print()


def save_baseline(data: dict):
    baseline = {
        "date": date.today().isoformat(),
        "pass_rate": data["pass_rate"],
        "total": data["total"],
        "passed": data["passed"],
    }
    BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(BASELINE_PATH, "w") as f:
        json.dump(baseline, f, indent=2)
    print(f"Baseline saved: {data['pass_rate']}% on {date.today()}")


def save_report(data: dict):
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    path = REPORT_DIR / f"routing-eval-{date.today()}.md"
    lines = [
        f"# Routing Eval Report — {date.today()}\n\n",
        f"**Total:** {data['total']}  **PASS:** {data['passed']}  **FAIL:** {data['failed']}  **Rate:** {data['pass_rate']}%\n\n",
    ]
    failures = [r for r in data["results"] if not r["passed"]]
    if failures:
        lines.append("## Failures\n\n| # | Prompt | Expected | Got |\n|---|--------|----------|-----|\n")
        for r in failures:
            exp = r["expected_agent"] or "?"
            got = r["matched_agent"] or "?"
            lines.append(f"| {r['id']} | {r['prompt']} | {exp} | {got} |\n")
    path.write_text("".join(lines))
    print(f"Report saved: {path.relative_to(ROOT)}")


def main():
    args = sys.argv[1:]
    short = "--short" in args
    save_bl = "--baseline" in args

    if not CORPUS_PATH.exists():
        print(f"Corpus not found: {CORPUS_PATH}")
        return 1

    corpus = load_corpus()
    agents = load_agents()

    if not agents:
        print("No agents found. Run build-manifest.py first or check .claude/agents/")
        return 1

    data = evaluate(corpus, agents)
    print_report(data, short)
    save_report(data)

    if save_bl:
        save_baseline(data)

    return 0 if data["pass_rate"] >= 90 else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
import json, sys
def main():
    msg = (
        "You are Tau, project architect for VantageStarter on tau-vps. "
        "STARTUP SEQUENCE (do all immediately): "
        "1. Call set_summary with orchestratorId='tau', instanceId='tau-vps', summary='Session started'. "
        "2. Call check_messages with recipient='tau', recipientInstanceId='tau-vps'. "
        "3. Run /check-tasks to see your prioritized task list. "
        "4. Call recall with query='priorities pending blockers', namespace='project/vantage-starter', limit=5. "
        "5. Run /loop 5m /check-messages to auto-check messages every 5 minutes. "
        "6. Start working on your highest-priority unblocked task immediately. "
        "You are an architect — delegate to specialist agents, never code yourself."
    )
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": f"[Tau-vps session start] {msg}"}}))
    return 0
if __name__ == '__main__': sys.exit(main())

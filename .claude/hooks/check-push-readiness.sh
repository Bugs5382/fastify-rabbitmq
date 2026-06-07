#!/usr/bin/env bash
# Claude Code PreToolUse hook (matcher: Bash).
# On `git push`, gives fast feedback: blocks if there are uncommitted changes or
# if a quick test pass fails for the detected ecosystem. The git pre-push hook is
# the authoritative gate; this just shortens the feedback loop.
set -euo pipefail
PY="$(command -v python3 || echo /usr/bin/python3)"
input="$(cat)"
cmd="$(printf '%s' "$input" | "$PY" -c 'import json,sys
try: print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception: print("")')"

case "$cmd" in *"git push"*) ;; *) exit 0 ;; esac

deny() {
  "$PY" -c 'import json,sys
print(json.dumps({"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":sys.argv[1]}}))' "$1"
  exit 0
}

if ! git diff --quiet --exit-code 2>/dev/null; then
  deny "Uncommitted changes present. Commit or stash before pushing."
fi
if [ -f go.mod ]; then
  if ! go test -short ./... >/dev/null 2>&1; then
    deny "Quick test pass failed (go test -short ./...). Fix before pushing."
  fi
fi
exit 0

#!/usr/bin/env bash
# Claude Code PreToolUse hook (matcher: Bash).
# Blocks git commit / gh issue|pr create|comment commands whose message, title,
# or body contains an AI tell or emoji. Advisory layer; the git hooks enforce.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$DIR/lib.sh"

PY="$(command -v python3 || echo /usr/bin/python3)"
input="$(cat)"
cmd="$(printf '%s' "$input" | "$PY" -c 'import json,sys
try: print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception: print("")')"

case "$cmd" in
  *"git commit"*|*"gh issue create"*|*"gh pr create"*|*"gh issue comment"*|*"gh pr comment"*) ;;
  *"gh api"*comment*) ;;
  *) exit 0 ;;
esac

tells="$(printf '%s' "$cmd" | gov_find_text_tells)"
emoji="$(printf '%s' "$cmd" | gov_find_emoji)"
if [ -n "$tells$emoji" ]; then
  reason="Blocked: AI-tell or emoji in a commit/issue/PR command. Remove attribution trailers (Co-Authored-By, Generated with), emojis, and session/AI references, then retry. Matched: ${tells} ${emoji}"
  "$PY" -c 'import json,sys
print(json.dumps({"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":sys.argv[1]}}))' "$reason"
fi
exit 0

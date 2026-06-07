#!/usr/bin/env bash
# Claude Code PreToolUse hook (matcher: Bash).
# Validates Conventional Commit format on git commit -m and gh issue|pr create
# titles. Advisory layer; the commit-msg git hook enforces.
set -euo pipefail
PY="$(command -v python3 || echo /usr/bin/python3)"
input="$(cat)"

# Extract the command and, from it, the relevant title/message via shlex so we
# survive quoting. Emits the candidate title on stdout (empty if not applicable).
title="$(printf '%s' "$input" | "$PY" -c '
import json,sys,shlex
try:
    cmd=json.load(sys.stdin).get("tool_input",{}).get("command","")
except Exception:
    print(""); sys.exit()
try:
    toks=shlex.split(cmd)
except Exception:
    print(""); sys.exit()
is_commit="git" in toks and "commit" in toks
is_create=("gh" in toks) and ("create" in toks)
if not (is_commit or is_create):
    print(""); sys.exit()
flags=({"-m","--message"} if is_commit else {"-t","--title"})
val=""
for i,t in enumerate(toks):
    if t in flags and i+1<len(toks):
        val=toks[i+1]; break
    for f in flags:
        if t.startswith(f+"="):
            val=t[len(f)+1:]; break
    if val: break
print(val.splitlines()[0] if val else "")')"

[ -z "$title" ] && exit 0

if printf '%s' "$title" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9._-]+\))?!?: .+'; then
  exit 0
fi

reason="Blocked: title is not a Conventional Commit. Use type(scope)?: description, where type is one of feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. Got: ${title}"
"$PY" -c 'import json,sys
print(json.dumps({"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":sys.argv[1]}}))' "$reason"
exit 0

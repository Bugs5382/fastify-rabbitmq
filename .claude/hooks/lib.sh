#!/usr/bin/env bash
# Shared helpers for the project governance hooks.
# Works with BSD (macOS) and GNU tooling. Emoji detection uses perl (BSD grep
# lacks -P); text-pattern detection uses grep -E.

GOV_HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOV_PATTERNS_FILE="${GOV_PATTERNS_FILE:-$GOV_HOOKS_DIR/forbidden-text.txt}"

# Build one extended-regex alternation from the patterns file.
gov_text_regex() {
  grep -vE '^[[:space:]]*(#|$)' "$GOV_PATTERNS_FILE" 2>/dev/null | paste -sd '|' -
}

# Read stdin; print offending lines for forbidden AI-tell phrases (empty if none).
gov_find_text_tells() {
  local re
  re="$(gov_text_regex)"
  [ -z "$re" ] && return 0
  grep -inE "$re" || true
}

# Read stdin; print offending lines containing emoji/pictographs (empty if none).
gov_find_emoji() {
  perl -CSD -ne 'print "$.: $_" if /[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE00}-\x{FE0F}\x{1F1E6}-\x{1F1FF}]/'
}

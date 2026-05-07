#!/usr/bin/env bash
# PostToolUse hook: prettier --write -> eslint --fix on the touched file.
# Blocks the agent (exit 2) when eslint errors remain after auto-fix so the
# violations are surfaced back to Claude instead of being silently shipped.
set -u

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')"

[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

case "$file" in
  "$PROJECT_ROOT"/*) ;;
  *) exit 0 ;;
esac

case "$file" in
  *"/node_modules/"*|*"/.next/"*|*"/out/"*|*"/build/"*|*"/coverage/"*) exit 0 ;;
esac

ext="${file##*.}"
case "$ext" in
  ts|tsx|js|jsx|mjs|cjs|json|css|md) ;;
  *) exit 0 ;;
esac

cd "$PROJECT_ROOT" || exit 0

npx --no-install prettier --write --log-level=error --ignore-unknown "$file" >/dev/null 2>&1 || true

case "$ext" in
  ts|tsx|js|jsx|mjs|cjs)
    eslint_out="$(npx --no-install eslint --fix --no-warn-ignored "$file" 2>&1)"
    eslint_ec=$?
    if [ "$eslint_ec" -ne 0 ]; then
      {
        echo "[code-quality hook] ESLint reports remaining errors after --fix:"
        echo "  $file"
        echo
        echo "$eslint_out"
        echo
        echo "Fix the lint errors above before continuing."
      } >&2
      exit 2
    fi
    ;;
esac

exit 0

#!/usr/bin/env bash
# UserPromptSubmit hook: enforce model-task mapping declared in PROCEDURE.md.
#
# Behavior:
#   - Extract a task ID (e.g. T01, T17) from the user's prompt.
#   - If found, look up the required model in docs/design-docs/PROCEDURE.md
#     (heading line "### T0X: ... [model: opus|sonnet|haiku]").
#   - Detect the current model from the transcript's last assistant message.
#   - If the current model differs from the required model, exit 2 to block
#     the prompt and instruct the user to switch via /model.
#   - No task ID in prompt, or PROCEDURE.md missing, or model undetectable
#     -> exit 0 (do not block).
set -u

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROCEDURE_FILE="$PROJECT_ROOT/docs/design-docs/PROCEDURE.md"

input="$(cat)"
prompt="$(printf '%s' "$input" | jq -r '.prompt // empty')"
transcript="$(printf '%s' "$input" | jq -r '.transcript_path // empty')"

[ -z "$prompt" ] && exit 0
[ ! -f "$PROCEDURE_FILE" ] && exit 0

task_id="$(printf '%s' "$prompt" | grep -oE '\bT[0-9]{1,3}\b' | head -1)"
[ -z "$task_id" ] && exit 0

required_model="$(grep -E "^### $task_id:" "$PROCEDURE_FILE" \
  | grep -oE '\[model: (opus|sonnet|haiku)\]' \
  | grep -oE '(opus|sonnet|haiku)' \
  | head -1)"
[ -z "$required_model" ] && exit 0

current_model_id=""
if [ -n "$transcript" ] && [ -f "$transcript" ]; then
  current_model_id="$(jq -rs 'map(select(.type=="assistant")) | last | .message.model // empty' "$transcript" 2>/dev/null)"
fi
[ -z "$current_model_id" ] && exit 0

current_model="$(printf '%s' "$current_model_id" | grep -oE '(opus|sonnet|haiku)' | head -1)"
[ -z "$current_model" ] && exit 0

if [ "$current_model" != "$required_model" ]; then
  cat >&2 <<EOF
[procedure-check] Task $task_id requires model: $required_model
                  Current model:                $current_model ($current_model_id)

Switch models with /model before continuing this task.
See docs/design-docs/PROCEDURE.md for the full task / model mapping.
EOF
  exit 2
fi

exit 0

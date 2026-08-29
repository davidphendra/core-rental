#!/usr/bin/env bash
# plan-consistency-check.sh — cross-artifact consistency gate for epic capsules.
# Usage: bash scripts/lib/plan-consistency-check.sh specs/epics/<capsule>/
# Exit 0 = no CRITICAL/HIGH findings. Prints CRITICAL / HIGH / MED findings.
# Dependency-free: pure bash + grep/awk on the simple YAML used in capsules.

set -u
CAPSULE="${1:-}"
if [ -z "$CAPSULE" ] || [ ! -d "$CAPSULE" ]; then
  echo "CRITICAL: capsule dir not found: ${CAPSULE:-<none>}"
  exit 1
fi

EPIC_YAML="$CAPSULE/epic.yaml"
[ -f "$EPIC_YAML" ] || { echo "CRITICAL: missing epic.yaml in $CAPSULE"; exit 1; }

critical=0; high=0; med=0
note() { printf '%s: %s\n' "$1" "$2"; }

# --- BCP sum vs total_bcps ---------------------------------------------------
total_bcps=$(awk -F': ' '/^total_bcps:/ {print $2}' "$EPIC_YAML" | tr -d ' ')
sum=0
for f in "$CAPSULE"/*-tasks.yaml; do
  b=$(awk -F': ' '/^bcps:/ {print $2; exit}' "$f" | tr -d ' ')
  if [ -n "$b" ] && [ "$b" -eq "$b" ] 2>/dev/null; then sum=$((sum + b)); fi
done
if [ -n "$total_bcps" ] && [ "$sum" -ne "$total_bcps" ] 2>/dev/null; then
  note CRITICAL "BCP sum ($sum) != total_bcps ($total_bcps)"
  critical=$((critical + 1))
fi

# --- Story ids in epic.yaml must have a tasks.yaml ---------------------------
story_ids=$(awk '/^  - id: e[0-9]+s[0-9]+$/ {print $3}' "$EPIC_YAML")
for sid in $story_ids; do
  if ! ls "$CAPSULE/$sid-tasks.yaml" >/dev/null 2>&1; then
    note CRITICAL "story $sid listed in epic.yaml but no $sid-tasks.yaml"
    critical=$((critical + 1))
  fi
done

# --- Per-tasks.yaml checks ---------------------------------------------------
shopt -s nullglob
for f in "$CAPSULE"/*-tasks.yaml; do
  sid=$(awk -F': ' '/^story_id:/ {print $2}' "$f" | tr -d ' ')
  # story_id must exist in epic.yaml
  if ! grep -q "id: $sid" "$EPIC_YAML"; then
    note CRITICAL "$(basename "$f"): story_id $sid not in epic.yaml"
    critical=$((critical + 1))
  fi
  # each task block needs id, description, verify, risk, status
  task_count=$(grep -c '^  - id: ' "$f")
  [ "$task_count" -gt 0 ] || { note CRITICAL "$(basename "$f"): no tasks"; critical=$((critical + 1)); }
  for t in $(grep '^  - id: ' "$f" | awk '{print $3}'); do
    # verify exists on the next non-empty line after description (loose: file contains a verify: line)
    if ! grep -q '^    verify: ' "$f"; then
      note HIGH "$(basename "$f") task $t: missing runnable verify:"
      high=$((high + 1))
    fi
    risk=$(awk "/^  - id: $t\$/{found=1} found && /^    risk: /{print \$2; exit}" "$f" | tr -d ' ')
    case "$risk" in
      P0|P1|P2|P3) ;;
      *) note HIGH "$(basename "$f") task $t: risk '$risk' not P0-P3"; high=$((high + 1));;
    esac
    status=$(awk "/^  - id: $t\$/{found=1} found && /^    status: /{print \$2; exit}" "$f" | tr -d ' ')
    case "$status" in
      failing|passing) ;;
      *) note HIGH "$(basename "$f") task $t: status '$status' not failing|passing"; high=$((high + 1));;
    esac
    if [ "$status" = "passing" ]; then
      note MED "$(basename "$f") task $t: marked passing at plan time (e45s06 — only flip after verify exits 0)"
      med=$((med + 1))
    fi
  done
done

# --- Delta tags on modified stories (e45s29) ---------------------------------
for sid in $story_ids; do
  spec=$(awk "/^  - id: $sid\$/{found=1} found && /spec:/{print \$2; exit}" "$EPIC_YAML" | tr -d ' ')
  if [ -n "$spec" ] && [ -f "$CAPSULE/$spec" ]; then
    if grep -q '#### \(MODIFIED\|REMOVED\|RENAMED\)' "$CAPSULE/$spec"; then
      # each modified/removed/renamed must carry Before: and After:
      count=$(grep -c '^\*\*Before:\*\*' "$CAPSULE/$spec")
      count2=$(grep -c '^\*\*After:\*\*' "$CAPSULE/$spec")
      if [ "$count" -lt 1 ] || [ "$count" -ne "$count2" ]; then
        note HIGH "$spec: MODIFIED/REMOVED/RENAMED without matching Before/After blocks (e45s29)"
        high=$((high + 1))
      fi
    fi
  fi
done

echo "---"
echo "findings: critical=$critical high=$high med=$med"
[ "$critical" -eq 0 ] && [ "$high" -eq 0 ] && exit 0
exit 1

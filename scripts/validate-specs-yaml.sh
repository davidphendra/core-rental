#!/usr/bin/env bash
# validate-specs-yaml.sh — release-plan + capsule structural gate.
# Usage: bash scripts/validate-specs-yaml.sh
# Exit 0 = structurally valid. Dependency-free: bash + grep/awk.
set -u
RP="specs/release-plan.yaml"
EPICS_DIR="specs/epics"

fail=0
note() { printf '%s: %s\n' "$1" "$2"; }

[ -f "$RP" ] || { note CRITICAL "missing $RP"; exit 1; }

# release block essentials
for key in version codename status semantic_release bump_hint; do
  grep -q "^  $key:" "$RP" || { note CRITICAL "release block missing $key"; fail=1; }
done

# bump_hint must be patch|minor|major
bh=$(awk '/^  bump_hint:/ {print $2}' "$RP" | tr -d ' ')
case "$bh" in patch|minor|major) ;; *) note CRITICAL "bump_hint '$bh' invalid"; fail=1;; esac

# status must be planning|in_progress|released
st=$(awk '/^  status:/ {print $2}' "$RP" | tr -d ' ')
case "$st" in planning|in_progress|released) ;; *) note CRITICAL "release status '$st' invalid"; fail=1;; esac

# every epic entry: id, title, wsjf, capsule_dir + capsule exists
epics=$(grep -c '^  - id: e[0-9]' "$RP")
[ "$epics" -gt 0 ] || { note CRITICAL "no epics listed"; fail=1; }

ids=$(grep '^  - id: e[0-9]' "$RP" | awk '{print $3}')
for id in $ids; do
  wsjf=$(awk "/^  - id: $id\$/{f=1} f && /wsjf:/{print \$2; exit}" "$RP" | tr -d ' ')
  if [ -n "$wsjf" ] && ! [ "$wsjf" -eq "$wsjf" ] 2>/dev/null && ! echo "$wsjf" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then
    note CRITICAL "epic $id: wsjf '$wsjf' not numeric"; fail=1
  fi
  dir=$(awk "/^  - id: $id\$/{f=1} f && /capsule_dir:/{print \$2; exit}" "$RP" | tr -d ' ')
  if [ -n "$dir" ]; then
    # capsule_dir is specs-relative (e.g. epics/e09-...); archived live under specs/epics/archive/<name>
    if [ -f "specs/$dir/epic.yaml" ] || [ -f "specs/epics/archive/${dir#epics/}/epic.yaml" ]; then
      :
    else
      note CRITICAL "epic $id: capsule $dir missing epic.yaml (live or archive)"; fail=1
    fi
  else
    note CRITICAL "epic $id: missing capsule_dir"; fail=1
  fi
done

# duplicate ids
dup=$(grep '^  - id: e[0-9]' "$RP" | awk '{print $3}' | sort | uniq -d)
[ -z "$dup" ] || { note CRITICAL "duplicate epic ids: $dup"; fail=1; }

echo "---"
echo "validate-specs-yaml: epics=$epics findings=$( [ $fail -eq 0 ] && echo clean || echo FAIL )"
exit $fail

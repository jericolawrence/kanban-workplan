#!/usr/bin/env bash
# Installs the kanban kit into a git repo: copies the three skills into .claude/skills/ and links
# them for Codex (.agents/skills/) and Cursor (.cursor/skills/). Run it again to update; files you
# added inside the skill folders stay, files the kit ships are replaced.
#
# Usage: install.sh [path/to/repo]     (default: the current directory)
set -euo pipefail

kit=$(cd "$(dirname "$0")" && pwd)
target=$(cd "${1:-.}" && git rev-parse --show-toplevel 2>/dev/null) \
  || { echo "install: ${1:-.} is not inside a git repo" >&2; exit 1; }
skills=(save-to-kanban setup-kanban-space start-working-kanban)

missing=()
for tool in git bash jq; do command -v "$tool" >/dev/null || missing+=("$tool"); done
[ ${#missing[@]} -eq 0 ] || { echo "install: needs ${missing[*]} on PATH" >&2; exit 1; }
command -v gh >/dev/null || echo "install: gh not found; boards work, but tickets and /start-working-kanban need it"

mkdir -p "$target/.claude/skills"
for s in "${skills[@]}"; do
  mkdir -p "$target/.claude/skills/$s"
  cp -R "$kit/skills/$s/." "$target/.claude/skills/$s/"
done
chmod +x "$target/.claude/skills/save-to-kanban/kanban.sh" "$target/.claude/skills/start-working-kanban/watch.sh"

for dir in .agents/skills .cursor/skills; do
  mkdir -p "$target/$dir"
  for s in "${skills[@]}"; do
    link="$target/$dir/$s"
    if [ -L "$link" ] || [ ! -e "$link" ]; then ln -sfn "../../.claude/skills/$s" "$link"
    else echo "install: $dir/$s exists and is not a link; left it alone"; fi
  done
done

echo "Installed into $target"
echo "Next: open an agent in that repo and run /setup-kanban-space (Claude Code), or ask Codex or Cursor to \"set up the kanban\"."

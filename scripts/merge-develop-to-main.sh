#!/usr/bin/env bash
# Push develop and merge it into main.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: not a git repository" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is dirty — commit or stash first" >&2
  git status --short
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "develop" ]]; then
  echo "error: checkout develop first (currently on '$CURRENT_BRANCH')" >&2
  exit 1
fi

echo "→ Pushing develop..."
git push origin develop

echo "→ Updating main..."
git fetch origin main
git checkout main
git pull origin main

echo "→ Merging develop into main..."
git merge develop -m "Merge branch 'develop' into main"

echo "→ Pushing main..."
git push origin main

echo "→ Returning to develop..."
git checkout develop

echo "✓ develop pushed and merged into main"
git log -1 --oneline origin/main
git log -1 --oneline origin/develop

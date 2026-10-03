#!/usr/bin/env bash
# Scaffold a threads-grid editor project from this skill's template.
#   scaffold.sh <target-dir> [--no-install]
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:?usage: scaffold.sh <target-dir> [--no-install]}"
if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "✗ $TARGET exists and is not empty" >&2
  exit 1
fi
mkdir -p "$TARGET"
# Copy template without local build artifacts.
rsync -a --exclude node_modules --exclude .next --exclude exports --exclude 'threads-grid.json' \
  --exclude 'public/uploads/*' --exclude '*.tsbuildinfo' --exclude next-env.d.ts \
  "$SKILL_DIR/template/" "$TARGET/"
mkdir -p "$TARGET/public/uploads" && touch "$TARGET/public/uploads/.gitkeep"
echo "✓ Scaffolded threads-grid editor into $TARGET"
if [ "${2:-}" != "--no-install" ]; then
  cd "$TARGET"
  if command -v pnpm >/dev/null; then pnpm install; else npm install; fi
fi
echo "Next: write $TARGET/threads-grid.json, then: cd $TARGET && pnpm draft <template> && pnpm dev"

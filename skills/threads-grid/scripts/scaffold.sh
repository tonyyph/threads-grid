#!/usr/bin/env bash
# Thin wrapper kept for compatibility — the real scaffolder is scaffold.mjs (cross-platform).
#   scaffold.sh <target-dir> [--no-install]
set -euo pipefail
exec node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scaffold.mjs" "$@"

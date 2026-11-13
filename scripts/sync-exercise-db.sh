#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
mkdir -p "$ROOT/public/data"
curl -fsSL "$URL" -o "$ROOT/public/data/exercises.json"
echo "Wrote $ROOT/public/data/exercises.json"

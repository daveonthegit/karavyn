#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Karavyn DB Migrate ==="

cd "$PROJECT_ROOT"

echo ""
echo "[1/2] Generating migrations from schema..."
pnpm db:generate

echo ""
echo "[2/2] Applying migrations to database..."
pnpm db:migrate

echo ""
echo "Migrations applied successfully."

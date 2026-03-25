#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.dev-pids"
LOG_DIR="$PROJECT_ROOT/.dev-logs"

echo "=== Karavyn Dev Start ==="

# Stop any existing processes
echo "[1/3] Stopping existing processes..."
bash "$SCRIPT_DIR/dev-stop.sh"

# Install dependencies
echo ""
echo "[2/3] Installing dependencies..."
cd "$PROJECT_ROOT"
pnpm install

# Prepare log directory
mkdir -p "$LOG_DIR"
> "$PID_FILE"

# Start API
echo ""
echo "[3/3] Starting dev servers..."
echo "  Starting API on port 3000..."
cd "$PROJECT_ROOT/apps/api"
pnpm dev > "$LOG_DIR/api.log" 2>&1 &
API_PID=$!
echo "$API_PID" >> "$PID_FILE"

# Start Mobile
echo "  Starting Expo dev server..."
cd "$PROJECT_ROOT/apps/mobile"
pnpm dev > "$LOG_DIR/mobile.log" 2>&1 &
MOBILE_PID=$!
echo "$MOBILE_PID" >> "$PID_FILE"

# Wait for API to be ready
echo ""
echo "Waiting for API to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "  API is ready!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  Warning: API did not respond within 30s. Check .dev-logs/api.log"
  fi
  sleep 1
done

echo ""
echo "=== Karavyn is running ==="
echo "  API:    http://localhost:3000       (PID: $API_PID)"
echo "  Mobile: Expo dev server             (PID: $MOBILE_PID)"
echo "  Logs:   $LOG_DIR/"
echo ""
echo "  Stop with: bash scripts/dev-stop.sh"

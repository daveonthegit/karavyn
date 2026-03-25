#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.dev-pids"

echo "=== Karavyn Dev Stop ==="

# Kill tracked PIDs from pid file
if [ -f "$PID_FILE" ]; then
  while IFS= read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "Killing tracked process $pid"
      kill -- -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
fi

# Kill anything on API port 3000
if lsof -i :3000 -t >/dev/null 2>&1; then
  echo "Killing processes on port 3000 (API)"
  lsof -i :3000 -t | xargs kill -9 2>/dev/null || true
fi

# Kill anything on Expo port 8081
if lsof -i :8081 -t >/dev/null 2>&1; then
  echo "Killing processes on port 8081 (Expo)"
  lsof -i :8081 -t | xargs kill -9 2>/dev/null || true
fi

# Kill any tsx/expo processes spawned from this project
pgrep -f "tsx watch.*$PROJECT_ROOT" | xargs kill -9 2>/dev/null || true
pgrep -f "expo start.*$PROJECT_ROOT" | xargs kill -9 2>/dev/null || true

echo "All Karavyn dev processes stopped."

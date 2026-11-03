#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$PROJECT_ROOT/.run"
cd "$PROJECT_ROOT/backend"
"$PROJECT_ROOT/.venv/bin/python" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$PROJECT_ROOT/.run/backend.log" 2>&1 &
BACKEND_PID=$!
FRONTEND_PID=''
cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
  if [[ -n "$FRONTEND_PID" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT TERM
cd "$PROJECT_ROOT/frontend"
node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173 --strictPort > "$PROJECT_ROOT/.run/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo 'PowerLab starting: API :8000, frontend :5173. Logs: .run/'
wait -n "$BACKEND_PID" "$FRONTEND_PID"

#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"
export UV_CACHE_DIR="${UV_CACHE_DIR:-$PROJECT_ROOT/.cache/uv}"
uv venv --allow-existing --python python3 .venv
uv pip sync --python .venv/bin/python backend/requirements.lock
cd frontend
npm ci --cache "$PROJECT_ROOT/.cache/npm" --no-audit --no-fund
npm run build

#!/usr/bin/env bash
set -euo pipefail

# Helper script to apply Alembic migrations for the backend
# Usage: backend/run_migrations.sh
# Ensure you run this from the project root or call the script directly.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALEMBIC_INI="$ROOT_DIR/alembic.ini"

if [ ! -f "$ALEMBIC_INI" ]; then
  echo "ERROR: alembic.ini not found at $ALEMBIC_INI"
  exit 1
fi

echo "Applying alembic migrations using $ALEMBIC_INI"

if command -v alembic >/dev/null 2>&1; then
  alembic -c "$ALEMBIC_INI" upgrade head
else
  # Fallback to python -m alembic (requires alembic installed in the Python env)
  python3 -m alembic -c "$ALEMBIC_INI" upgrade head
fi

echo "Migrations applied."

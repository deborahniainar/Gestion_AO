#!/usr/bin/env bash
set -euo pipefail
python - << "PY"
from app.db.base import Base
from app.db.session import engine
Base.metadata.create_all(bind=engine)
print("Tables créées (si non existantes).")
PY


#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

python -m pip install --upgrade pip
pip install -r "${ROOT_DIR}/backend/requirements.txt"

cd "${ROOT_DIR}/frontend"
npm ci


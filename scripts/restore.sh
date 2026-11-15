#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:?usage: restore.sh <backup-dir>}"
DATA="${ATTEST_DATA_DIR:-$ROOT/data}"
if [[ -z "${KMS_MASTER_KEY:-}" ]]; then
  echo "[restore] FATAL: set KMS_MASTER_KEY" >&2
  exit 1
fi
mkdir -p "$DATA"
echo "[restore] $SRC → $DATA"
[[ -f "$SRC/keystore.json" ]] && cp -a "$SRC/keystore.json" "$DATA/keystore.json" && chmod 600 "$DATA/keystore.json"
[[ -d "$SRC/log" ]] && mkdir -p "$DATA/log" && cp -a "$SRC/log/." "$DATA/log/"
[[ -d "$SRC/packages" ]] && mkdir -p "$DATA/packages" && cp -a "$SRC/packages/." "$DATA/packages/"
if [[ -f "$SRC/postgres.dump" && -n "${DATABASE_URL:-}" ]] && command -v pg_restore >/dev/null 2>&1; then
  pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" "$SRC/postgres.dump" || true
fi
echo "[restore] done. Check GET /healthz and historical verify."

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="${ATTEST_DATA_DIR:-$ROOT/data}"
OUT="${1:-$ROOT/backups/backup-$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$OUT"
echo "[backup] data dir: $DATA → $OUT"
if [[ -f "$DATA/keystore.json" ]]; then
  cp -a "$DATA/keystore.json" "$OUT/keystore.json"
  echo "[backup] keystore.json"
fi
if [[ -d "$DATA/log" ]]; then
  mkdir -p "$OUT/log"
  cp -a "$DATA/log/." "$OUT/log/" 2>/dev/null || true
  echo "[backup] log/"
fi
if [[ -d "$DATA/packages" ]]; then
  mkdir -p "$OUT/packages"
  cp -a "$DATA/packages/." "$OUT/packages/" 2>/dev/null || true
  echo "[backup] packages/"
fi
if [[ -n "${DATABASE_URL:-}" ]] && command -v pg_dump >/dev/null 2>&1; then
  pg_dump --no-owner --format=custom -f "$OUT/postgres.dump" "$DATABASE_URL"
  echo "[backup] postgres.dump"
fi
cat > "$OUT/README.txt" << EOT
EchoSign backup $(date -u -Iseconds)
Restore: scripts/restore.sh $OUT
Keep KMS_MASTER_KEY separate from this directory.
EOT
echo "[backup] done: $OUT"
echo "$OUT"

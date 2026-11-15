# ADMIN — EchoSign Attest (single-node on-prem)

## Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md). Preferred:

```bash
export KMS_MASTER_KEY="$(openssl rand -hex 32)"
export BOOTSTRAP_SECRET="$(openssl rand -hex 16)"
export DATABASE_URL=postgres://echosign:echosign@localhost:5432/echosign
export CORS_ALLOW_ORIGIN=https://ops.example.com
docker compose up -d --build
```

TLS terminates at reverse-proxy (Caddy/nginx). App listens HTTP on localhost.

## Environment

| Var | Required | Notes |
|-----|----------|--------|
| `KMS_MASTER_KEY` | prod | ≥16 chars; never commit |
| `BOOTSTRAP_SECRET` | prod key mint | first `POST /api/v1/keys` |
| `DATABASE_URL` | optional | Postgres; else file store |
| `ATTEST_DATA_DIR` | optional | default `./data` |
| `ATTEST_OFFLINE=1` | air-gap | no TSA/OTS outbound |
| `CORS_ALLOW_ORIGIN` | browsers | comma-separated, no `*` in prod |
| `DEMO_MODE=1` | local only | **forbidden** with `NODE_ENV=production` |

## Health & metrics

- `GET /health` — liveness + version + key fingerprint
- `GET /healthz` — deep: keystore, storage writable, postgres, log
- `GET /metrics` — Prometheus text
- Logs: JSON lines with `requestId` (`X-Request-Id`)

## Key rotation

```bash
curl -s -X POST -H "Authorization: Bearer $ADMIN_KEY" \
  http://127.0.0.1:3000/api/v1/attest/keys/rotate
```

## Backup / restore

```bash
./scripts/backup.sh
export KMS_MASTER_KEY='\u2026'
./scripts/restore.sh backups/backup-YYYYMMDDTHHMMSSZ
```

Keep `KMS_MASTER_KEY` **out** of the backup archive.

## Air-gapped

```bash
export ATTEST_OFFLINE=1
```

## Threat notes

See [THREAT_MODEL.md](./THREAT_MODEL.md). Integrity/provenance only — not deepfake detection.

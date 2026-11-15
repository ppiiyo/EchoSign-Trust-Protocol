# Deployment — EchoSign Attest

## Product path (default) — single-node on-prem

**This is the real product.** Persistent keystore, file or Postgres store, Merkle log, optional TSA/OTS.

```bash
git clone https://github.com/ppiiyo/EchoSign-Trust-Protocol
cd EchoSign-Trust-Protocol
git checkout release/v1.0.0   # or product-ready / tagged rc

# Env (example)
export NODE_ENV=production
export KMS_MASTER_KEY="$(openssl rand -hex 32)"
export ATTEST_DATA_DIR=./data
# optional Postgres:
# export DATABASE_URL=postgres://echosign:echosign@localhost:5432/echosign

docker compose up -d --build
# or: npm ci && npm run build:all && npm start
```

- TLS: terminate at reverse-proxy (Caddy/nginx); app listens HTTP on localhost.
- Air-gapped: `ATTEST_OFFLINE=1` → no outbound TSA/OTS; statuses stay honest (`unavailable` / `server-clock-only`).
- See `ADMIN.md` (WP-8) for backup/restore and key rotation.

**Do not run the product stack on Vercel** — ephemeral filesystem cannot host keystore + append-only log reliably.

## Limited public demo (optional) — Vercel

`api/index.ts` is a **limited demo** only:

| Capability | Demo | Product |
|------------|------|--------|
| Ed25519 sign/verify | yes | yes |
| Fingerprint algorithm | same as product | product |
| Persistent org keys | no (per-instance `/tmp`) | yes |
| API keys / auth | **disabled** (403) | yes |
| Merkle log | no | yes |
| TSA / OTS | unavailable | optional |
| Version claim | package.json + `limited-demo` | package.json |

Banner on every response: *Limited demo: ephemeral keys, no time attestation, no transparency log.*

CORS: set `CORS_ALLOW_ORIGIN=https://your-frontend.example` (comma-separated). `*` is refused.

## Fingerprint (single definition)

```
kid = SHA-256( raw_32_byte_Ed25519_public_key ).hexdigest()[0:16]
```

Implemented in `packages/attest-crypto` as `fingerprintFromPublicKeyPem`. Demo host uses the same formula (enforced by `scripts/selftest-fingerprint.mjs`).

## Version source

`package.json` → `version` is the only source. `/health` and UI must read it (not hardcode).

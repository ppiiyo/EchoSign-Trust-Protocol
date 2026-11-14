# Product-ready tracker

| Claim | Evidence | Status |
| --- | --- | --- |
| Attest-only UI | WP-1 | done |
| Unified keystore | WP-2 | done |
| TSA/OTS honest | WP-3 | done |
| Merkle log | WP-4 | done |
| File + Postgres stores | `store.ts`, `store-pg.ts`, `migrations/` | WP-5 |
| docker compose app+db | `docker-compose.yml` | WP-5 |
| OpenAPI 3.1 | `openapi/openapi-v1.yaml` | WP-5 |
| Security hardening | WP-6 | pending |

```bash
docker compose up --build
node scripts/smoke-mvp.mjs
```

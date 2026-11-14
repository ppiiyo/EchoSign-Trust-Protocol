# Storage (WP-5)

| Mode | When | Backend |
| --- | --- | --- |
| File | no `DATABASE_URL` | `data/` JSON + JSONL |
| Postgres | `DATABASE_URL` set | `migrations/001_init.sql` |

```bash
# file demo
unset DATABASE_URL && DEMO_MODE=1 npm run dev

# compose
export KMS_MASTER_KEY='long-passphrase-here'
docker compose up --build

npm run migrate   # when DATABASE_URL set
```

OpenAPI: `openapi/openapi-v1.yaml` · `GET /api/v1/openapi.json`

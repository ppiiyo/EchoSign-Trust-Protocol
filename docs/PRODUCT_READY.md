# Product-ready tracker

| Claim | Evidence | Status |
| --- | --- | --- |
| UI Attest-only | `src/App.tsx` | WP-1 |
| Unified keystore loud-fail | `EncryptedKeystore` | WP-2 |
| TSA/OTS honest statuses | `attachTimeAttestation` | WP-3 |
| Append-only Merkle log | `server/services/transparency-log.ts`, `merkle.ts` | WP-4 |
| Inclusion proof API | `GET /api/v1/log/proof/:index` | WP-4 |
| Daily published root | `data/log/roots/YYYY-MM-DD.json` | WP-4 |
| Tamper breaks vs published root | selftest-merkle-log / transparency-log tests | WP-4 |
| Postgres + OpenAPI | WP-5 | pending |

```bash
node scripts/selftest-merkle-log.mjs
# after sign: response.log.inclusionProof + GET /api/v1/log/root
```

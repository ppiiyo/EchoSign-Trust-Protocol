# Product-ready tracker

| Claim | Evidence | Status |
| --- | --- | --- |
| UI Attest-only | `src/App.tsx`, branch `legacy-demo` | WP-1 |
| RU/ZH non-claims | README.ru/zh | WP-1 |
| No dual AttestKeyring | `server/services/attest.ts` uses `EncryptedKeystore` only | WP-2 |
| Loud-fail corrupt/wrong passphrase | `EncryptedKeystore.load` → `KEYSTORE_DECRYPT_FAILED`; `scripts/selftest-keystore-loud.mjs` | WP-2 |
| Rotation keeps historical verify | `EncryptedKeystore.rotateKey` + keystore tests | WP-2 |
| Backup/restore documented | `docs/KEYSTORE_BACKUP.md` | WP-2 |
| TSA/OTS in sign path | WP-3 | pending |

```bash
node scripts/selftest-keystore-loud.mjs
node scripts/selftest-store.mjs
npm test   # includes tests/keystore-loud-fail.test.ts when vitest available
```

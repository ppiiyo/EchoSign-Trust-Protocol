# Product-ready tracker

| Claim | Evidence | Status |
| --- | --- | --- |
| WP-1…WP-5 core | prior commits | done |
| Persistence facade PG/file | `server/services/persistence.ts` | done |
| Package+log on PG txn path | `savePackageAndLog` | done |
| prod forbids DEMO_MODE | `assertSafeRuntime` | WP-6 |
| Headers + rate limits | `server/security.ts` | WP-6 |
| SSRF helper | `isBlockedOutboundHost` | WP-6 |
| Verifier/PDF/QR | WP-7 | pending |

```bash
node scripts/selftest-security.mjs
```

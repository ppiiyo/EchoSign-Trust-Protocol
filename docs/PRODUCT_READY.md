# Product-ready tracker

| WP | Claim | Status |
| --- | --- | --- |
| 1–6 | Core product path | done |
| 7 | `verify-bundle.mjs` full CLI | done |
| 7 | Integrity report HTML/PDF/JSON | done |
| 7 | Browser offline verifier honest UX | done |
| 8 | Capture SDK / release polish | pending |

```bash
node scripts/demo-sign-verify.mjs
node scripts/verify-bundle.mjs tmp-demo/sample.esatt.json
node scripts/report-integrity.mjs tmp-demo/sample.esatt.json --out tmp-report
# open /verify/ in the app
```

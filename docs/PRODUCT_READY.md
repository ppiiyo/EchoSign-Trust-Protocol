# Product-ready tracker

| Claim | Evidence | Status |
| --- | --- | --- |
| UI is Attest-only | `src/App.tsx`; mocks on `legacy-demo` | WP-1 done |
| RU/ZH README non-claims | `README.ru.md`, `README.zh.md` | WP-1 done |
| bun.lock removed; Node>=20 | `.nvmrc`, engines | WP-1 done |
| Unified keystore | WP-2 | pending |
| TSA/OTS in sign path | WP-3 | pending |

```bash
git checkout product-ready
grep -riE "ISO 17025|courtroom|SIP/RTP|Whisper|Polygon|verifiedOnChain" src/ server/ README* || true
npm install && npm run lint && npm test && npm run build
```

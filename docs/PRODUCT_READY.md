# Product-ready tracker

| Claim | Evidence | Status |
| --- | --- | --- |
| UI Attest-only | `src/App.tsx`, `legacy-demo` | WP-1 |
| Unified keystore, loud-fail | `EncryptedKeystore`, selftest-keystore-loud | WP-2 |
| TSA/OTS on sign, honest status | `attachTimeAttestation`, `attestSignAudioWithTime` | WP-3 |
| Offline → server-clock-only | `ATTEST_OFFLINE=1` / `offline:true` | WP-3 |
| Forged TSA imprint check | `tsaTokenStructuralCheck` | WP-3 |
| OTS never false-verified | `otsStatusFromProof` bitcoinConfirmed=false | WP-3 |
| Transparency log | WP-4 | pending |

```bash
node scripts/selftest-time-offline.mjs
ATTEST_OFFLINE=1 npm run dev
# sign → timeAttestation.clockSource === server-clock-only
LIVE=1  # optional real FreeTSA (not required for CI)
```

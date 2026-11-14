# Demo preview (generated)

These files were produced by the RC pipeline:

```bash
node scripts/demo-sign-verify.mjs
node scripts/verify-bundle.mjs tmp-demo/sample.esatt.json
# SIGNATURE: VALID
node scripts/report-integrity.mjs tmp-demo/sample.esatt.json --out docs/demo-preview
```

| File | Meaning |
| --- | --- |
| [report.html](./report.html) | Integrity report (open in browser) |
| [report.json](./report.json) | Machine-readable verify result |
| [qr.svg](./qr.svg) | Real QR (`es1:<contentHash>`) |
| [report.pdf](./report.pdf) | Minimal PDF summary |

**Result:** `signatureValid: true`  
**Claims:** proves integrity at signing time; does **not** prove human speaker / deepfake absence / legal seal.

Live UI (on your machine):

```bash
git checkout product-ready && npm install
DEMO_MODE=1 ATTEST_OFFLINE=1 npm run dev
# http://localhost:3000  and  http://localhost:3000/verify/
```

# Pilot kit (30 minutes)

```bash
git checkout product-ready && npm install
DEMO_MODE=1 ATTEST_OFFLINE=1 npm run dev
node scripts/demo-sign-verify.mjs
node scripts/verify-bundle.mjs tmp-demo/sample.esatt.json
node scripts/report-integrity.mjs tmp-demo/sample.esatt.json --out tmp-report
# open tmp-report/report.html and tmp-report/qr.svg
```

| Say | Don't say |
| --- | --- |
| Integrity since signing | Detects deepfakes |
| Optional TSA/OTS | Court-admissible seal |
| Org key = authorship control | Proves human spoke |

# EchoSign Attest · v1.0.0-rc.1

**Cryptographic audio integrity and provenance** — not a deepfake detector.

```text
ingest → Ed25519 sign (canonical manifest) → proof package → offline verify
         └─ optional RFC 3161 TSA / OpenTimestamps
         └─ append-only Merkle transparency log
```

| | |
| --- | --- |
| **Proves** | Integrity of bytes after signing · existence in time (TSA/OTS) · control of signing key · internal chain-of-custody |
| **Does not prove** | Human vs AI · deepfake detection · courtroom certification · GOST/ISO 17025/SOC 2 |

Branch: [`product-ready`](https://github.com/ppiiyo/EchoSign-Trust-Protocol/tree/product-ready) · Tag: `v1.0.0-rc.1`  
Docs: [Threat model](docs/THREAT_MODEL.md) · [API](docs/API.md) · [Storage](docs/STORAGE.md) · [Verify](docs/VERIFY.md) · [Pilot kit](docs/PILOT_KIT.md) · [Changelog](CHANGELOG.md)

## Quick start

```bash
git clone https://github.com/ppiiyo/EchoSign-Trust-Protocol.git
cd EchoSign-Trust-Protocol && git checkout product-ready
cp .env.example .env && npm install

node scripts/demo-sign-verify.mjs
node scripts/verify-bundle.mjs tmp-demo/sample.esatt.json
node scripts/report-integrity.mjs tmp-demo/sample.esatt.json --out tmp-report
# → tmp-report/qr.svg (real QR)

DEMO_MODE=1 ATTEST_OFFLINE=1 npm run dev
# http://localhost:3000  ·  /verify/
```

Production refuses start if `NODE_ENV=production` + `DEMO_MODE=1`, or missing `KMS_MASTER_KEY`.

## Verification levels

| Level | Checked |
| --- | --- |
| 1 | Ed25519 over canonical manifest |
| 2 | + structural TSA imprint |
| 3 | + OTS proof (`pending-calendar` until `ots verify`) |
| 4 | + Merkle inclusion vs published root |

## License

MIT. **Release candidate** — final v1.0.0 needs external demos, legal claim review, basic pentest.

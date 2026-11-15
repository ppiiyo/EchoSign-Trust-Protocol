# EchoSign Attest · v1.0.0-rc.2

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

Branch: [`release/v1.0.0`](https://github.com/ppiiyo/EchoSign-Trust-Protocol/tree/release/v1.0.0) · Tag: `v1.0.0-rc.2`  
Docs: [ADMIN](docs/ADMIN.md) · [Deployment](docs/DEPLOYMENT.md) · [Threat model](docs/THREAT_MODEL.md) · [API](docs/API.md) · [Pilot kit](docs/PILOT_KIT.md) · [Changelog](CHANGELOG.md)

## Live demo

Try the hosted pilot (limited demo — ephemeral keys, no TSA/OTS, no Merkle log):

| | |
| --- | --- |
| **App (sign)** | https://echosign-attest.vercel.app |
| **Offline verify** | https://echosign-attest.vercel.app/verify/ |
| **Health** | https://echosign-attest.vercel.app/health |

Local full stack: `DEMO_MODE=1 ATTEST_OFFLINE=1 npm run dev` → http://localhost:3000 and http://localhost:3000/verify/

## Quick start

```bash
git clone https://github.com/ppiiyo/EchoSign-Trust-Protocol.git
cd EchoSign-Trust-Protocol && git checkout release/v1.0.0
cp .env.example .env && npm install

node scripts/demo-sign-verify.mjs
node scripts/verify-bundle.mjs tmp-demo/sample.esatt.json

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

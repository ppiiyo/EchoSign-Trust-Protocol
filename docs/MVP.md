# EchoSign Attest — Full MVP (v0.3)

## In scope

Cryptographic capture → sign → store → verify (online + offline), API keys, devices, honest UX, CI.

## Out of scope

Calibrated deepfake detection, real SIP, compliance certifications, multi-region HA.

## Acceptance

- [x] Ed25519 Manifest v1 sign/verify
- [x] Offline verify (Node + browser /verify/)
- [x] Org key at-rest with KMS_MASTER_KEY
- [x] API keys + scopes
- [x] Device registry
- [x] Proof packages + .esatt.json bundle
- [x] JWKS
- [x] Honest health/footer/threat model
- [x] CI tests
- [ ] Postgres/S3 (file store is MVP default)
- [ ] Live mic capture SDK
- [ ] Daily Merkle + OTS job

## Run

```bash
cp .env.example .env   # DEMO_MODE=1
npm install && npm test && npm run dev
```

```bash
curl -s -X POST localhost:3000/api/v1/keys -H 'Content-Type: application/json' -d '{"name":"pilot"}'
curl -s -F file=@rec.wav localhost:3000/api/v1/attest/sign
```

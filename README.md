# EchoSign Attest (MVP v0.3)

> **Concept product for audio integrity / provenance.** Not a certified deepfake detector.

Cryptographic path: **capture → Ed25519 sign → store proof package → offline verify**.

[Threat model](docs/THREAT_MODEL.md) · [API](docs/API.md) · [MVP scope](docs/MVP.md)

## Quick start (team)

```bash
git clone https://github.com/ppiiyo/EchoSign-Trust-Protocol.git
cd EchoSign-Trust-Protocol
cp .env.example .env          # DEMO_MODE=1
npm install

# Pure crypto (no server)
node scripts/selftest-store.mjs
node scripts/demo-sign-verify.mjs

# Unit tests
npm test

# Run API + UI
npm run dev
# → http://localhost:3000
# → http://localhost:3000/verify/

# API smoke (second terminal)
node scripts/smoke-mvp.mjs
```

Or: `make mvp` then `make dev` / `make smoke`.

## What works today

| Feature | Path |
| --- | --- |
| Ed25519 sign/verify | `server/services/attest.ts`, `packages/attest-crypto` |
| API keys + devices + packages | `server/mvp-routes.ts`, `server/services/store.ts` |
| Offline browser verify | `/verify/` |
| CLI verify | `scripts/verify-independent.mjs` |
| Honest claims | README, footer, health, threat model |

## API sketch

```bash
curl -s -X POST localhost:3000/api/v1/keys -H 'Content-Type: application/json' -d '{"name":"dev"}'
curl -s -F file=@rec.wav localhost:3000/api/v1/attest/sign
curl -s localhost:3000/api/v1/attest/jwks
```

## License

MIT

# Product-ready checklist (v0.2)

## What is product-ready now

| Capability | Status |
| :--- | :--- |
| Ed25519 sign / verify (API + offline) | **Yes** |
| Manifest v1 + independent verifier | **Yes** |
| Encrypted org key (KMS_MASTER_KEY) | **Yes** |
| Offline browser verifier `/verify/` | **Yes** |
| Honest claims / threat model | **Yes** |
| CI: lint + unit tests + build | **Yes** |
| Deepfake detector (calibrated) | **No** — demo heuristics only |
| Real telephony / SOC / compliance certs | **No** — simulated UI |
| RFC 3161 / OTS production hardening | **Partial** — clients exist |
| Multi-tenant + Postgres + S3 | **Not yet** (E4) |

## API (Attest)

```bash
# Sign audio → manifest + signature
curl -s -F file=@recording.wav http://localhost:3000/api/v1/attest/sign | jq .

# Verify
curl -s -X POST http://localhost:3000/api/v1/attest/verify \
  -H 'Content-Type: application/json' \
  -d @verify-body.json

# Public keys
curl -s http://localhost:3000/api/v1/attest/jwks | jq .

# Health
curl -s http://localhost:3000/health | jq .
```

Offline (no server):

```bash
node scripts/demo-sign-verify.mjs
node scripts/verify-independent.mjs tmp-demo/manifest.json tmp-demo/signature.b64u tmp-demo/public.pem
# Browser: open /verify/ and drop the three files
```

## Run

```bash
cp .env.example .env   # DEMO_MODE=1 for local
npm install
npm test
npm run dev
```

Production-ish:

```bash
export KMS_MASTER_KEY=$(openssl rand -hex 32)
export DEMO_MODE=0
export NODE_ENV=production
npm run build && npm start
```

## Next toward full B MVP (M2–M3)

1. Postgres + object storage for recordings (E4)
2. Device registration + API keys with scopes (E4-4)
3. Capture SDK (Web) producing `.esatt` bundles (E2)
4. Daily Merkle root + OTS publish (E3-3/E3-4)
5. Pilot kit + 3 customer demos (E9 / M2 gate)

# EchoSign Attest API · v1.0.0-rc.1

Contract: `openapi/openapi-v1.yaml` · `GET /api/v1/openapi.json`

Auth: Bearer API key · open only if `DEMO_MODE=1`.

| Method | Path |
| --- | --- |
| POST | `/api/v1/keys` |
| POST | `/api/v1/attest/sign` |
| POST | `/api/v1/attest/verify` |
| GET | `/api/v1/attest/packages/:id/bundle` |
| GET | `/api/v1/log/root` |
| GET | `/api/v1/log/proof/:index` |
| GET | `/health` |

Sign returns `manifest`, `signatureB64u`, `timeAttestation`, `log` (inclusion proof), honest disclaimer.

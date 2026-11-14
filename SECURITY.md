# Security Policy & Known Limitations

## Reporting

Report cryptographic or server vulnerabilities via private security advisory.

## Known limitations (honest)

| Area | Limitation |
| --- | --- |
| **Master key** | Without `KMS_MASTER_KEY` keys are demo-ephemeral. Production refuses to start without it. |
| **Browser / file upload** | No TEE. Signature binds bytes as presented, not "human spoke". |
| **TSA / OTS** | Offline mode is server-clock-only. Full verify needs openssl / ots CLI. |
| **Transparency log** | File or single-node Postgres — not distributed consensus. |
| **DEMO_MODE** | Open auth. Forbidden with `NODE_ENV=production`. |
| **Legacy code** | Unused watermark / mock-blockchain types may remain; not on Attest product path. |

## In scope

Keystore, API auth, SSRF allowlists, rate limits, honest claim surfaces.

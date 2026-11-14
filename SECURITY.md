# Security Policy & Known Limitations

## Reporting

If you discover a vulnerability in the cryptographic or server components, please open a private security advisory or contact the maintainers. Do not file public issues for exploitable flaws until coordinated disclosure.

## Known limitations (honest list)

| Area | Limitation |
| :--- | :--- |
| **Master key** | Without `KMS_MASTER_KEY` the process uses an ephemeral key (demo only). Data does not survive restarts. |
| **Browser capture** | No TEE. Synthetic audio can be injected before signing. Treat browser-origin signatures as "presented to the service", not "human spoke". |
| **Watermark** | Experimental. Not robust to common codecs or re-encoding. Labelled as such in the UI. |
| **In-memory ledger** | The demo "blockchain" resets on process restart. Not a real transparency log. |
| **Telephony / SOC UIs** | Simulated. No real SIP/RTP proxy or live threat feed. |
| **Default secrets** | Production builds refuse to start without an explicit `KMS_MASTER_KEY`. |
| **Dependencies** | Run `npm audit` regularly. High/critical findings block CI once the gate is enabled. |

## What is in scope for hardening (scenario B)

- Ed25519 key generation, storage, rotation and revocation
- SSRF protection on outbound webhooks
- Rate limiting and body-size limits
- Append-only Merkle log with inclusion/consistency proofs
- Independent offline verification of proof bundles

See also: [Threat Model](docs/THREAT_MODEL.md).

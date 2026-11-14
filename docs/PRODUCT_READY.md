# Product-ready · v1.0.0-rc.1

| Claim | Evidence |
| --- | --- |
| Ed25519 integrity | attest-crypto, verify-bundle, /verify/ |
| Loud-fail keystore | EncryptedKeystore selftest |
| Honest TSA/OTS | attachTimeAttestation |
| Merkle log | transparency-log + API |
| File/Postgres | persistence, migrations, compose |
| Security guards | assertSafeRuntime, rate limit |
| Report + real QR | report-integrity → qr.svg |
| Docs EN/RU/ZH | README*.md aligned claims |

Manual gates before final v1.0.0: 3 external demos · legal claim review · basic pentest.

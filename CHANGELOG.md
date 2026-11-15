# Changelog

## [1.0.0-rc.2] — 2026-11-15

### Added / hardened (WP-1…WP-9 on `release/v1.0.0`)
- Unified fingerprint: SHA-256(raw 32-byte Ed25519).hex[:16]
- Limited Vercel demo path (no fake API keys; honest limitations banner)
- PG: package + log leaf in one transaction; file log file-lock
- TSA structural gate + nonce; openssl/ots CLI verify paths; signed daily root
- JWKS includes revoked/rotated; verify respects revokedAt vs signingTime
- Security: CORS allowlist, prod CSP without script unsafe-inline, SSRF helpers
- Offline verifier L1–L4 honesty; server integrity reports
- CI: strict selftests (no soft-gate), random KMS for build, audit critical
- Ops: `/healthz`, `/metrics`, request-id JSON logs, backup/restore, ADMIN.md

### Removed
- Dead `server/services/hashing.ts`
- Unused dependency `@google/genai`

### Claims (unchanged, honest)
Proves integrity of signed audio bytes / manifest; optional time attestation and log inclusion; key control.
**Does not** prove human vs AI, deepfake detection, or legal/lab certification.

## [1.0.0-rc.1] — 2026-11-14

### Added
- Ed25519 attest sign/verify (`packages/attest-crypto`)
- Encrypted keystore with loud-fail decrypt
- TSA (RFC 3161) + OpenTimestamps honest status model
- Merkle transparency log
- File / Postgres stores
- OpenAPI 3.1, security runtime guards
- CLI verify/report + browser `/verify/`

## [0.5.0] — WP-5/6
- Postgres schema, docker-compose, security runtime guards

## [0.4.0] — WP-1–4
- Attest product path, Merkle log, time attestation

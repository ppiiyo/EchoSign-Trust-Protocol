# EchoSign Threat Model & Claims Boundary

**Status:** Public · v1.0.0-rc.1 · Updated 2026-11-14

## 1. Claims

| Property | Strength |
| --- | --- |
| Integrity (contentHash + Ed25519) | Strong |
| Existence at time T (TSA / OTS / server clock) | Strong with TSA/OTS; weak server-clock-only |
| Authorship = key control | Strong if key hygiene holds |
| Internal chain-of-custody (Merkle log) | Medium (host integrity) |

## 2. Non-claims

Deepfake / human-vs-AI detection; codec watermarks; SIP product path; GOST/ISO 17025/ISO 27001/SOC 2; court seal without independent process.

## 3. Verification levels 1–4

1. Ed25519(canonical manifest) — `/verify/`, `verify-bundle.mjs`
2. + TSA structural imprint — full PKI via `openssl ts -verify`
3. + OTS proof present — `bitcoin-confirmed` only after external `ots verify`
4. + Merkle inclusion vs **published** root — `/api/v1/log/proof/:i`

## 4. Trust boundaries

Org key + KMS_MASTER_KEY; allowlisted TSA/OTS hosts; published log roots out-of-band; DEMO_MODE is not production.

## 5. In-scope threats

Post-sign tamper; forged package; swapped TSA token; rewritten log without published root; SSRF to private ranges.

## 6. Out of scope (RC)

Compromise of public TSA/OTS; physical key extraction; social engineering; ML content authenticity.

# EchoSign Threat Model & Claims Boundary

**Status:** Public document (E1-1)  
**Audience:** Integrators, security reviewers, prospective pilot customers  
**Last updated:** 2026-11-14

---

## 1. What we claim to prove

EchoSign (Attest path) is designed to provide **cryptographic evidence of**:

| Property | Meaning | Strength |
| :--- | :--- | :--- |
| **Integrity** | The audio bytes have not been modified after the moment of signing | Strong (Ed25519 + content hash) |
| **Existence at time T** | A particular content hash was known to the system (or a public TSA / OpenTimestamps calendar) at or before time T | Strong when TSA / OTS is used; weaker with only server clock |
| **Authorship / key control** | The signature was produced by a private key that was under the control of a registered device or organisation at signing time | Strong if key hygiene and device registration are correct |
| **Chain of custody (system-internal)** | Who/what touched the record inside *this* system after ingest (audit log) | Medium \u2013 depends on server integrity |

These properties are **tamper-evident** and can be verified offline by a third party who possesses only the public keys and the proof bundle.

---

## 2. What we explicitly do **not** claim

| Non-claim | Why |
| :--- | :--- |
| "This is a living human, not AI" | Browser / microphone capture has no TEE. A sophisticated adversary can feed synthetic audio into the capture pipeline. Server-side telephony ingest is stronger but still not a human-liveness oracle. |
| Court-admissible expertise / \u0413\u041e\u0421\u0422 / ISO 17025 / SOC 2 certification | No formal certification exists. Marketing language has been removed from the demo UI. |
| Codec-robust watermarking | Current watermark is experimental and labelled as such. |
| Real-time SIP/RTP deepfake interception | Telephony UI is a simulation in the current codebase. |
| Perfect detection of all deepfakes | Any heuristic score is uncalibrated. |

---

## 3. Trust boundaries

Capture environment (browser / softphone / ATC) \u2192 Signing service (Ed25519 + TSA/OTS + Merkle log) \u2192 Independent verifier (offline).

**Stronger path:** server-side ingest from PBX.  
**Weaker path:** browser SDK \u2014 attests only that the exact byte sequence was presented to the signing service at time T.

---

## 4. Key threats & mitigations (MVP)

| Threat | Mitigation |
| :--- | :--- |
| Compromise of device private key | Short-lived keys, CRL-lite, org root rotation |
| Server clock manipulation | RFC 3161 TSA + OpenTimestamps; surface all three timestamps |
| SSRF via webhooks | Private-IP block + allowlist |
| Expectation mismatch (signed \u21d2 human) | This document + honest wording in every report |

---

## 5. Verification levels

1. Offline signature + hash check
2. TSA / OpenTimestamps validation
3. Merkle inclusion + consistency proof
4. Key status (not revoked at claimed time)

Anything beyond these (liveness, speaker identity) is outside the cryptographic guarantee.

See full local copy in the repository for complete tables and architecture diagram notes.

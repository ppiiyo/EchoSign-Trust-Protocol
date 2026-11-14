# EchoSign Voice Inspector & Trust Protocol (Concept Demo)

> **⚠️ Interactive concept demo (AI Studio / local). This is NOT a certified product.**  
> Many UI modules (telephony, SOC, blockchain anchoring, compliance certificates, SIP/RTP gateway) are **simulations**.  
> See the [Real vs Simulated](#real-vs-simulated) table below and the public [Threat Model](docs/THREAT_MODEL.md).  
> Do not use for production, legal, or forensic decisions.

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20.0.0](https://img.shields.io/badge/Node->=20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React: 19.x](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript: ~5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Status: Concept Demo](https://img.shields.io/badge/Status-Concept%20Demo-orange.svg)]()

**Audio integrity & liveness exploration toolkit — concept demo with real DSP heuristics and simulated enterprise modules.**

[English](README.md) • [\u0420\u0443\u0441\u0441\u043a\u0438\u0439](README.ru.md) • [\u4e2d\u6587](README.zh.md)

</div>

---

## Attest path (scenario B) — in progress

Cryptographic proof that an audio recording existed, unaltered, under a controlled key, at a specific time — verifiable offline.

| Package / path | Status |
| :--- | :--- |
| `packages/attest-crypto` | Ed25519 sign/verify, Manifest v1, EncryptedKeystore |
| `docs/THREAT_MODEL.md` | Public claims boundary |
| `scripts/verify-independent.mjs` | Pure-Node offline verifier |

```bash
git clone https://github.com/ppiiyo/EchoSign-Trust-Protocol.git
cd EchoSign-Trust-Protocol
npm install
cp .env.example .env   # set DEMO_MODE=1 for local demo
npm run dev
```

### Real vs Simulated

| Module | Status | Notes |
| :--- | :--- | :--- |
| Liveness / DSP heuristics | **Real (heuristic)** | Local signal features; not a calibrated detector. |
| Watermark embed/extract | **Experimental** | Not codec-robust; demo only. |
| In-browser mic capture & WAV path | **Real** | Web Audio API. |
| PDF / integrity report UI | **Real UI, demo content** | Explicitly marked non-expert. |
| Blockchain / Polygon / Merkle UI | **Simulated** | In-memory, resets on restart. |
| Telephony / SIP/RTP gateway | **Simulated** | UI only. |
| SOC dashboard | **Simulated** | Demo data. |
| Browser extension hub | **Concept** | No real MV3 extension shipped. |
| Compliance matrix & certificates | **Simulated** | No real certifications. |
| Transcription (Whisper-style) | **Simulated / template** | Filename-based or template fallbacks. |
| **Attest crypto (Ed25519 + keystore)** | **Real** | `packages/attest-crypto` |

---

## Getting Started

### Prerequisites
- Node.js `v20.0.0` or higher

### Local Setup

```bash
git clone https://github.com/ppiiyo/EchoSign-Trust-Protocol.git
cd EchoSign-Trust-Protocol
npm install
cp .env.example .env
# Optional: openssl rand -hex 32  -> set as KMS_MASTER_KEY
npm run dev
```

Open `http://localhost:3000`.

### Tests

```bash
npm test                  # merkle + attest-crypto unit tests
npm run test:crypto       # only packages/attest-crypto
npm run lint              # tsc --noEmit
```

### Independent signature check

```bash
node scripts/verify-independent.mjs manifest.json signature.b64u public.pem
```

---

## Security

See [SECURITY.md](SECURITY.md) and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).

**KMS:** Production refuses to start without `KMS_MASTER_KEY`. For local demos set `DEMO_MODE=1` (ephemeral key).

---

## License

MIT — see [LICENSE](LICENSE).

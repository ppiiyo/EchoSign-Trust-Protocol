# EchoSign Voice Inspector & Trust Protocol

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=18.0.0](https://img.shields.io/badge/Node->=18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React: 19.x](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript: ~5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Gemini: 3.7 Flash](https://img.shields.io/badge/AI-Gemini%203.7%20Flash-orange.svg)](https://ai.google.dev/)

**Enterprise-grade Audio Authenticity Verification, Voice Liveness Detection, Neural Deepfake Defense, and Cryptographic Audio Watermarking.**

[English](README.md) • [Русский](README.ru.md) • [中文](README.zh.md)

</div>

---

## 📖 Table of Contents

- [1. What is EchoSign?](#-1-what-is-echosign)
- [2. Key Problems Solved](#-2-key-problems-solved)
- [3. Core Features & Capabilities](#-3-core-features--capabilities)
- [4. Who Needs This Project?](#-4-who-needs-this-project)
- [5. System Architecture](#-5-system-architecture)
- [6. Getting Started & Installation](#-6-getting-started--installation)
- [7. API Reference](#-7-api-reference)
- [8. Security & Cryptographic Guarantees](#-8-security--cryptographic-guarantees)
- [9. Tech Stack](#-9-tech-stack)

---

## 🎯 1. What is EchoSign?

**EchoSign Voice Inspector** is an end-to-end security system designed to verify the authenticity of human speech, detect AI-generated voice clones (Deepfakes / TTS), protect audio assets with psychoacoustic watermarks, and record verifiable proof of custody on an immutable ledger.

As generative AI models (like ElevenLabs, VITS, HiFi-GAN, DiffSinger) become indistinguishable to human ears, traditional audio inspection is no longer enough. EchoSign combines **digital signal processing (DSP)**, **biometric vocal tract physics**, **AI acoustic diagnostics**, and **cryptographic watermarking** into a fast, single-click web application.

---

## ⚡ 2. Key Problems Solved

| Problem | Threat Scenario | EchoSign Solution |
| :--- | :--- | :--- |
| **Voice Cloning & Vishing** | Attackers clone an executive's or relative's voice to authorize emergency wire transfers or reset credentials. | **Biometric Liveness Detection**: Analyzes pitch micro-jitter, amplitude shimmer, harmonic-to-noise ratio (HNR), and neural vocoder artifacts. |
| **Tampered Forensic Audio** | Leaked phone calls or courtroom audio altered with splice/in-painting tools. | **Dual-Domain Watermarking & Merkle Ledger**: Cryptographically binds the audio to a tamper-evident hash and timestamp. |
| **Copyright Theft & Voice Scraping** | Voice actors' and musicians' recordings scraped without permission for AI training. | **Imperceptible Psychoacoustic DSSS+QIM**: Embeds high-robustness metadata (1.8–4.6 kHz) that survives MP3/AAC compression and G.711 telephony filtering. |
| **False Positives on Studio Vocals** | Auto-Tuned or processed real vocals flagged as fake by naive detectors. | **Hybrid 4-Vector Ensemble**: Evaluates chromatic scale quantization vs. vocoder phase noise to correctly identify genuine tuned human vocals. |

---

## 🚀 3. Core Features & Capabilities

### 🔍 1. Real-Time Voice Verification & Deepfake Detection
- **Instant Verdict**: Evaluates audio as **Genuine Human Voice**, **AI Synthetic / Deepfake**, or **Suspicious / Processed**.
- **Biometric Vocal Tract Metrics**:
  - **Fundamental Frequency ($F_0$) Tracking**: Detects pitch trajectories and natural micro-fluctuations.
  - **Jitter (%) & Shimmer (%)**: Measures cycle-to-cycle perturbation of human vocal cords.
  - **Harmonics-to-Noise Ratio (HNR in dB)**: Distinguishes natural glottal airflow from synthetic noise floors.
  - **Phase Continuity & Vocoder Grid Inspection**: Identifies neural vocoder comb-filter artifacts.
- **In-Browser Recording**: Directly capture voice from the microphone or drag-and-drop WAV, MP3, M4A, FLAC files.
- **Pre-loaded Test Presets**: Test human speech, AI deepfakes, and studio music with a single click.

### 🔐 2. Cryptographic Audio Watermarking
- **Psychoacoustic Masking (ITU-R BS.1387)**: Modulates watermarks in the 1.8–4.6 kHz band where human hearing is masked by loud fundamentals, achieving $SNR > 40\text{ dB}$ (inaudible to listeners).
- **Direct-Sequence Spread Spectrum (DSSS) + QIM**: High-durability signal embedding with Barker/Gold sync codes.
- **HMAC-SHA256 Signed Payload**: Prevents watermark forgery and replay attacks.
- **Telephony & Codec Survival**: Resists G.711 high-pass filtering (300 Hz cutoff) and lossy compression.

### ⛓️ 3. Immutable Provenance Ledger
- **Binary Merkle Tree**: Enables $O(\log N)$ cryptographic inclusion proofs without exposing the entire database.
- **SHA-256 Content Addressing**: Audio files are hashed to ensure bit-level integrity.
- **Polygon L2 Rollup State Anchoring**: Periodic notarization of the state root with sequencer signatures.

### 🧠 4. AI-Powered Forensic Diagnosis (Gemini 3.7)
- Generates natural-language forensic analysis explaining vocal tract biomechanics, acoustic phase markers, and legal recommendations for courtroom or compliance usage.
- Includes automatic fallback to deterministic physical diagnosis during network or API spikes.

---

## 👥 4. Who Needs This Project?

1. **Banking & FinTech Security Teams**: Prevent voice authorization fraud (call center vishing, CEO impersonation).
2. **Legal & Forensic Laboratories**: Validate evidence integrity and generate tamper-proof chain of custody reports.
3. **Journalists & Fact-Checking Agencies**: Quickly verify leaked audio tapes, political speeches, and viral voice messages.
4. **Voice Actors, Musicians & Studios**: Protect voice models and recordings from unauthorized AI dataset scraping.
5. **Corporate Compliance & SOC Operators**: Automated audio pipeline verification for customer support centers.

---

## 🏗️ 5. System Architecture

```
                      ┌─────────────────────────────────┐
                      │    Web Client (React 19 + TS)   │
                      │  • Microphone Audio Capture     │
                      │  • Waveform Visualizer          │
                      │  • Verification & Watermarking  │
                      └────────────────┬────────────────┘
                                       │ HTTP / Multipart
                                       ▼
                      ┌─────────────────────────────────┐
                      │     Express API Server (Node)   │
                      │  • Non-blocking Worker Queue    │
                      │  • Hierarchical KMS Engine      │
                      └───────┬─────────────────┬───────┘
                              │                 │
              ┌───────────────┴────┐       ┌────┴────────────────┐
              ▼                    ▼       ▼                     ▼
     ┌────────────────┐  ┌───────────────┐ ┌───────────────┐ ┌────────────────┐
     │  DSP Liveness  │  │ Watermark QIM │ │  Merkle Chain │ │ Gemini 3.7 AI  │
     │  • Jitter/Shim │  │ • DSSS/Barker │ │ • O(log N)    │ │ • Forensic     │
     │  • Vocoder FFT │  │ • BS.1387 Mask│ │ • L2 Anchor   │ │   Reports      │
     └────────────────┘  └───────────────┘ └───────────────┘ └────────────────┘
```

---

## 💻 6. Getting Started & Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **bun** / **yarn** / **pnpm**
- *(Optional)* A Google Gemini API Key for AI forensic summaries (the system includes full offline deterministic fallbacks).

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/echosign-voice-inspector.git
   cd echosign-voice-inspector
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` (optional):
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   KMS_MASTER_KEY=your_secure_master_key_32_bytes_minimum
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 📡 7. API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/verify` | `POST` (multipart) | Performs full acoustic Liveness, deepfake detection, watermark extraction, and ledger lookup. |
| `/api/v1/watermark/embed` | `POST` (multipart) | Embeds a signed psychoacoustic watermark into an audio file and records provenance in the ledger. |
| `/api/v1/blockchain/blocks` | `GET` | Fetches the full chain of verified records with Merkle roots. |
| `/api/v1/blockchain/merkle-proof/:txId` | `GET` | Returns an $O(\log N)$ Merkle inclusion proof for a specific transaction. |
| `/api/v1/blockchain/l2-anchor` | `GET` | Retrieves the latest Polygon L2 state anchor notarization. |
| `/api/v1/kms/status` | `GET` | Returns the active KMS key ring status and current key epoch. |

---

## 🔒 8. Security & Cryptographic Guarantees

- **Audio Steganography**: Uses ITU-R BS.1387 psychoacoustic masking to ensure zero perceptual loss ($SNR > 40\text{ dB}$).
- **Tamper Evidence**: Cryptographic signatures use HMAC-SHA256 derived from domain-separated keys (PBKDF2/HKDF).
- **Key Rotation**: Built-in Key Management Service (KMS) supports zero-downtime epoch key rotation with backward verification.
- **Proof-of-Custody**: Merkle trees ensure no block or transaction can be altered retroactively without invalidating the Merkle Root.

---

## 🛠️ 9. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Lucide Icons, Motion.
- **Audio Processing**: Web Audio API, Canvas Spectrograms, Fast Fourier Transform (FFT), Discrete Cosine Transform (DCT).
- **Backend**: Node.js, Express, Multer, Crypto, tsx, esbuild.
- **AI Diagnostics**: Google Gen AI SDK (`@google/genai` with `gemini-3.7-flash`).

---

<div align="center">
  <sub>Developed for enterprise-grade audio provenance and deepfake resilience.</sub>
</div>

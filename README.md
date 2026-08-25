# EchoSign Voice Inspector & Trust Protocol v4.1

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20.0.0](https://img.shields.io/badge/Node->=20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React: 19.x](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript: ~5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Docker: Ready](https://img.shields.io/badge/Docker-Multi--Stage-2496ED.svg)](https://www.docker.com/)
[![CI/CD: GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)](https://github.com/features/actions)
[![Gemini: 3.7 Flash](https://img.shields.io/badge/AI-Gemini%203.7%20Flash-orange.svg)](https://ai.google.dev/)

**Enterprise-grade Audio Authenticity Verification, Voice Liveness Biometrics, Splicing Diarization, Real-time SIP/RTP Telephony Gateway, SOC Anti-Vishing Dashboard, and Cryptographic Watermarking.**

[English](README.md) • [Русский](README.ru.md) • [中文](README.zh.md)

</div>

---

## 📖 Table of Contents

- [1. What is EchoSign?](#-1-what-is-echosign)
- [2. Key Problems Solved](#-2-key-problems-solved)
- [3. Complete Feature Matrix (v4.1)](#-3-complete-feature-matrix-v41)
  - [🔍 Core Verification & Biometrics](#-core-verification--biometrics)
  - [📄 Forensic PDF Export & Chain of Custody](#-forensic-pdf-export--chain-of-custody)
  - [👥 Speaker Diarization & Splicing Timeline](#-speaker-diarization--splicing-timeline)
  - [🔑 Developer Portal & API Management](#-developer-portal--api-management)
  - [📞 REST API v2 & Webhooks Subsystem](#-rest-api-v2--webhooks-subsystem)
  - [🧩 Browser Extension Hub (Meet/Telegram/WhatsApp)](#-browser-extension-hub-meettelegramwhatsapp)
  - [📊 SOC Cyber Defense Dashboard](#-soc-cyber-defense-dashboard)
  - [🎙️ Real-Time SIP/RTP Telephony Gateway](#️-real-time-siprtp-telephony-gateway)
  - [📦 On-Premise & Air-Gapped Deployment (Docker / K8s)](#-on-premise--air-gapped-deployment-docker--k8s)
  - [🛡️ Regulatory Compliance (ГОСТ Р 52633, ISO 27001, SOC 2)](#️-regulatory-compliance-гост-р-52633-iso-27001-soc-2)
- [4. System Architecture](#-4-system-architecture)
- [5. Getting Started & Installation](#-5-getting-started--installation)
- [6. Docker & Container Deployment](#-6-docker--container-deployment)
- [7. CI/CD Workflows & Automation](#-7-cicd-workflows--automation)
- [8. API Reference](#-8-api-reference)
- [9. Tech Stack](#-9-tech-stack)

---

## 🎯 1. What is EchoSign?

**EchoSign Voice Inspector** is an end-to-end cybersecurity and acoustic forensics platform designed to verify the authenticity of human speech, detect AI-generated voice clones (Deepfakes / TTS / Voice Changers), protect voice assets with psychoacoustic watermarks, and intercept real-time vishing attacks over telephony streams (SIP/RTP).

As generative AI speech engines (ElevenLabs, XTTS-v2, VITS, HiFi-GAN, DiffSinger) surpass human perceptual discrimination, EchoSign combines **digital signal processing (DSP)**, **biometric vocal tract physics**, **real-time telephony proxying**, **AI acoustic diagnostics**, and **cryptographic watermarking** into a unified, high-performance platform.

---

## ⚡ 2. Key Problems Solved

| Threat Scenario | Attack Vector | EchoSign Solution |
| :--- | :--- | :--- |
| **C-Suite & CEO Impersonation** | Fraudsters clone executive voices during phone calls to order emergency banking transfers. | **Real-Time SIP Gateway & SOC Dashboard**: Intercepts telephony streams in under 200 ms with automated call quarantine. |
| **Tampered Forensic Audio** | Leaked phone calls or courtroom evidence altered with splice/in-painting tools. | **Diarization & Phase Discontinuity Timeline**: Pinpoints exact millisecond splicing boundaries and phase jumps. |
| **Voice Scraping & Model Theft** | Voice actors' and musicians' audio scraped without permission for neural model training. | **Imperceptible Psychoacoustic DSSS+QIM**: Embeds high-robustness metadata (1.8–4.6 kHz) that survives compression & telephony. |
| **False Positives on Studio Vocals** | Auto-Tuned or processed real vocals flagged as fake by naive detectors. | **Hybrid 4-Vector Ensemble**: Evaluates chromatic scale quantization vs. vocoder phase noise to correctly verify genuine tuned voices. |

---

## 🚀 3. Complete Feature Matrix (v4.1)

### 🔍 Core Verification & Biometrics
- **Multi-Vector Detection**: Evaluates vocal tract physics, vocoder grid artifacts, phase continuity, and harmonic-to-noise ratio.
- **Biometric Indicators**: Tracks Fundamental Frequency ($F_0$), Jitter ($<1.04\%$), Shimmer ($<3.8\%$), and HNR ($>15\text{ dB}$).
- **In-Browser Capture**: Direct microphone recording or instant drag-and-drop of WAV, MP3, M4A, FLAC audio.

### 📄 Forensic PDF Export & Chain of Custody
- Generates official courtroom-ready forensic acoustic reports in a single click.
- Includes digital signature validation, cryptographic SHA-256 hash, calculation tables, and procedural QR code for instant third-party authenticity verification.

### 👥 Speaker Diarization & Splicing Timeline
- Splits conversations by distinct vocal profiles (Speaker A / B / C).
- Identifies synthetic phrase injections, unnatural pauses ($<40\text{ ms}$), and phase discontinuities at splice boundaries.

### 🔑 Developer Portal & API Management
- Self-service generation of Production (`echosign_live_...`) and Sandbox (`echosign_test_...`) API keys.
- Granular permission scopes (`verify:audio`, `watermark:embed`, `telephony:stream`, `soc:admin`) and multi-language code snippets (cURL, Python, Node.js, Go).

### 📞 REST API v2 & Webhooks Subsystem
- Real-time webhook dispatch with HMAC-SHA256 signature validation in `X-EchoSign-Signature`.
- Automated events for `voice.deepfake_detected`, `watermark.extracted`, and `call.spoofing_alert` with retry logic.

### 🧩 Browser Extension Hub (Meet/Telegram/WhatsApp)
- Live interactive simulation inside Google Meet, Telegram Web, WhatsApp Web, and YouTube.
- Downloadable Manifest v3 bundle for seamless enterprise browser deployment.

### 📊 SOC Cyber Defense Dashboard
- Real-time threat feed tracking inbound vishing attempts and call impersonations.
- Target division heatmaps (Executive, Finance, Support), geographical attack vectors, and instant one-click caller quarantine.

### 🎙️ Real-Time SIP/RTP Telephony Gateway
- Integrated proxy compatible with Asterisk, FreePBX, Cisco CUCM, and Avaya.
- Sliding acoustic analysis window (200 ms) across G.711u, Opus HD, and AMR-WB codecs with latency $<200\text{ ms}$.

### 📦 On-Premise & Air-Gapped Deployment (Docker / K8s)
- Production-ready `Dockerfile`, `docker-compose.yml`, and Helm chart generators for isolated sovereign bank enclaves.
- Hardware sizing calculator for CPU/RAM/GPU capacity planning.

### 🛡️ Regulatory Compliance (ГОСТ Р 52633, ISO 27001, SOC 2)
- Interactive audit compliance matrix covering ГОСТ Р 52633.5 (Biometric Defense), ISO/IEC 27001, SOC 2 Type II, and the EU AI Act (High-Risk AI Systems).
- Printable formal Certificate of Compliance.

---

## 🏗️ 4. System Architecture

```
                      ┌─────────────────────────────────┐
                      │    Web Client (React 19 + TS)   │
                      │  • Verification & Diarization   │
                      │  • SOC Dashboard & Telephony    │
                      │  • Developer Portal & Webhooks  │
                      └────────────────┬────────────────┘
                                       │ HTTP / WebSocket / Webhooks
                                       ▼
                      ┌─────────────────────────────────┐
                      │     Express API Server (Node)   │
                      │  • Real-time Sliding Window DSP │
                      │  • HMAC Webhook Dispatcher      │
                      │  • Hierarchical KMS Keyring     │
                      └───────┬─────────────────┬───────┘
                              │                 │
              ┌───────────────┴────┐       ┌────┴────────────────┐
              ▼                    ▼       ▼                     ▼
     ┌────────────────┐  ┌───────────────┐ ┌───────────────┐ ┌────────────────┐
     │  DSP Liveness  │  │ Watermark QIM │ │  Merkle Chain │ │ Gemini 3.7 AI  │
     │  • Jitter/Shim │  │ • DSSS/Barker │ │ • O(log N)    │ │ • Forensic     │
     │  • Vocoder FFT │  │ • BS.1387 Mask│ │ • L2 Anchor   │ │   Diagnosis    │
     └────────────────┘  └───────────────┘ └───────────────┘ └────────────────┘
```

---

## 💻 5. Getting Started & Installation

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm** or **bun** / **yarn** / **pnpm**
- *(Optional)* Google Gemini API Key for AI forensic summaries (full deterministic offline fallbacks included).

### Local Setup

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
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   KMS_MASTER_KEY=your_secure_master_key_32_bytes_minimum
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## 🐳 6. Docker & Container Deployment

### Single-Command Docker Compose

```bash
# Build and start the containerized service
docker compose up -d --build

# View container logs
docker compose logs -f

# Check health status
docker compose ps
```

### Manual Docker Build & Run

```bash
# Build production multi-stage image
docker build -t echosign/voice-inspector:v4.1.0 .

# Run container with non-root security isolation
docker run -d \
  -p 3000:3000 \
  --name echosign-app \
  -e NODE_ENV=production \
  -e KMS_MASTER_KEY=your_production_key \
  echosign/voice-inspector:v4.1.0
```

---

## 🚀 7. CI/CD Workflows & Automation

The repository includes enterprise-grade GitHub Actions CI/CD workflows located in `.github/workflows/`:

- **`.github/workflows/deploy.yml`**:
  1. **🧪 Quality Gate**: Automated TypeScript typechecking (`tsc --noEmit`), linting, build verification, and npm dependency audit.
  2. **🐳 Multi-Arch Docker Build**: Builds and signs `linux/amd64` and `linux/arm64` images, publishing to GitHub Container Registry (`ghcr.io`).
  3. **☁️ Automated Deployment**: Triggers automated deployment to Google Cloud Run or production servers via SSH/Docker Compose with healthcheck verification.
- **`.github/workflows/security.yml`**:
  - Weekly and push-triggered **CodeQL SAST** analysis for JavaScript/TypeScript.
  - Automated **Trivy** vulnerability scanning for container and dependencies.

---

## 📡 8. API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/verify` | `POST` (multipart) | Performs full acoustic Liveness, deepfake detection, watermark extraction, and ledger lookup. |
| `/api/v1/watermark/embed` | `POST` (multipart) | Embeds a signed psychoacoustic watermark into an audio file and records provenance in the ledger. |
| `/api/v1/blockchain/blocks` | `GET` | Fetches the full chain of verified records with Merkle roots. |
| `/api/v1/blockchain/merkle-proof/:txId` | `GET` | Returns an $O(\log N)$ Merkle inclusion proof for a specific transaction. |
| `/api/v1/blockchain/stats` | `GET` | Returns real-time blockchain stats, L2 state anchor status, and block height. |
| `/api/v1/kms/status` | `GET` | Returns active KMS key ring status and current key epoch. |

---

## 🛠️ 9. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Lucide Icons, Motion.
- **Audio Processing**: Web Audio API, Canvas Spectrograms, Fast Fourier Transform (FFT), Discrete Cosine Transform (DCT).
- **Backend & Real-Time**: Node.js, Express, Multer, Crypto, tsx, esbuild, SIP/RTP buffer processor.
- **AI Diagnostics**: Google Gen AI SDK (`@google/genai` with `gemini-3.7-flash`).
- **DevOps & Containers**: Docker (Multi-stage), Docker Compose, GitHub Actions, Kubernetes Helm.

---

<div align="center">
  <sub>Developed for enterprise-grade audio provenance, telecommunication security, and deepfake resilience.</sub>
</div>

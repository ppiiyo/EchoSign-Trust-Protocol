# EchoSign Voice Inspector & Trust Protocol v4.1 (中文版本)

<div align="center">

[![License: MIT](https://img.shields.io/badge/许可证-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20.0.0](https://img.shields.io/badge/Node->=20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React: 19.x](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript: ~5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Docker: Ready](https://img.shields.io/badge/Docker-Multi--Stage-2496ED.svg)](https://www.docker.com/)
[![CI/CD: GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)](https://github.com/features/actions)
[![Gemini: 3.7 Flash](https://img.shields.io/badge/AI-Gemini%203.7%20Flash-orange.svg)](https://ai.google.dev/)

**企业级语音真实性鉴权、声道生物活体检测、实时 SIP/RTP 电话网关、SOC 反电话诈骗大屏及隐形水印溯源平台。**

[English](README.md) • [Русский](README.ru.md) • [中文](README.zh.md)

</div>

---

## 📖 目录

- [1. 什么是 EchoSign？](#-1-什么是-echosign)
- [2. 解决的核心问题](#-2-解决的核心问题)
- [3. 完整功能矩阵 (v4.1)](#-3-完整功能矩阵-v41)
  - [🔍 核心鉴伪与声道生物指标](#-核心鉴伪与声道生物指标)
  - [📄 司法级声学检验报告 (PDF 导出与数字签名)](#-司法级声学检验报告-pdf-导出与数字签名)
  - [👥 说话人日志切分与剪辑拼接时序分析 (Diarization)](#-说话人日志切分与剪辑拼接时序分析-diarization)
  - [🔑 开发者门户与 API 密钥管理](#-开发者门户与-api-密钥管理)
  - [📞 REST API v2 与 Webhooks 实时告警](#-rest-api-v2-与-webhooks-实时告警)
  - [🧩 浏览器安全插件中心 (Meet/Telegram/WhatsApp)](#-浏览器安全插件中心-meettelegramwhatsapp)
  - [📊 SOC 网络安全防御指挥中心](#-soc-网络安全防御指挥中心)
  - [🎙️ 实时 SIP/RTP 电话网关 (Asterisk, Cisco, Avaya)](#️-实时-siprtp-电话网关-asterisk-cisco-avaya)
  - [📦 私有化与隔离区部署 (Docker / K8s)](#-私有化与隔离区部署-docker--k8s)
  - [🛡️ 合规矩阵 (ГОСТ Р 52633, ISO 27001, SOC 2, EU AI Act)](#️-合规矩阵-гост-р-52633-iso-27001-soc-2-eu-ai-act)
- [4. 系统架构](#-4-系统架构)
- [5. 安装与运行指南](#-5-安装与运行指南)
- [6. Docker 与容器化部署](#-6-docker-与容器化部署)
- [7. CI/CD 流水线与自动化部署](#-7-cicd-流水线与自动化部署)
- [8. API 接口文档](#-8-api-接口文档)
- [9. 技术栈](#-9-技术栈)

---

## 🎯 1. 什么是 EchoSign？

**EchoSign Voice Inspector** 是一个端到端的音频安全分析与真实性验证系统，专门用于**检测 AI 生成的合成语音（克隆声音、Deepfake、语音合成 TTS）**、提取**人类喉部生物活体特征（Liveness）**、嵌入**人耳不可感知的心理声学数字水印**，并在电话语音通话（SIP/RTP）中实时拦截仿冒攻击。

---

## ⚡ 2. 解决的核心问题

| 痛点问题 | 攻击场景 / 风险 | EchoSign 解决方案 |
| :--- | :--- | :--- |
| **声音克隆与电话诈骗 (Vishing)** | 攻击者克隆高管或亲属声音进行电话诈骗、紧急转账授权或凭据重置。 | **实时 SIP 网关与 SOC 仪表盘**：200 毫秒滑动窗口分析，毫秒级自动挂断与告警隔离。 |
| **司法录音证据篡改** | 泄露的电话录音或庭审材料被拼接、局部重绘或生成式篡改。 | **说话人切分与相位突变时序**：微秒级定位拼接剪辑点与相位间断点。 |
| **版权窃取与语音资产被爬取** | 配音演员与音乐家的录音未经授权被用于训练商业 AI 语音模型。 | **心理声学 DSSS+QIM 隐形水印**：在 1.8–4.6 kHz 掩蔽频段注入抗压缩水印，耐受 MP3 压缩与电话滤波。 |
| **录音室修音误判 (Auto-Tune)** | 真实人声经修音插件处理后，被简单检测器误报为 AI 伪造。 | **四维度混合判决集成**：区分乐理半音网格量化与声码器伪影，避免修音被误报。 |

---

## 🚀 3. 完整功能矩阵 (v4.1)

### 🔍 核心鉴伪与声道生物指标
- **物理声学多维评估**：基频追踪 ($F_0$)、Jitter 微抖动 ($<1.04\%$)、Shimmer 振幅微扰 ($<3.8\%$)、谐噪比 HNR ($>15\text{ dB}$) 及声码器网格伪影。
- **浏览器直录与上传**：支持麦克风单键录音，以及 WAV、MP3、M4A、FLAC 等文件拖拽分析。

### 📄 司法级声学检验报告 (PDF 导出与数字签名)
- 一键生成法庭级声学司法鉴定报告，包含物理参数计算表、SHA-256 原文哈希及可在线校验的二维码。

### 👥 说话人日志切分与剪辑拼接时序分析 (Diarization)
- 按声学轮廓自动区分说话人 A/B/C，高亮标出疑似合成插入句、异常超短停顿（$<40\text{ ms}$）与相位突变。

### 🔑 开发者门户与 API 密钥管理
- 生产环境 (`echosign_live_...`) 与沙箱环境 (`echosign_test_...`) 密钥管理，权限范围控制及多语言代码示例（cURL, Python, Node.js, Go）。

### 📞 REST API v2 与 Webhooks 实时告警
- 支持带 HMAC-SHA256 签名 (`X-EchoSign-Signature`) 的事件推送（`voice.deepfake_detected`, `call.spoofing_alert`）。

### 🧩 浏览器安全插件中心 (Meet/Telegram/WhatsApp)
- 支持在 Google Meet、Telegram Web、WhatsApp Web 及 YouTube 中实时标注音频真伪，附带 Manifest v3 打包配置。

### 📊 SOC 网络安全防御指挥中心
- 实时仿冒攻击日志流、受攻击部门（高管/财务/客服）热力分布图及一键封禁隔离。

### 🎙️ 实时 SIP/RTP 电话网关 (Asterisk, Cisco, Avaya)
- 适配主流软交换 PBX 系统，200 毫秒滑动窗口声学分析，延迟 $<200\text{ ms}$。

### 📦 私有化与隔离区部署 (Docker / K8s)
- 完整的 `Dockerfile`、`docker-compose.yml` 及 Kubernetes Helm Chart 配置，硬件资源计算器。

### 🛡️ 合规矩阵 (ГОСТ Р 52633, ISO 27001, SOC 2, EU AI Act)
- 覆盖 ГОСТ Р 52633.5 生物特征防伪标准、ISO/IEC 27001、SOC 2 Type II 及欧盟人工智能法案的高风险 AI 规范，支持打印合规证书。

---

## 💻 5. 安装与运行指南

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/echosign-voice-inspector.git
cd echosign-voice-inspector

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env

# 4. 启动开发服务器
npm run dev
```

---

## 🐳 6. Docker 与容器化部署

```bash
# 使用 Docker Compose 一键启动
docker compose up -d --build

# 查看运行日志
docker compose logs -f
```

---

## 🚀 7. CI/CD 流水线与自动化部署

项目在 `.github/workflows/` 中内置了工业级 GitHub Actions 工作流：
- **`deploy.yml`**: TypeScript 类型与代码规范检查、Multi-Arch Docker 镜像构建（`amd64` / `arm64`）并推送至 `ghcr.io`，自动发布至 Cloud Run / 服务器。
- **`security.yml`**: CodeQL SAST 静态代码安全扫描与 Trivy 依赖及容器漏洞分析。

---

<div align="center">
  <sub>专为企业级语音真实性鉴权、电话防诈骗与深度伪造防御打造。</sub>
</div>

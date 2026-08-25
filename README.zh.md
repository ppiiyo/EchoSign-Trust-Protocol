# EchoSign Voice Inspector & Trust Protocol (中文版本)

<div align="center">

[![License: MIT](https://img.shields.io/badge/许可证-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=18.0.0](https://img.shields.io/badge/Node->=18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React: 19.x](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript: ~5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Gemini: 3.7 Flash](https://img.shields.io/badge/AI-Gemini%203.7%20Flash-orange.svg)](https://ai.google.dev/)

**企业级语音真实性鉴权、活体检测、AI 深度伪造（Deepfake/TTS）防御及隐形声学水印溯源平台。**

[English](README.md) • [Русский](README.ru.md) • [中文](README.zh.md)

</div>

---

## 📖 目录

- [1. 什么是 EchoSign？](#-1-什么是-echosign)
- [2. 解决的核心问题](#-2-解决的核心问题)
- [3. 核心功能与能力](#-3-核心功能与能力)
- [4. 适用人群与应用场景](#-4-适用人群与应用场景)
- [5. 系统架构](#-5-系统架构)
- [6. 安装与运行指南](#-6-安装与运行指南)
- [7. API 接口文档](#-7-api-接口文档)
- [8. 安全与密码学保证](#-8-安全与密码学保证)
- [9. 技术栈](#-9-技术栈)

---

## 🎯 1. 什么是 EchoSign？

**EchoSign Voice Inspector** 是一个端到端的音频安全分析与真实性验证系统，专门用于**检测 AI 生成的合成语音（克隆声音、Deepfake、语音合成 TTS）**、提取**人类喉部生物活体特征（Liveness）**、嵌入**人耳不可感知的心理声学数字水印**，并在**不可篡改的区块链账本**上完成溯源公证。

随着现代生成式语音模型（ElevenLabs、VITS、HiFi-GAN、DiffSinger 等）的逼真度超越人耳分辨极限，EchoSign 结合了**数字信号处理（DSP）**、**声道物理声学模型**、**大模型声学司法诊断**与**现代密码学**，提供开箱即用的高精度语音鉴伪工具。

---

## ⚡ 2. 解决的核心问题

| 痛点问题 | 攻击场景 / 风险 | EchoSign 解决方案 |
| :--- | :--- | :--- |
| **声音克隆与电话诈骗 (Vishing)** | 攻击者克隆高管或亲属声音进行电话诈骗、紧急转账授权或凭据重置。 | **生物声学活体检测**：分析基频微抖动（Jitter）、振幅微扰动（Shimmer）、谐噪比（HNR）及神经声码器相位梳状伪影。 |
| **司法录音证据篡改** | 泄露的电话录音或庭审材料被拼接、局部重绘或生成式篡改。 | **双域水印与默克尔树账本**：将文件 SHA-256 哈希及元数据上链，支持 $O(\log N)$ 默克尔包含证明（Inclusion Proof）。 |
| **版权窃取与语音资产被爬取** | 配音演员与音乐家的录音未经授权被用于训练商业 AI 语音模型。 | **心理声学 DSSS+QIM 隐形水印**：在 1.8–4.6 kHz 掩蔽频段注入抗压缩水印，耐受 MP3 压缩与 G.711 电话窄带滤波。 |
| **录音室修音误判 (Auto-Tune)** | 真实人声经修音插件处理后，被简单检测器误报为 AI 伪造。 | **四维度混合判决集成**：区分乐理半音网格量化与扩散模型声码器随机相位噪声，降低误报率。 |

---

## 🚀 3. 核心功能与能力

### 🔍 1. 实时语音鉴权与 Deepfake 检测
- **即时判定结论**：明确标识为 **真实人类语音**、**AI 合成语音 (Deepfake)** 或 **经处理的录音**。
- **物理生物声学指标**：
  - **基频（$F_0$）轨迹追踪**：捕捉自然语调滑动与声带微观不稳定性。
  - **Jitter (%) 与 Shimmer (%)**：量化真实喉部声带周期间振动扰动。
  - **谐噪比（HNR 单位 dB）**：鉴别过度平滑的纯净合成音质。
  - **声码器相位连续性分析**：捕获神经声码器的伪影与非线性失真。
- **浏览器端直接录音**：一键录制麦克风音频，或拖拽上传 WAV、MP3、M4A、FLAC 文件。
- **内置基准样本**：提供真人人声、AI 深度伪造语音和录音室音频的快速对比测试。

### 🔐 2. 密码学数字水印嵌入
- **心理声学掩蔽算法 (ITU-R BS.1387)**：根据音频局部能量动态调节量化步长，保持信噪比 $SNR > 40\text{ dB}$（人耳完全无法察觉）。
- **直接序列扩频 (DSSS) + QIM 量化**：结合 Barker/Gold 码提供高鲁棒性同步。
- **HMAC-SHA256 数字签名**：防止水印被伪造、擦除或重放。
- **抗电话信道破坏**：抵抗 G.711 高通滤波（300 Hz 截止）及有损编码。

### ⛓️ 3. 不可篡改的真实性存证账本
- **二叉默克尔树 (Binary Merkle Tree)**：生成 $O(\log N)$ 包含证明，无需暴露完整数据库即可验证记录。
- **SHA-256 内容寻址**：保证音频文件的字节级完整性。
- **Polygon L2 Rollup 状态锚定**：定期对状态根进行公证签名。

### 🧠 4. AI 智能声学司法诊断 (Gemini 3.7)
- 自动生成符合司法鉴定规范的中文/多语言声学分析报告，包含物理声学成因解释与采信建议。
- 内置高精度离线物理推断引擎，在外部 API 波动时实现零宕机自动降级。

---

## 👥 4. 适用人群与应用场景

1. **银行与金融科技风控团队**：防御呼叫中心声音伪造诈骗，保障大额声纹转账安全。
2. **司法鉴定所与法庭声学实验室**：提供具备法律效力的录音真伪鉴定报告与证据链存证。
3. **新闻机构与事实核查媒体**：快速核实外泄录音、政要讲话及热点社交媒体语音真实性。
4. **配音演员、歌手与音频创作者**：在作品中注入不可察觉的数字版权水印，防止 AI 模型侵权爬取。
5. **企业安全运营中心 (SOC)**：对客户服务热线通话进行自动化真伪抽检与异常预警。

---

## 🏗️ 5. 系统架构

```
                      ┌─────────────────────────────────┐
                      │    前端界面 (React 19 + Vite)   │
                      │  • 浏览器麦克风录音             │
                      │  • 实时声学波形 / 频谱图        │
                      │  • 鉴伪分析与水印嵌入           │
                      └────────────────┬────────────────┘
                                       │ HTTP / Multipart
                                       ▼
                      ┌─────────────────────────────────┐
                      │     后端服务 (Node + Express)   │
                      │  • 非阻塞异步任务队列           │
                      │  • 分层密钥管理 (KMS)           │
                      └───────┬─────────────────┬───────┘
                              │                 │
              ┌───────────────┴────┐       ┌────┴────────────────┐
              ▼                    ▼       ▼                     ▼
     ┌────────────────┐  ┌───────────────┐ ┌───────────────┐ ┌────────────────┐
     │  DSP 活体分析  │  │ 心理声学水印  │ │  默克尔树账本 │ │  Gemini 3.7 AI │
     │  • Jitter/HNR  │  │ • DSSS/QIM    │ │ • O(log N)    │ │ • 司法鉴定报告 │
     │  • 声码器相位  │  │ • BS.1387掩蔽 │ │ • L2 Rollup   │ │   自动生成     │
     └────────────────┘  └───────────────┘ └───────────────┘ └────────────────┘
```

---

## 💻 6. 安装与运行指南

### 环境要求
- **Node.js**: `v18.0.0` 或更高版本
- **包管理器**: `npm`、`bun`、`yarn` 或 `pnpm`
- *(可选)* Google Gemini API Key（系统已内置完善的离线物理诊断引擎，无 Key 也可完整运行）。

### 快速启动

1. **克隆代码仓库**：
   ```bash
   git clone https://github.com/your-org/echosign-voice-inspector.git
   cd echosign-voice-inspector
   ```

2. **安装依赖包**：
   ```bash
   npm install
   ```

3. **配置环境变量**：
   从示例文件复制 `.env`：
   ```bash
   cp .env.example .env
   ```
   （可选）在 `.env` 中填写您的配置：
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   KMS_MASTER_KEY=your_master_key_32_bytes
   ```

4. **启动开发服务器**：
   ```bash
   npm run dev
   ```
   在浏览器中访问：`http://localhost:3000`。

5. **构建并启动生产环境**：
   ```bash
   npm run build
   npm start
   ```

---

## 📡 7. API 接口文档

| 接口路由 | 请求方式 | 说明 |
| :--- | :--- | :--- |
| `/api/v1/verify` | `POST` (multipart) | 执行完整的声学活体检测、Deepfake 鉴伪、水印提取和区块链比对。 |
| `/api/v1/watermark/embed` | `POST` (multipart) | 为音频嵌入带签名的心理声学水印，并在区块链账本中完成注册。 |
| `/api/v1/blockchain/blocks` | `GET` | 查询区块链账本中的所有已公证区块与默克尔根。 |
| `/api/v1/blockchain/merkle-proof/:txId` | `GET` | 获取指定交易的 $O(\log N)$ 默克尔包含证明。 |
| `/api/v1/blockchain/l2-anchor` | `GET` | 查看在 Polygon L2 Rollup 网络的锚定公证状态。 |
| `/api/v1/kms/status` | `GET` | 查看当前 KMS 密钥环状态及当前密钥纪元。 |

---

## 🔒 8. 安全与密码学保证

- **不可感知性**：严格遵循 ITU-R BS.1387 心理声学标准，信噪比 $> 40\text{ dB}$。
- **防伪造防篡改**：基于 PBKDF2/HKDF 派生密钥生成 HMAC-SHA256 签名。
- **密钥无缝轮换**：分层 KMS 支持多纪元密钥管理，轮换后仍可验证旧版有效签名。
- **存在性公证**：二叉默克尔树确保历史数据不可事后篡改。

---

## 🛠️ 9. 技术栈

- **前端**：React 19、TypeScript、Tailwind CSS 4、Lucide Icons、Motion。
- **音频处理**：Web Audio API、HTML5 Canvas 频谱图、FFT 快速傅里叶变换、DCT 离散余弦变换。
- **后端服务**：Node.js、Express、Multer、Crypto、tsx、esbuild。
- **AI 智能诊断**：Google Gen AI SDK (`@google/genai` with `gemini-3.7-flash`)。

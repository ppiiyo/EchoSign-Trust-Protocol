# EchoSign Attest

> **音频完整性与来源证明**（密码学认证）。
> **不是**经认证的深度伪造检测器，也**不是**司法鉴定报告。

[English](README.md) · [Русский](README.ru.md) · [Threat model](docs/THREAT_MODEL.md)

## 我们证明什么

1. 签名后的字节完整性（Ed25519）
2. 在时间 T 的存在性（TSA / OpenTimestamps — 演进中）
3. 署名 = 私钥控制权
4. 系统内证明包保管链

**不声明：**「真人 vs AI」、行业认证、电话网关、司法鉴定。

## 快速开始

```bash
cp .env.example .env
npm install && npm test && npm run dev
```

MIT

# EchoSign Attest · v1.0.0-rc.1

**音频完整性与来源的密码学证明** — 不是深伪检测器。

| | |
| --- | --- |
| **证明** | 签名后完整性 · 时间存在性（TSA/OTS）· 私钥控制 · 系统内保管链 |
| **不证明** | 真人 vs AI · 深伪检测 · 法庭认证 · GOST/ISO 17025/SOC 2 |

分支 `product-ready` · 标签 `v1.0.0-rc.1` · [威胁模型](docs/THREAT_MODEL.md) · [试点](docs/PILOT_KIT.md)

```bash
git checkout product-ready && npm install
node scripts/demo-sign-verify.mjs
node scripts/report-integrity.mjs tmp-demo/sample.esatt.json --out tmp-report
DEMO_MODE=1 ATTEST_OFFLINE=1 npm run dev
```

验证级别 1–4：签名 → TSA → OTS → Merkle。MIT。仅 RC。

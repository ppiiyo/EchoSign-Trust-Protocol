# EchoSign Attest · v1.0.0-rc.1

**Криптографическая целостность и происхождение аудио** — не детектор дипфейков.

| | |
| --- | --- |
| **Доказывает** | Целостность после подписи · время (TSA/OTS) · контроль ключа · внутреннюю цепочку |
| **Не доказывает** | Человек vs ИИ · дипфейки · судебную сертификацию · ГОСТ/ISO 17025/SOC 2 |

Ветка `product-ready` · тег `v1.0.0-rc.1` · [Модель угроз](docs/THREAT_MODEL.md) · [Пилот](docs/PILOT_KIT.md)

```bash
git checkout product-ready && npm install
node scripts/demo-sign-verify.mjs
node scripts/report-integrity.mjs tmp-demo/sample.esatt.json --out tmp-report
DEMO_MODE=1 ATTEST_OFFLINE=1 npm run dev
```

Уровни проверки 1–4: подпись → TSA → OTS → Merkle inclusion. MIT. RC only.

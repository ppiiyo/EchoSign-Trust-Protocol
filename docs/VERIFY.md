# Verification (WP-7)

## CLI

```bash
node scripts/verify-bundle.mjs bundle.esatt.json
node scripts/verify-bundle.mjs bundle.esatt.json --json
node scripts/verify-bundle.mjs bundle.esatt.json --expect-root <hex> --proof proof.json
```

Exit codes: `0` valid, `1` invalid, `2` usage/file error.

## Report

```bash
node scripts/report-integrity.mjs bundle.esatt.json --out tmp-report
# report.html, report.pdf, report.json, fingerprint.svg
```

## Browser

Open `/verify/` — drop `.esatt.json`. Web Crypto only; nothing uploaded.

## Scope

Valid signature proves integrity of the signed manifest at signing time.
Does **not** prove human speaker, deepfake absence, or legal certification.

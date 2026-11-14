# Time attestation (TSA / OTS)

## Model

1. Sign canonical manifest (includes `serverReceivedAt` only).
2. `SHA-256(canonical)` → RFC 3161 TSA request + OpenTimestamps stamp.
3. Store result as `timeAttestation` **next to** the signature (not inside signed JSON).

## Status

| Field | Values |
| --- | --- |
| `tsa.status` | `granted` \| `failed` \| `unavailable` |
| `ots.status` | `pending-calendar` \| `bitcoin-confirmed` \| `unavailable` |
| `clockSource` | `tsa` \| `ots-pending` \| `server-clock-only` |

`bitcoin-confirmed` is **never** set by marker heuristics. Use official `ots verify`.

## Offline / air-gap

```bash
ATTEST_OFFLINE=1 npm run dev
# or multipart field offline=1
```

Result: `clockSource=server-clock-only`, TSA/OTS `unavailable`.

## Full TSA verify (operator)

```bash
echo "$CANONICAL" > manifest.canonical.json
echo "$TOKEN_B64" | base64 -d > token.tsr
# FreeTSA CA: https://freetsa.org/files/cacert.pem
openssl ts -verify -data manifest.canonical.json -in token.tsr -CAfile cacert.pem
```

Structural check (CI): `tsaTokenStructuralCheck` requires imprint bytes inside token.

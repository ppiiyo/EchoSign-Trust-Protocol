# Transparency log (WP-4)

Append-only Merkle log of attest packages (RFC 6962-style leaf/node hashing).

## Storage (demo)

```
data/log/entries.jsonl      # one JSON object per leaf
data/log/root-latest.json   # latest published snapshot
data/log/roots/YYYY-MM-DD.json
```

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/log/root` | Live root + published snapshot |
| `GET /api/v1/log/root/:date` | Published root for UTC date |
| `GET /api/v1/log/entries` | All entries + tree size |
| `GET /api/v1/log/proof/:index` | Inclusion proof |
| `GET /api/v1/log/consistency?oldSize=&oldRoot=` | Consistency check |

Sign response includes `log: { index, leafHashHex, rootHex, inclusionProof }`.

## Offline check

Given published `rootHex` and a proof from sign time:

```js
verifyInclusion(leafHash, proof, publishedRootHex) // true/false
```

Tampering `entries.jsonl` changes the live root; proofs no longer match the published root.

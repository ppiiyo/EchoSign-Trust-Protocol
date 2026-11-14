# Keystore backup & restore

| Path | Contents |
| --- | --- |
| `data/keystore.json` | Encrypted Ed25519 keys (AES-256-GCM) |
| `KMS_MASTER_KEY` | Passphrase ≥16 chars — store **separately** |

## Backup

```bash
cp data/keystore.json backups/keystore-$(date -u +%Y%m%dT%H%M%SZ).json
# Keep KMS_MASTER_KEY in a secrets manager, not beside the file
```

## Restore

```bash
export KMS_MASTER_KEY='…'
cp backups/keystore-….json data/keystore.json
chmod 600 data/keystore.json
npm start
# /health → same keyFingerprint; offline verify still works
```

## Failures

| Error | Action |
| --- | --- |
| `KEYSTORE_DECRYPT_FAILED` | Wrong passphrase or tamper — restore backup |
| `KEYSTORE_CORRUPT` | Invalid JSON — restore backup |

Pre-WP-2 code silently regenerated keys on decrypt failure. That path is removed.

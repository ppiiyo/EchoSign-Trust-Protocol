# Keystore backup & restore

## Files

| Path | Contents | Sensitivity |
| --- | --- | --- |
| `data/keystore.json` | Encrypted Ed25519 private keys (AES-256-GCM) + public keys + metadata | **Critical** |
| env `KMS_MASTER_KEY` | Passphrase (≥16 chars) for scrypt KEK | **Secret** — store separately |

Never commit `KMS_MASTER_KEY` or ship it in the same archive as `keystore.json` without envelope encryption.

## Backup

```bash
cp data/keystore.json  backups/keystore-$(date -u +%Y%m%dT%H%M%SZ).json
# Passphrase in secrets manager — not next to the JSON
```

## Restore

```bash
export KMS_MASTER_KEY='\u2026'   # must match backup-time key
mkdir -p data
cp backups/keystore-\u2026.json data/keystore.json
chmod 600 data/keystore.json
npm start
# GET /health → same keyFingerprint; historical packages still verify
```

## Failure modes

| Symptom | Cause | Action |
| --- | --- | --- |
| `KEYSTORE_DECRYPT_FAILED` | Wrong passphrase or tampered file | Restore backup + correct passphrase |
| `KEYSTORE_CORRUPT` | Truncated/invalid JSON | Restore backup |
| New fingerprint after restart | Missing file / wrong key | Restore keystore; never ignore in prod |

## Signing-time trust boundary

`signingTime = manifest.timestamps.serverReceivedAt`.  
A key revoked **after** that instant does **not** invalidate the signature.  
A key revoked **at or before** that instant → verify fails.

## Demo mode

`DEMO_MODE=1` without `KMS_MASTER_KEY` may use a fixed demo passphrase. Production must set `KMS_MASTER_KEY`.

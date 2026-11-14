/**
 * Encrypted keystore for Ed25519 private keys (E1-2 / WP-2).
 *
 * - Private keys never leave the process in the clear after load.
 * - On-disk format: AES-256-GCM encrypted JSON, key derived via scrypt.
 * - Supports multiple keys + rotation (old keys kept for historical verify).
 * - Master passphrase / KMS_MASTER_KEY required in non-demo mode.
 * - Corrupt / wrong passphrase → KEYSTORE_DECRYPT_FAILED (no silent regenerate).
 */

import crypto from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  generateEd25519KeyPair,
  publicKeyFromPem,
} from './index.js';

export interface StoredKeyRecord {
  keyId: string;
  fingerprint: string;
  publicKeyPem: string;
  privateKeyCipherB64: string;
  ivB64: string;
  tagB64: string;
  purpose: 'org-root' | 'device' | 'ephemeral';
  orgId?: string;
  deviceId?: string;
  createdAt: string;
  rotatedAt?: string;
  status: 'active' | 'rotated' | 'revoked';
  revokedAt?: string;
  revokeReason?: string;
}

export interface KeystoreFile {
  version: 1;
  saltB64: string;
  keys: StoredKeyRecord[];
}

export interface KeystoreOptions {
  path: string;
  passphrase?: string;
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, 32, { N: 32768, r: 8, p: 1 });
}

const DEMO_PASSPHRASE = 'demo-only-ephemeral-passphrase-not-for-prod';

function resolvePassphrase(explicit?: string): string {
  if (explicit && explicit.length >= 16) return explicit;
  const env = process.env.KMS_MASTER_KEY || process.env.SECRET_KEY;
  if (env && env.length >= 16) return env;
  if (process.env.DEMO_MODE === '1') {
    return DEMO_PASSPHRASE;
  }
  throw new Error(
    'Keystore requires KMS_MASTER_KEY (or passphrase) of at least 16 characters. Set DEMO_MODE=1 only for ephemeral local demos.'
  );
}

function encryptPrivateKey(
  privateKeyPem: string,
  kek: Buffer
): { cipherB64: string; ivB64: string; tagB64: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  const enc = Buffer.concat([
    cipher.update(privateKeyPem, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    cipherB64: enc.toString('base64'),
    ivB64: iv.toString('base64'),
    tagB64: tag.toString('base64'),
  };
}

function decryptPrivateKey(record: StoredKeyRecord, kek: Buffer): string {
  const iv = Buffer.from(record.ivB64, 'base64');
  const tag = Buffer.from(record.tagB64, 'base64');
  const data = Buffer.from(record.privateKeyCipherB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export class EncryptedKeystore {
  private path: string;
  private passphrase: string;
  private salt: Buffer;
  private kek: Buffer;
  private records: Map<string, StoredKeyRecord> = new Map();
  private privateCache: Map<string, string> = new Map();

  private constructor(path: string, passphrase: string, salt: Buffer, records: StoredKeyRecord[]) {
    this.path = path;
    this.passphrase = passphrase;
    this.salt = salt;
    this.kek = deriveKey(passphrase, salt);
    for (const r of records) {
      this.records.set(r.keyId, r);
    }
  }

  static create(opts: KeystoreOptions): EncryptedKeystore {
    const passphrase = resolvePassphrase(opts.passphrase);
    const salt = crypto.randomBytes(16);
    const ks = new EncryptedKeystore(opts.path, passphrase, salt, []);
    ks.persist();
    return ks;
  }

  static load(opts: KeystoreOptions): EncryptedKeystore {
    if (!existsSync(opts.path)) {
      throw new Error(`Keystore not found at ${opts.path}`);
    }
    const passphrase = resolvePassphrase(opts.passphrase);
    let raw: KeystoreFile;
    try {
      raw = JSON.parse(readFileSync(opts.path, 'utf8')) as KeystoreFile;
    } catch (err) {
      throw new Error(
        `KEYSTORE_CORRUPT: cannot parse ${opts.path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (raw.version !== 1) throw new Error(`Unsupported keystore version: ${raw.version}`);
    if (!raw.saltB64) throw new Error(`KEYSTORE_CORRUPT: missing saltB64 in ${opts.path}`);
    const salt = Buffer.from(raw.saltB64, 'base64');
    const ks = new EncryptedKeystore(opts.path, passphrase, salt, raw.keys ?? []);

    for (const r of raw.keys ?? []) {
      try {
        decryptPrivateKey(r, ks.kek);
        return ks;
      } catch {
        /* try next */
      }
    }
    if ((raw.keys ?? []).length > 0) {
      throw new Error(
        `KEYSTORE_DECRYPT_FAILED: cannot decrypt any key in ${opts.path}. ` +
          `Wrong KMS_MASTER_KEY/passphrase or corrupted ciphertext. Refusing to start.`
      );
    }
    return ks;
  }

  static open(opts: KeystoreOptions): EncryptedKeystore {
    if (existsSync(opts.path)) return EncryptedKeystore.load(opts);
    return EncryptedKeystore.create(opts);
  }

  async generateKey(params: {
    purpose: StoredKeyRecord['purpose'];
    orgId?: string;
    deviceId?: string;
  }): Promise<{ keyId: string; fingerprint: string; publicKeyPem: string }> {
    const kp = await generateEd25519KeyPair();
    return this.storeGeneratedKey(kp, params);
  }

  generateKeySync(params: {
    purpose: StoredKeyRecord['purpose'];
    orgId?: string;
    deviceId?: string;
  }): { keyId: string; fingerprint: string; publicKeyPem: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const spkiDer = publicKey.export({ type: 'spki', format: 'der' });
    const publicKeyRaw = spkiDer.subarray(spkiDer.length - 32);
    const fingerprint = crypto.createHash('sha256').update(publicKeyRaw).digest('hex').slice(0, 16);
    return this.storeGeneratedKey(
      { privateKeyPem, publicKeyPem, fingerprint },
      params
    );
  }

  private storeGeneratedKey(
    kp: { privateKeyPem: string; publicKeyPem: string; fingerprint: string },
    params: { purpose: StoredKeyRecord['purpose']; orgId?: string; deviceId?: string }
  ): { keyId: string; fingerprint: string; publicKeyPem: string } {
    const keyId = `key_${params.purpose}_${kp.fingerprint}`;
    const enc = encryptPrivateKey(kp.privateKeyPem, this.kek);

    const record: StoredKeyRecord = {
      keyId,
      fingerprint: kp.fingerprint,
      publicKeyPem: kp.publicKeyPem,
      privateKeyCipherB64: enc.cipherB64,
      ivB64: enc.ivB64,
      tagB64: enc.tagB64,
      purpose: params.purpose,
      orgId: params.orgId,
      deviceId: params.deviceId,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    this.records.set(keyId, record);
    this.privateCache.set(keyId, kp.privateKeyPem);
    this.persist();

    return {
      keyId,
      fingerprint: kp.fingerprint,
      publicKeyPem: kp.publicKeyPem,
    };
  }

  getPrivateKeyPem(keyId: string): string {
    const cached = this.privateCache.get(keyId);
    if (cached) return cached;

    const record = this.records.get(keyId);
    if (!record) throw new Error(`Unknown keyId: ${keyId}`);
    if (record.status === 'revoked') {
      throw new Error(`Key ${keyId} is revoked (${record.revokeReason ?? 'no reason'})`);
    }

    const pem = decryptPrivateKey(record, this.kek);
    this.privateCache.set(keyId, pem);
    return pem;
  }

  getPublicKeyPem(keyId: string): string {
    const record = this.records.get(keyId);
    if (!record) throw new Error(`Unknown keyId: ${keyId}`);
    return record.publicKeyPem;
  }

  getRecord(keyId: string): StoredKeyRecord | undefined {
    return this.records.get(keyId);
  }

  listKeys(filter?: {
    status?: StoredKeyRecord['status'];
    purpose?: StoredKeyRecord['purpose'];
  }): StoredKeyRecord[] {
    let list = [...this.records.values()];
    if (filter?.status) list = list.filter((r) => r.status === filter.status);
    if (filter?.purpose) list = list.filter((r) => r.purpose === filter.purpose);
    return list;
  }

  async rotateKey(oldKeyId: string): Promise<{ keyId: string; fingerprint: string; publicKeyPem: string }> {
    const old = this.records.get(oldKeyId);
    if (!old) throw new Error(`Unknown keyId: ${oldKeyId}`);
    if (old.status !== 'active') throw new Error(`Key ${oldKeyId} is not active`);

    old.status = 'rotated';
    old.rotatedAt = new Date().toISOString();
    this.records.set(oldKeyId, old);

    return this.generateKey({
      purpose: old.purpose,
      orgId: old.orgId,
      deviceId: old.deviceId,
    });
  }

  revokeKey(keyId: string, reason: string): void {
    const record = this.records.get(keyId);
    if (!record) throw new Error(`Unknown keyId: ${keyId}`);
    record.status = 'revoked';
    record.revokedAt = new Date().toISOString();
    record.revokeReason = reason;
    this.records.set(keyId, record);
    this.privateCache.delete(keyId);
    this.persist();
  }

  toJwks(): {
    keys: Array<{ kid: string; kty: 'OKP'; crv: 'Ed25519'; x: string; status: string }>;
  } {
    const keys = [...this.records.values()]
      .filter((r) => r.status !== 'revoked')
      .map((r) => {
        const spki = publicKeyFromPem(r.publicKeyPem).export({ type: 'spki', format: 'der' });
        const raw = spki.subarray(spki.length - 32);
        return {
          kid: r.keyId,
          kty: 'OKP' as const,
          crv: 'Ed25519' as const,
          x: raw.toString('base64url'),
          status: r.status,
        };
      });
    return { keys };
  }

  private persist(): void {
    const dir = dirname(this.path);
    if (dir && dir !== '.') mkdirSync(dir, { recursive: true });

    const file: KeystoreFile = {
      version: 1,
      saltB64: this.salt.toString('base64'),
      keys: [...this.records.values()],
    };
    writeFileSync(this.path, JSON.stringify(file, null, 2), { mode: 0o600 });
  }
}

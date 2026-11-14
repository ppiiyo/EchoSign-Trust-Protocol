/**
 * Product-facing Attest service (Ed25519 manifests).
 * Compatible with packages/attest-crypto and scripts/verify-independent.mjs.
 */

import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ManifestV1 {
  version: '1';
  contentHash: string;
  segmentHashes?: string[];
  capture: {
    startedAt: string;
    endedAt: string;
    sampleRate?: number;
    channels?: number;
    deviceId?: string;
  };
  timestamps: {
    serverReceivedAt?: string;
    tsaToken?: string;
    otsProof?: string;
  };
  signer: {
    keyFingerprint: string;
    orgId?: string;
    deviceId?: string;
  };
  meta?: Record<string, unknown>;
}

export interface AttestSignResult {
  manifest: ManifestV1;
  signatureB64u: string;
  publicKeyPem: string;
  keyFingerprint: string;
  contentHash: string;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function fingerprintFromPublicKey(publicKey: crypto.KeyObject): string {
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const raw = spki.subarray(spki.length - 32);
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

class AttestKeyring {
  private privateKey!: crypto.KeyObject;
  private publicKey!: crypto.KeyObject;
  private fingerprint!: string;
  private publicPem!: string;
  private ready = false;

  init(): void {
    if (this.ready) return;

    const dataDir = process.env.ATTEST_DATA_DIR || join(process.cwd(), 'data');
    const keyPath = join(dataDir, 'attest-org-key.json');

    const passphrase =
      process.env.KMS_MASTER_KEY ||
      process.env.SECRET_KEY ||
      (process.env.DEMO_MODE === '1' ? 'demo-only-ephemeral-passphrase-not-for-prod' : '');

    if (existsSync(keyPath) && passphrase.length >= 16) {
      try {
        const stored = JSON.parse(readFileSync(keyPath, 'utf8')) as {
          iv: string; tag: string; cipher: string;
        };
        const kek = crypto.scryptSync(passphrase, 'echosign-attest-v1', 32);
        const decipher = crypto.createDecipheriv(
          'aes-256-gcm', kek, Buffer.from(stored.iv, 'base64')
        );
        decipher.setAuthTag(Buffer.from(stored.tag, 'base64'));
        const pem = Buffer.concat([
          decipher.update(Buffer.from(stored.cipher, 'base64')),
          decipher.final(),
        ]).toString('utf8');
        this.privateKey = crypto.createPrivateKey(pem);
        this.publicKey = crypto.createPublicKey(this.privateKey);
        this.publicPem = this.publicKey.export({ type: 'spki', format: 'pem' }) as string;
        this.fingerprint = fingerprintFromPublicKey(this.publicKey);
        this.ready = true;
        return;
      } catch {
        // regenerate
      }
    }

    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.publicPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    this.fingerprint = fingerprintFromPublicKey(publicKey);

    if (passphrase.length >= 16) {
      try {
        mkdirSync(dataDir, { recursive: true });
        const kek = crypto.scryptSync(passphrase, 'echosign-attest-v1', 32);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
        const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
        const enc = Buffer.concat([cipher.update(privPem, 'utf8'), cipher.final()]);
        writeFileSync(
          keyPath,
          JSON.stringify({
            iv: iv.toString('base64'),
            tag: cipher.getAuthTag().toString('base64'),
            cipher: enc.toString('base64'),
            fingerprint: this.fingerprint,
          }),
          { mode: 0o600 }
        );
      } catch (err) {
        console.warn('[attest] could not persist org key:', (err as Error).message);
      }
    } else {
      console.warn('[attest] No KMS_MASTER_KEY — org signing key is ephemeral (DEMO).');
    }

    this.ready = true;
  }

  getPublicPem(): string {
    this.init();
    return this.publicPem;
  }

  getFingerprint(): string {
    this.init();
    return this.fingerprint;
  }

  sign(payload: Buffer | string): string {
    this.init();
    const data = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
    return crypto.sign(null, data, this.privateKey).toString('base64url');
  }

  toJwks() {
    this.init();
    const spki = this.publicKey.export({ type: 'spki', format: 'der' });
    const raw = spki.subarray(spki.length - 32);
    return {
      keys: [{
        kid: this.fingerprint,
        kty: 'OKP' as const,
        crv: 'Ed25519' as const,
        x: raw.toString('base64url'),
      }],
    };
  }
}

const keyring = new AttestKeyring();

export function attestSignAudio(params: {
  audioBuffer: Buffer;
  captureStartedAt?: string;
  captureEndedAt?: string;
  sampleRate?: number;
  channels?: number;
  deviceId?: string;
  orgId?: string;
}): AttestSignResult {
  const contentHash = crypto.createHash('sha256').update(params.audioBuffer).digest('hex');
  const now = new Date().toISOString();

  const manifest: ManifestV1 = {
    version: '1',
    contentHash,
    capture: {
      startedAt: params.captureStartedAt ?? now,
      endedAt: params.captureEndedAt ?? now,
      sampleRate: params.sampleRate,
      channels: params.channels,
      deviceId: params.deviceId,
    },
    timestamps: { serverReceivedAt: now },
    signer: {
      keyFingerprint: keyring.getFingerprint(),
      orgId: params.orgId ?? 'org_default',
      deviceId: params.deviceId,
    },
  };

  const canonical = canonicalJson(manifest);
  const signatureB64u = keyring.sign(canonical);
  const contentHashOfManifest = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');

  return {
    manifest,
    signatureB64u,
    publicKeyPem: keyring.getPublicPem(),
    keyFingerprint: keyring.getFingerprint(),
    contentHash: contentHashOfManifest,
  };
}

export function attestVerify(params: {
  manifest: unknown;
  signatureB64u: string;
  publicKeyPem?: string;
}): { valid: boolean; reason?: string; contentHash?: string } {
  try {
    const publicPem = params.publicKeyPem ?? keyring.getPublicPem();
    const key = crypto.createPublicKey(publicPem);
    const canonical = canonicalJson(params.manifest);
    const contentHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
    const sig = Buffer.from(params.signatureB64u, 'base64url');
    const valid = crypto.verify(null, Buffer.from(canonical, 'utf8'), key, sig);
    return valid
      ? { valid: true, contentHash }
      : { valid: false, reason: 'signature mismatch', contentHash };
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : 'verify error' };
  }
}

export function attestJwks() {
  return keyring.toJwks();
}

export function attestStatus() {
  keyring.init();
  return {
    ready: true,
    keyFingerprint: keyring.getFingerprint(),
    algorithm: 'Ed25519',
    demoMode: process.env.DEMO_MODE === '1' || !process.env.KMS_MASTER_KEY,
  };
}

/**
 * @echosign/attest-crypto
 * Ed25519 sign/verify, Manifest v1, keystore, TSA, OpenTimestamps
 */

import crypto from 'node:crypto';
import { promisify } from 'node:util';

const generateKeyPair = promisify(crypto.generateKeyPair);

export interface KeyPair {
  privateKeyPem: string;
  publicKeyPem: string;
  publicKeyRawB64u: string;
  fingerprint: string;
}

export interface SignResult {
  signatureB64u: string;
  alg: 'Ed25519';
  keyFingerprint: string;
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
  }
  return value;
}

export async function generateEd25519KeyPair(): Promise<KeyPair> {
  const { publicKey, privateKey } = await generateKeyPair('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const publicKeyPem = publicKey as string;
  const privateKeyPem = privateKey as string;
  const spkiDer = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
  const publicKeyRaw = spkiDer.subarray(spkiDer.length - 32);
  return {
    privateKeyPem,
    publicKeyPem,
    publicKeyRawB64u: publicKeyRaw.toString('base64url'),
    fingerprint: crypto.createHash('sha256').update(publicKeyRaw).digest('hex').slice(0, 16),
  };
}

export function publicKeyFromPem(publicKeyPem: string): crypto.KeyObject {
  return crypto.createPublicKey(publicKeyPem);
}

export function privateKeyFromPem(privateKeyPem: string): crypto.KeyObject {
  return crypto.createPrivateKey(privateKeyPem);
}

export function sign(privateKeyPem: string, payload: Buffer | string, keyFingerprint?: string): SignResult {
  const key = privateKeyFromPem(privateKeyPem);
  const data = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
  const signature = crypto.sign(null, data, key);
  let fingerprint = keyFingerprint;
  if (!fingerprint) {
    const pub = crypto.createPublicKey(key);
    const spkiDer = pub.export({ type: 'spki', format: 'der' });
    const raw = spkiDer.subarray(spkiDer.length - 32);
    fingerprint = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  }
  return { signatureB64u: signature.toString('base64url'), alg: 'Ed25519', keyFingerprint: fingerprint };
}

export function verify(publicKeyPem: string, payload: Buffer | string, signatureB64u: string): VerifyResult {
  try {
    const key = publicKeyFromPem(publicKeyPem);
    const data = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
    const signature = Buffer.from(signatureB64u, 'base64url');
    const valid = crypto.verify(null, data, key, signature);
    return valid ? { valid: true } : { valid: false, reason: 'signature mismatch' };
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : 'verification error' };
  }
}

export function signManifest(privateKeyPem: string, manifest: unknown, keyFingerprint?: string) {
  const canonical = canonicalJson(manifest);
  const contentHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  const sig = sign(privateKeyPem, canonical, keyFingerprint);
  return { ...sig, canonical, contentHash };
}

export function verifyManifest(publicKeyPem: string, manifest: unknown, signatureB64u: string) {
  const canonical = canonicalJson(manifest);
  const contentHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  return { ...verify(publicKeyPem, canonical, signatureB64u), contentHash };
}

export interface ManifestV1 {
  version: '1';
  contentHash: string;
  segmentHashes?: string[];
  capture: { startedAt: string; endedAt: string; sampleRate?: number; channels?: number; deviceId?: string };
  timestamps: { serverReceivedAt?: string; tsaToken?: string; otsProof?: string };
  signer: { keyFingerprint: string; orgId?: string; deviceId?: string };
  meta?: Record<string, unknown>;
}

export function createManifestV1(partial: Omit<ManifestV1, 'version'>): ManifestV1 {
  return { version: '1', ...partial };
}

export function base64urlEncode(buf: Buffer): string { return buf.toString('base64url'); }
export function base64urlDecode(str: string): Buffer { return Buffer.from(str, 'base64url'); }

export async function generateTestVector() {
  const keyPair = await generateEd25519KeyPair();
  const audioHash = crypto.createHash('sha256').update('test-audio-bytes').digest('hex');
  const manifest = createManifestV1({
    contentHash: audioHash,
    capture: { startedAt: '2026-11-14T10:00:00.000Z', endedAt: '2026-11-14T10:00:05.000Z', sampleRate: 16000, channels: 1 },
    timestamps: { serverReceivedAt: '2026-11-14T10:00:06.000Z' },
    signer: { keyFingerprint: keyPair.fingerprint, orgId: 'org_demo', deviceId: 'dev_demo_01' },
  });
  const signed = signManifest(keyPair.privateKeyPem, manifest, keyPair.fingerprint);
  return { keyPair, manifest, ...signed };
}

export { EncryptedKeystore } from './keystore.js';
export type { StoredKeyRecord, KeystoreFile, KeystoreOptions } from './keystore.js';

export { requestTimestamp, timestampCanonicalJson } from './tsa.js';
export type { TsaRequestOptions, TsaResult } from './tsa.js';

export { otsStamp, otsUpgrade, otsVerifyLocal, otsStampCanonical } from './ots.js';
export type { OtsStampResult, OtsVerifyResult } from './ots.js';

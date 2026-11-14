/**
 * Product Attest service — thin adapter over packages/attest-crypto.
 * No dual keyring. Corrupt keystore → loud fail (no silent key regeneration).
 */

import crypto from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  canonicalJson,
  createManifestV1,
  signManifest,
  verifyManifest,
  type ManifestV1,
  EncryptedKeystore,
  attachTimeAttestation,
  type TimeAttestation,
} from '../../packages/attest-crypto/src/index.ts';

export type { ManifestV1, TimeAttestation };

export interface AttestSignResult {
  manifest: ManifestV1;
  signatureB64u: string;
  publicKeyPem: string;
  keyFingerprint: string;
  contentHash: string;
  timeAttestation?: TimeAttestation;
}

let keystore: EncryptedKeystore | null = null;
let orgKeyId: string | null = null;

function dataDir(): string {
  return process.env.ATTEST_DATA_DIR || join(process.cwd(), 'data');
}

function keystorePath(): string {
  return join(dataDir(), 'keystore.json');
}

export function ensureOrgKeystore(): EncryptedKeystore {
  if (keystore && orgKeyId) return keystore;

  const path = keystorePath();
  mkdirSync(dataDir(), { recursive: true });

  try {
    if (existsSync(path)) {
      keystore = EncryptedKeystore.load({ path });
    } else {
      keystore = EncryptedKeystore.create({ path });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[attest] FATAL keystore error:', msg);
    throw err;
  }

  const active = keystore.listKeys({ purpose: 'org-root', status: 'active' });
  if (active.length === 0) {
    const created = keystore.generateKeySync({ purpose: 'org-root', orgId: 'org_default' });
    orgKeyId = created.keyId;
  } else {
    orgKeyId = active[0].keyId;
  }

  return keystore;
}

function requireOrgKey(): { keyId: string; privatePem: string; publicPem: string; fingerprint: string } {
  const ks = ensureOrgKeystore();
  if (!orgKeyId) throw new Error('Org key not initialized');
  const record = ks.getRecord(orgKeyId);
  if (!record) throw new Error(`Org key record missing: ${orgKeyId}`);
  return {
    keyId: orgKeyId,
    privatePem: ks.getPrivateKeyPem(orgKeyId),
    publicPem: record.publicKeyPem,
    fingerprint: record.fingerprint,
  };
}

export function attestSignAudio(params: {
  audioBuffer: Buffer;
  captureStartedAt?: string;
  captureEndedAt?: string;
  sampleRate?: number;
  channels?: number;
  deviceId?: string;
  orgId?: string;
}): AttestSignResult {
  const org = requireOrgKey();
  const contentHash = crypto.createHash('sha256').update(params.audioBuffer).digest('hex');
  const now = new Date().toISOString();

  const manifest = createManifestV1({
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
      keyFingerprint: org.fingerprint,
      orgId: params.orgId ?? 'org_default',
      deviceId: params.deviceId,
    },
  });

  const signed = signManifest(org.privatePem, manifest, org.fingerprint);

  return {
    manifest,
    signatureB64u: signed.signatureB64u,
    publicKeyPem: org.publicPem,
    keyFingerprint: org.fingerprint,
    contentHash: signed.contentHash,
  };
}

/** Sign + attach TSA/OTS (degrades honestly when offline/unavailable). */
export async function attestSignAudioWithTime(
  params: Parameters<typeof attestSignAudio>[0] & { offline?: boolean }
): Promise<AttestSignResult> {
  const base = attestSignAudio(params);
  const canonical = canonicalJson(base.manifest);
  const timeAttestation = await attachTimeAttestation(canonical, {
    offline: params.offline,
  });
  return { ...base, timeAttestation };
}

export function attestVerify(params: {
  manifest: unknown;
  signatureB64u: string;
  publicKeyPem?: string;
}): { valid: boolean; reason?: string; contentHash?: string } {
  try {
    const publicPem = params.publicKeyPem ?? requireOrgKey().publicPem;
    const result = verifyManifest(publicPem, params.manifest, params.signatureB64u);
    return result.valid
      ? { valid: true, contentHash: result.contentHash }
      : { valid: false, reason: result.reason, contentHash: result.contentHash };
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : 'verify error' };
  }
}

export function attestJwks() {
  return ensureOrgKeystore().toJwks();
}

export function attestStatus() {
  try {
    const org = requireOrgKey();
    return {
      ready: true,
      keyFingerprint: org.fingerprint,
      algorithm: 'Ed25519',
      demoMode: process.env.DEMO_MODE === '1' || !process.env.KMS_MASTER_KEY,
      keystorePath: keystorePath(),
      orgKeyId: org.keyId,
    };
  } catch (err) {
    return {
      ready: false,
      keyFingerprint: null as string | null,
      algorithm: 'Ed25519',
      demoMode: process.env.DEMO_MODE === '1' || !process.env.KMS_MASTER_KEY,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function attestRotateOrgKey(): Promise<{
  oldKeyId: string;
  newKeyId: string;
  newFingerprint: string;
}> {
  const ks = ensureOrgKeystore();
  if (!orgKeyId) throw new Error('No org key to rotate');
  const oldKeyId = orgKeyId;
  const neu = await ks.rotateKey(oldKeyId);
  orgKeyId = neu.keyId;
  return { oldKeyId, newKeyId: neu.keyId, newFingerprint: neu.fingerprint };
}

export { canonicalJson };

/**
 * MVP persistence — file-backed JSON store (no external DB required).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';

const DATA = process.env.ATTEST_DATA_DIR || join(process.cwd(), 'data');

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function readJson<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(path: string, data: unknown) {
  ensureDir(join(path, '..'));
  writeFileSync(path, JSON.stringify(data, null, 2), { mode: 0o600 });
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  secretHash: string;
  prefix: string;
  orgId: string;
  scopes: Array<'attest:sign' | 'attest:read' | 'devices:write' | 'admin'>;
  createdAt: string;
  revokedAt?: string;
}

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export function createApiKey(params: {
  name: string;
  orgId?: string;
  scopes?: ApiKeyRecord['scopes'];
}): { record: ApiKeyRecord; secret: string } {
  ensureDir(DATA);
  const secret = `esk_live_${crypto.randomBytes(24).toString('base64url')}`;
  const record: ApiKeyRecord = {
    id: `key_${crypto.randomBytes(8).toString('hex')}`,
    name: params.name,
    secretHash: hashSecret(secret),
    prefix: secret.slice(0, 16) + '\u2026',
    orgId: params.orgId ?? 'org_default',
    scopes: params.scopes ?? ['attest:sign', 'attest:read'],
    createdAt: new Date().toISOString(),
  };
  const all = readJson<ApiKeyRecord[]>(join(DATA, 'api-keys.json'), []);
  all.push(record);
  writeJson(join(DATA, 'api-keys.json'), all);
  return { record, secret };
}

export function findApiKeyBySecret(secret: string): ApiKeyRecord | null {
  const all = readJson<ApiKeyRecord[]>(join(DATA, 'api-keys.json'), []);
  const h = hashSecret(secret);
  return all.find((k) => k.secretHash === h && !k.revokedAt) ?? null;
}

export function listApiKeys(orgId?: string): Omit<ApiKeyRecord, 'secretHash'>[] {
  const all = readJson<ApiKeyRecord[]>(join(DATA, 'api-keys.json'), []);
  return all
    .filter((k) => !orgId || k.orgId === orgId)
    .map(({ secretHash: _, ...rest }) => rest);
}

export function revokeApiKey(id: string): boolean {
  const all = readJson<ApiKeyRecord[]>(join(DATA, 'api-keys.json'), []);
  const k = all.find((x) => x.id === id);
  if (!k) return false;
  k.revokedAt = new Date().toISOString();
  writeJson(join(DATA, 'api-keys.json'), all);
  return true;
}

export interface DeviceRecord {
  id: string;
  orgId: string;
  label: string;
  publicKeyPem?: string;
  fingerprint?: string;
  createdAt: string;
  status: 'active' | 'revoked';
}

export function registerDevice(params: {
  orgId?: string;
  label: string;
  publicKeyPem?: string;
  fingerprint?: string;
}): DeviceRecord {
  ensureDir(DATA);
  const record: DeviceRecord = {
    id: `dev_${crypto.randomBytes(8).toString('hex')}`,
    orgId: params.orgId ?? 'org_default',
    label: params.label,
    publicKeyPem: params.publicKeyPem,
    fingerprint: params.fingerprint,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  const all = readJson<DeviceRecord[]>(join(DATA, 'devices.json'), []);
  all.push(record);
  writeJson(join(DATA, 'devices.json'), all);
  return record;
}

export function listDevices(orgId?: string): DeviceRecord[] {
  const all = readJson<DeviceRecord[]>(join(DATA, 'devices.json'), []);
  return all.filter((d) => d.status === 'active' && (!orgId || d.orgId === orgId));
}

export interface ProofPackage {
  id: string;
  orgId: string;
  deviceId?: string;
  createdAt: string;
  audioContentHash: string;
  manifest: unknown;
  signatureB64u: string;
  publicKeyPem: string;
  keyFingerprint: string;
  audioStored?: boolean;
  disclaimer: string;
  /** Honest time attestation (TSA / OTS / server-clock). */
  timeAttestation?: unknown;
}

export function savePackage(pkg: ProofPackage): void {
  const dir = join(DATA, 'packages');
  ensureDir(dir);
  writeJson(join(dir, `${pkg.id}.json`), pkg);
  const index = readJson<string[]>(join(DATA, 'packages-index.json'), []);
  if (!index.includes(pkg.id)) {
    index.unshift(pkg.id);
    writeJson(join(DATA, 'packages-index.json'), index.slice(0, 5000));
  }
}

export function getPackage(id: string): ProofPackage | null {
  const path = join(DATA, 'packages', `${id}.json`);
  if (!existsSync(path)) return null;
  return readJson<ProofPackage | null>(path, null);
}

export function listPackages(limit = 50): ProofPackage[] {
  const index = readJson<string[]>(join(DATA, 'packages-index.json'), []);
  const out: ProofPackage[] = [];
  for (const id of index.slice(0, limit)) {
    const p = getPackage(id);
    if (p) out.push(p);
  }
  return out;
}

export function storeInit() {
  ensureDir(DATA);
  ensureDir(join(DATA, 'packages'));
  return {
    dataDir: DATA,
    packageCount: readJson<string[]>(join(DATA, 'packages-index.json'), []).length,
    keyCount: readJson<ApiKeyRecord[]>(join(DATA, 'api-keys.json'), []).length,
    deviceCount: listDevices().length,
  };
}

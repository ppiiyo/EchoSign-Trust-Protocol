import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiKeyRecord, DeviceRecord, ProofPackage } from './store.ts';

type QueryResult<T = Record<string, unknown>> = { rows: T[]; rowCount: number | null };
export interface PgPool {
  query: (text: string, params?: unknown[]) => Promise<QueryResult>;
  connect: () => Promise<{ query: (text: string, params?: unknown[]) => Promise<QueryResult>; release: () => void }>;
}
let pool: PgPool | null = null;

export function isPgEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function getPool(): Promise<PgPool> {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const pg = await import('pg');
  const Pool = (pg as any).default?.Pool ?? (pg as any).Pool;
  pool = new Pool({ connectionString: process.env.DATABASE_URL }) as PgPool;
  return pool;
}

export async function migrate(): Promise<void> {
  const p = await getPool();
  const sql = readFileSync(join(process.cwd(), 'migrations', '001_init.sql'), 'utf8');
  await p.query(sql);
}

function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export async function createApiKeyPg(params: {
  name: string; orgId?: string; scopes?: ApiKeyRecord['scopes'];
}): Promise<{ record: ApiKeyRecord; secret: string }> {
  const p = await getPool();
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
  await p.query(
    `INSERT INTO api_keys (id, name, secret_hash, prefix, org_id, scopes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [record.id, record.name, record.secretHash, record.prefix, record.orgId, JSON.stringify(record.scopes), record.createdAt]
  );
  return { record, secret };
}

export async function savePackageWithLogPg(
  pkg: ProofPackage,
  log: { index: number; timestamp: string; leafHashHex: string }
): Promise<void> {
  const p = await getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO packages (id, org_id, device_id, created_at, audio_content_hash, manifest, signature_b64u, public_key_pem, key_fingerprint, time_attestation, disclaimer, audio_stored)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [pkg.id, pkg.orgId, pkg.deviceId ?? null, pkg.createdAt, pkg.audioContentHash, JSON.stringify(pkg.manifest),
        pkg.signatureB64u, pkg.publicKeyPem, pkg.keyFingerprint,
        pkg.timeAttestation ? JSON.stringify(pkg.timeAttestation) : null, pkg.disclaimer, pkg.audioStored ?? false]
    );
    await client.query(
      `INSERT INTO log_entries (idx, ts, package_id, content_hash, key_fingerprint, leaf_hash_hex) VALUES ($1,$2,$3,$4,$5,$6)`,
      [log.index, log.timestamp, pkg.id, pkg.audioContentHash, pkg.keyFingerprint, log.leafHashHex]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function pgHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const p = await getPool();
    await p.query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

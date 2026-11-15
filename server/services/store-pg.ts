/**
 * Postgres-backed store (WP-2). DATABASE_URL activates PG.
 * Log source of truth: log_entries; package + leaf in ONE transaction.
 */
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiKeyRecord, DeviceRecord, ProofPackage } from './store.ts';
import { computeLeafHashHex, type LogEntry } from './transparency-log.ts';
import { computeRootFromLeafHashes, inclusionProof } from '../../packages/attest-crypto/src/merkle.ts';

type QueryResult<T = Record<string, unknown>> = { rows: T[]; rowCount: number | null };
export interface PgPool {
  query: (text: string, params?: unknown[]) => Promise<QueryResult>;
  connect: () => Promise<{ query: (text: string, params?: unknown[]) => Promise<QueryResult>; release: () => void }>;
}
let pool: PgPool | null = null;

export function isPgEnabled(): boolean { return Boolean(process.env.DATABASE_URL); }

export async function getPool(): Promise<PgPool> {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const pg = await import('pg');
  const Pool = pg.default?.Pool ?? pg.Pool;
  pool = new Pool({ connectionString: process.env.DATABASE_URL }) as PgPool;
  return pool;
}

export async function migrate(): Promise<void> {
  const p = await getPool();
  await p.query(readFileSync(join(process.cwd(), 'migrations', '001_init.sql'), 'utf8'));
}

function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}
function mapKey(r: Record<string, unknown>): ApiKeyRecord {
  return {
    id: r.id as string, name: r.name as string, secretHash: r.secret_hash as string,
    prefix: r.prefix as string, orgId: r.org_id as string,
    scopes: r.scopes as ApiKeyRecord['scopes'], createdAt: String(r.created_at),
    revokedAt: r.revoked_at ? String(r.revoked_at) : undefined,
  };
}

export async function createApiKeyPg(params: { name: string; orgId?: string; scopes?: ApiKeyRecord['scopes'] }) {
  const p = await getPool();
  const secret = `esk_live_${crypto.randomBytes(24).toString('base64url')}`;
  const record: ApiKeyRecord = {
    id: `key_${crypto.randomBytes(8).toString('hex')}`, name: params.name,
    secretHash: hashSecret(secret), prefix: secret.slice(0, 16) + '\u2026',
    orgId: params.orgId ?? 'org_default', scopes: params.scopes ?? ['attest:sign', 'attest:read'],
    createdAt: new Date().toISOString(),
  };
  await p.query(
    `INSERT INTO api_keys (id, name, secret_hash, prefix, org_id, scopes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [record.id, record.name, record.secretHash, record.prefix, record.orgId, JSON.stringify(record.scopes), record.createdAt]
  );
  return { record, secret };
}

export async function findApiKeyBySecretPg(secret: string): Promise<ApiKeyRecord | null> {
  const p = await getPool();
  const { rows } = await p.query(`SELECT * FROM api_keys WHERE secret_hash = $1 AND revoked_at IS NULL LIMIT 1`, [hashSecret(secret)]);
  return rows[0] ? mapKey(rows[0]) : null;
}

export async function listApiKeysPg(orgId?: string) {
  const p = await getPool();
  const { rows } = orgId
    ? await p.query(`SELECT * FROM api_keys WHERE org_id = $1 ORDER BY created_at DESC`, [orgId])
    : await p.query(`SELECT * FROM api_keys ORDER BY created_at DESC`);
  return rows.map((r) => { const k = mapKey(r); const { secretHash: _, ...rest } = k; return rest; });
}

export async function revokeApiKeyPg(id: string): Promise<boolean> {
  const p = await getPool();
  const { rowCount } = await p.query(`UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function registerDevicePg(params: { orgId?: string; label: string; publicKeyPem?: string; fingerprint?: string }): Promise<DeviceRecord> {
  const p = await getPool();
  const record: DeviceRecord = {
    id: `dev_${crypto.randomBytes(8).toString('hex')}`, orgId: params.orgId ?? 'org_default',
    label: params.label, publicKeyPem: params.publicKeyPem, fingerprint: params.fingerprint,
    createdAt: new Date().toISOString(), status: 'active',
  };
  await p.query(
    `INSERT INTO devices (id, org_id, label, public_key_pem, fingerprint, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [record.id, record.orgId, record.label, record.publicKeyPem ?? null, record.fingerprint ?? null, record.status, record.createdAt]
  );
  return record;
}

export async function listDevicesPg(orgId?: string): Promise<DeviceRecord[]> {
  const p = await getPool();
  const { rows } = orgId
    ? await p.query(`SELECT * FROM devices WHERE org_id = $1 ORDER BY created_at DESC`, [orgId])
    : await p.query(`SELECT * FROM devices ORDER BY created_at DESC`);
  return rows.map((r) => ({
    id: r.id as string, orgId: r.org_id as string, label: r.label as string,
    publicKeyPem: (r.public_key_pem as string) || undefined, fingerprint: (r.fingerprint as string) || undefined,
    createdAt: String(r.created_at), status: (r.status as DeviceRecord['status']) || 'active',
  }));
}

function mapPackage(r: Record<string, unknown>): ProofPackage {
  return {
    id: r.id as string, orgId: r.org_id as string, deviceId: (r.device_id as string) || undefined,
    createdAt: String(r.created_at), audioContentHash: r.audio_content_hash as string, manifest: r.manifest,
    signatureB64u: r.signature_b64u as string, publicKeyPem: r.public_key_pem as string,
    keyFingerprint: r.key_fingerprint as string, timeAttestation: r.time_attestation,
    disclaimer: (r.disclaimer as string) || '', audioStored: Boolean(r.audio_stored),
  };
}

export async function getPackagePg(id: string): Promise<ProofPackage | null> {
  const p = await getPool();
  const { rows } = await p.query(`SELECT * FROM packages WHERE id = $1`, [id]);
  return rows[0] ? mapPackage(rows[0]) : null;
}

export async function listPackagesPg(limit = 100): Promise<ProofPackage[]> {
  const p = await getPool();
  const { rows } = await p.query(`SELECT * FROM packages ORDER BY created_at DESC LIMIT $1`, [limit]);
  return rows.map(mapPackage);
}

/** Atomic package + log leaf; monotonic idx under advisory xact lock. */
export async function savePackageWithLogPg(pkg: ProofPackage): Promise<{
  entry: LogEntry; rootHex: string; treeSize: number; proof: { side: 'L' | 'R'; hash: string }[];
}> {
  const p = await getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(87236401)');
    const { rows: maxRows } = await client.query(`SELECT COALESCE(MAX(idx), -1)::int AS max_idx FROM log_entries`);
    const nextIdx = Number(maxRows[0]?.max_idx ?? -1) + 1;
    const timestamp = pkg.createdAt || new Date().toISOString();
    const leafHashHex = computeLeafHashHex({
      packageId: pkg.id, contentHash: pkg.audioContentHash,
      keyFingerprint: pkg.keyFingerprint, timestamp,
    });
    await client.query(
      `INSERT INTO packages (id, org_id, device_id, created_at, audio_content_hash, manifest,
        signature_b64u, public_key_pem, key_fingerprint, time_attestation, disclaimer, audio_stored)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [pkg.id, pkg.orgId, pkg.deviceId ?? null, timestamp, pkg.audioContentHash, JSON.stringify(pkg.manifest),
        pkg.signatureB64u, pkg.publicKeyPem, pkg.keyFingerprint,
        pkg.timeAttestation ? JSON.stringify(pkg.timeAttestation) : null, pkg.disclaimer, pkg.audioStored ?? false]
    );
    await client.query(
      `INSERT INTO log_entries (idx, ts, package_id, content_hash, key_fingerprint, leaf_hash_hex)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [nextIdx, timestamp, pkg.id, pkg.audioContentHash, pkg.keyFingerprint, leafHashHex]
    );
    const { rows: leafRows } = await client.query(`SELECT idx, leaf_hash_hex FROM log_entries ORDER BY idx ASC`);
    await client.query('COMMIT');
    const hashes = leafRows.map((r) => Buffer.from(r.leaf_hash_hex as string, 'hex'));
    const inc = inclusionProof(hashes, nextIdx);
    return {
      entry: {
        index: nextIdx, timestamp, packageId: pkg.id,
        contentHash: pkg.audioContentHash, keyFingerprint: pkg.keyFingerprint, leafHashHex,
      },
      rootHex: inc.root.toString('hex'),
      treeSize: hashes.length,
      proof: inc.path.map((s) => ({ side: s.side, hash: s.hash.toString('hex') })),
    };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* */ }
    throw err;
  } finally {
    client.release();
  }
}

export async function loadLogEntriesPg(): Promise<LogEntry[]> {
  const p = await getPool();
  const { rows } = await p.query(
    `SELECT idx, ts, package_id, content_hash, key_fingerprint, leaf_hash_hex FROM log_entries ORDER BY idx ASC`
  );
  return rows.map((r) => ({
    index: Number(r.idx), timestamp: String(r.ts), packageId: r.package_id as string,
    contentHash: r.content_hash as string, keyFingerprint: r.key_fingerprint as string,
    leafHashHex: r.leaf_hash_hex as string,
  }));
}

export async function currentRootPg() {
  const entries = await loadLogEntriesPg();
  const hashes = entries.map((e) => Buffer.from(e.leafHashHex, 'hex'));
  return { treeSize: entries.length, rootHex: computeRootFromLeafHashes(hashes).toString('hex') };
}

export async function pgHealth() {
  try { await (await getPool()).query('SELECT 1'); return { ok: true as const }; }
  catch (err) { return { ok: false as const, error: err instanceof Error ? err.message : String(err) }; }
}

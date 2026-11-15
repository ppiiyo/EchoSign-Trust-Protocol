/**
 * Append-only transparency log (WP-2).
 * File mode: JSONL under data/log/ with exclusive lock + fsync.
 * Consistency (single-node): full recompute, not logarithmic RFC6962 path.
 */
import {
  existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync, readdirSync,
  openSync, closeSync, unlinkSync, fsyncSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  hashLeaf, computeRootFromLeafHashes, inclusionProof, verifyInclusion, consistencyCheck,
} from '../../packages/attest-crypto/src/merkle.ts';

export interface LogEntry {
  index: number;
  timestamp: string;
  packageId: string;
  contentHash: string;
  keyFingerprint: string;
  leafHashHex: string;
}

export interface LogRootSnapshot {
  date: string;
  treeSize: number;
  rootHex: string;
  publishedAt: string;
}

function logDir(): string {
  const base = process.env.ATTEST_DATA_DIR || join(process.cwd(), 'data');
  return join(base, 'log');
}
function entriesPath(): string { return join(logDir(), 'entries.jsonl'); }
function lockPath(): string { return join(logDir(), '.entries.lock'); }
function rootsDir(): string { return join(logDir(), 'roots'); }
function ensureDirs(): void {
  mkdirSync(logDir(), { recursive: true });
  mkdirSync(rootsDir(), { recursive: true });
}

function withFileLogLock<T>(fn: () => T): T {
  ensureDirs();
  const lp = lockPath();
  const deadline = Date.now() + 10_000;
  let fd = -1;
  while (Date.now() < deadline) {
    try { fd = openSync(lp, 'wx'); break; }
    catch { const s = Date.now(); while (Date.now() - s < 15) { /* spin */ } }
  }
  if (fd < 0) throw new Error('transparency-log: could not acquire file lock');
  try { return fn(); }
  finally {
    try { closeSync(fd); } catch { /* */ }
    try { unlinkSync(lp); } catch { /* */ }
  }
}

export function leafPayload(entry: {
  packageId: string; contentHash: string; keyFingerprint: string; timestamp: string;
}): Buffer {
  return Buffer.from(JSON.stringify({
    packageId: entry.packageId,
    contentHash: entry.contentHash,
    keyFingerprint: entry.keyFingerprint,
    timestamp: entry.timestamp,
  }), 'utf8');
}

export function computeLeafHashHex(entry: {
  packageId: string; contentHash: string; keyFingerprint: string; timestamp: string;
}): string {
  return hashLeaf(leafPayload(entry)).toString('hex');
}

export function loadEntries(): LogEntry[] {
  ensureDirs();
  const path = entriesPath();
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line) as LogEntry);
}

function leafHashesFrom(entries: LogEntry[]): Buffer[] {
  return entries.map((e) => Buffer.from(e.leafHashHex, 'hex'));
}

export function currentRoot(entries?: LogEntry[]): { treeSize: number; rootHex: string } {
  const list = entries ?? loadEntries();
  return { treeSize: list.length, rootHex: computeRootFromLeafHashes(leafHashesFrom(list)).toString('hex') };
}

export function appendPackageLeaf(input: {
  packageId: string; contentHash: string; keyFingerprint: string; timestamp?: string;
}): {
  entry: LogEntry; rootHex: string; treeSize: number;
  proof: { side: 'L' | 'R'; hash: string }[];
} {
  return withFileLogLock(() => {
    const existing = loadEntries();
    const timestamp = input.timestamp ?? new Date().toISOString();
    const provisional = {
      packageId: input.packageId,
      contentHash: input.contentHash,
      keyFingerprint: input.keyFingerprint,
      timestamp,
    };
    const leafHashHex = computeLeafHashHex(provisional);
    const entry: LogEntry = {
      index: existing.length,
      timestamp,
      packageId: input.packageId,
      contentHash: input.contentHash,
      keyFingerprint: input.keyFingerprint,
      leafHashHex,
    };
    appendFileSync(entriesPath(), JSON.stringify(entry) + '\n');
    try {
      const fd = openSync(entriesPath(), 'r+');
      fsyncSync(fd);
      closeSync(fd);
    } catch { /* */ }
    const all = [...existing, entry];
    const hashes = leafHashesFrom(all);
    const inc = inclusionProof(hashes, entry.index);
    return {
      entry,
      rootHex: inc.root.toString('hex'),
      treeSize: all.length,
      proof: inc.path.map((s) => ({ side: s.side, hash: s.hash.toString('hex') })),
    };
  });
}

export function getInclusionProof(index: number) {
  const entries = loadEntries();
  if (index < 0 || index >= entries.length) return null;
  const hashes = leafHashesFrom(entries);
  const inc = inclusionProof(hashes, index);
  return {
    entry: entries[index],
    rootHex: inc.root.toString('hex'),
    treeSize: entries.length,
    proof: inc.path.map((s) => ({ side: s.side, hash: s.hash.toString('hex') })),
  };
}

export function verifyEntryInclusion(
  entry: LogEntry,
  proof: { side: 'L' | 'R'; hash: string }[],
  rootHex: string
): boolean {
  const leaf = Buffer.from(entry.leafHashHex, 'hex');
  const steps = proof.map((p) => ({ side: p.side, hash: Buffer.from(p.hash, 'hex') }));
  // merkle.verifyInclusion(leafHash, path, expectedRoot)
  return verifyInclusion(leaf, steps, Buffer.from(rootHex, 'hex'));
}

/** Single-node: recompute root from leaves (O(n)), not logarithmic consistency proof. */
export function checkConsistency(oldSize: number, oldRootHex: string): boolean {
  const entries = loadEntries();
  if (oldSize > entries.length) return false;
  const oldHashes = leafHashesFrom(entries.slice(0, oldSize));
  const recomputed = computeRootFromLeafHashes(oldHashes).toString('hex');
  if (recomputed !== oldRootHex) return false;
  const newRootHex = computeRootFromLeafHashes(leafHashesFrom(entries)).toString('hex');
  return consistencyCheck(leafHashesFrom(entries), oldSize, oldRootHex, newRootHex);
}

export function publishDailyRoot(date = new Date().toISOString().slice(0, 10)): LogRootSnapshot {
  ensureDirs();
  const { treeSize, rootHex } = currentRoot();
  const snap: LogRootSnapshot = { date, treeSize, rootHex, publishedAt: new Date().toISOString() };
  writeFileSync(join(rootsDir(), `${date}.json`), JSON.stringify(snap, null, 2));
  writeFileSync(join(logDir(), 'root-latest.json'), JSON.stringify(snap, null, 2));
  return snap;
}

export function getPublishedRoot(date: string): LogRootSnapshot | null {
  const path = join(rootsDir(), `${date}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as LogRootSnapshot;
}

export function getLatestPublishedRoot(): LogRootSnapshot | null {
  const path = join(logDir(), 'root-latest.json');
  if (!existsSync(path)) {
    const { treeSize } = currentRoot();
    if (treeSize === 0) return null;
    return publishDailyRoot();
  }
  return JSON.parse(readFileSync(path, 'utf8')) as LogRootSnapshot;
}

export function listPublishedRootDates(): string[] {
  ensureDirs();
  return readdirSync(rootsDir()).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
}

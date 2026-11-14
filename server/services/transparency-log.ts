import {
  existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync, readdirSync,
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
function rootsDir(): string { return join(logDir(), 'roots'); }
function ensureDirs(): void {
  mkdirSync(logDir(), { recursive: true });
  mkdirSync(rootsDir(), { recursive: true });
}
function leafPayload(entry: Omit<LogEntry, 'index' | 'leafHashHex'>): Buffer {
  return Buffer.from(JSON.stringify({
    packageId: entry.packageId,
    contentHash: entry.contentHash,
    keyFingerprint: entry.keyFingerprint,
    timestamp: entry.timestamp,
  }), 'utf8');
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
  ensureDirs();
  const existing = loadEntries();
  const timestamp = input.timestamp ?? new Date().toISOString();
  const provisional = {
    packageId: input.packageId,
    contentHash: input.contentHash,
    keyFingerprint: input.keyFingerprint,
    timestamp,
  };
  const leafHash = hashLeaf(leafPayload(provisional));
  const entry: LogEntry = {
    index: existing.length,
    timestamp,
    packageId: input.packageId,
    contentHash: input.contentHash,
    keyFingerprint: input.keyFingerprint,
    leafHashHex: leafHash.toString('hex'),
  };
  appendFileSync(entriesPath(), JSON.stringify(entry) + '\n', { mode: 0o600 });
  const all = [...existing, entry];
  const hashes = leafHashesFrom(all);
  const { path, root } = inclusionProof(hashes, entry.index);
  return {
    entry,
    rootHex: root.toString('hex'),
    treeSize: all.length,
    proof: path.map((p) => ({ side: p.side, hash: p.hash.toString('hex') })),
  };
}

export function getInclusionProof(index: number) {
  const entries = loadEntries();
  if (index < 0 || index >= entries.length) return null;
  const hashes = leafHashesFrom(entries);
  const { path, root } = inclusionProof(hashes, index);
  return {
    entry: entries[index],
    rootHex: root.toString('hex'),
    treeSize: entries.length,
    proof: path.map((p) => ({ side: p.side, hash: p.hash.toString('hex') })),
  };
}

export function verifyEntryInclusion(index: number): boolean {
  const got = getInclusionProof(index);
  if (!got) return false;
  return verifyInclusion(Buffer.from(got.entry.leafHashHex, 'hex'), got.proof, got.rootHex);
}

export function checkConsistency(oldSize: number, oldRootHex: string): boolean {
  const entries = loadEntries();
  const { rootHex } = currentRoot(entries);
  return consistencyCheck(leafHashesFrom(entries), oldSize, oldRootHex, rootHex);
}

export function publishDailyRoot(dateUtc?: string): LogRootSnapshot {
  ensureDirs();
  const date = dateUtc ?? new Date().toISOString().slice(0, 10);
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

/**
 * WP-2: concurrent file-log appends — lock protocol + unique monotonic idx.
 */
import {
  existsSync, mkdirSync, readFileSync, appendFileSync, openSync, closeSync, unlinkSync, fsyncSync, rmSync, mkdtempSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';

const dir = mkdtempSync(join(tmpdir(), 'echosign-log-'));
const logDir = join(dir, 'log');
const entriesPath = join(logDir, 'entries.jsonl');
const lockPath = join(logDir, '.entries.lock');
mkdirSync(logDir, { recursive: true });

function withLock(fn) {
  const deadline = Date.now() + 10_000;
  let fd = -1;
  while (Date.now() < deadline) {
    try {
      fd = openSync(lockPath, 'wx');
      break;
    } catch {
      const s = Date.now();
      while (Date.now() - s < 5) {}
    }
  }
  if (fd < 0) throw new Error('lock timeout');
  try {
    return fn();
  } finally {
    try { closeSync(fd); } catch {}
    try { unlinkSync(lockPath); } catch {}
  }
}

function load() {
  if (!existsSync(entriesPath)) return [];
  return readFileSync(entriesPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function append(i) {
  return withLock(() => {
    const existing = load();
    const entry = {
      index: existing.length,
      packageId: `pkg_${i}`,
      contentHash: crypto.createHash('sha256').update(String(i)).digest('hex'),
    };
    appendFileSync(entriesPath, JSON.stringify(entry) + '\n');
    try {
      const f = openSync(entriesPath, 'r+');
      fsyncSync(f);
      closeSync(f);
    } catch {}
    return entry;
  });
}

const jobs = [];
for (let i = 0; i < 50; i++) {
  jobs.push(Promise.resolve().then(() => append(i)));
}
const results = await Promise.all(jobs);
const indexes = results.map((r) => r.index).sort((a, b) => a - b);
if (new Set(indexes).size !== 50) {
  console.error('FAIL duplicates', indexes);
  process.exit(1);
}
for (let i = 0; i < 50; i++) {
  if (indexes[i] !== i) {
    console.error('FAIL gap', indexes);
    process.exit(1);
  }
}
if (load().length !== 50) {
  console.error('FAIL count');
  process.exit(1);
}
rmSync(dir, { recursive: true, force: true });
console.log('OK concurrent file-log lock protocol', { n: 50 });

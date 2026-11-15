#!/usr/bin/env node
/**
 * WP-7: run all pure-node selftests. Any failure fails CI (no soft-gate).
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)));
const files = readdirSync(dir)
  .filter((f) => f.startsWith('selftest-') && f.endsWith('.mjs'))
  .sort();

if (files.length === 0) {
  console.error('No selftests found');
  process.exit(1);
}

let failed = 0;
for (const f of files) {
  const path = join(dir, f);
  process.stdout.write(`\n── ${f} ──\n`);
  const r = spawnSync(process.execPath, [path], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) {
    console.error(`FAIL ${f} exit=${r.status}`);
    failed += 1;
  }
}

if (failed) {
  console.error(`\n${failed}/${files.length} selftests failed`);
  process.exit(1);
}
console.log(`\nOK all ${files.length} selftests passed`);

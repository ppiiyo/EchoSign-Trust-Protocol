#!/usr/bin/env node
import crypto from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const H = (d) => crypto.createHash('sha256').update(d).digest();
const hashLeaf = (data) => H(Buffer.concat([Buffer.from([0x00]), data]));
const hashNode = (l, r) => H(Buffer.concat([Buffer.from([0x01]), l, r]));
function computeRoot(leafHashes) {
  if (leafHashes.length === 0) return H(Buffer.from('EMPTY_MERKLE_ROOT_V1'));
  let level = leafHashes.map((h) => Buffer.from(h));
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 === level.length) next.push(level[i]);
      else next.push(hashNode(level[i], level[i + 1]));
    }
    level = next;
  }
  return level[0];
}
function inclusionProof(leafHashes, index) {
  const path = [];
  let level = leafHashes.map((h) => Buffer.from(h));
  let idx = index;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 === level.length) next.push(level[i]);
      else {
        next.push(hashNode(level[i], level[i + 1]));
        if (idx === i) path.push({ side: 'R', hash: Buffer.from(level[i + 1]) });
        else if (idx === i + 1) path.push({ side: 'L', hash: Buffer.from(level[i]) });
      }
    }
    idx = Math.floor(idx / 2);
    level = next;
  }
  return { root: level[0], path };
}
function verifyInclusion(leafHash, path, expectedRoot) {
  let acc = Buffer.from(leafHash);
  for (const step of path) {
    acc = step.side === 'L' ? hashNode(step.hash, acc) : hashNode(acc, step.hash);
  }
  return acc.equals(expectedRoot);
}
const leaves = ['a', 'b', 'c', 'd'].map((s) => hashLeaf(Buffer.from(s)));
const root1 = computeRoot(leaves);
if (!root1.equals(computeRoot(leaves))) throw new Error('unstable');
const { root, path } = inclusionProof(leaves, 2);
if (!verifyInclusion(leaves[2], path, root)) throw new Error('inclusion');
const tampered = leaves.map((h) => Buffer.from(h));
tampered[2] = hashLeaf(Buffer.from('TAMPER'));
if (verifyInclusion(tampered[2], inclusionProof(tampered, 2).path, root1)) throw new Error('tamper');
const dir = mkdtempSync(join(tmpdir(), 'log-'));
mkdirSync(dir, { recursive: true });
const pathFile = join(dir, 'entries.jsonl');
const entries = [];
for (const id of ['pkg1', 'pkg2', 'pkg3']) {
  const lh = hashLeaf(Buffer.from(JSON.stringify({ packageId: id })));
  const entry = { index: entries.length, packageId: id, leafHashHex: lh.toString('hex') };
  entries.push(entry);
  appendFileSync(pathFile, JSON.stringify(entry) + '\n');
}
if (readFileSync(pathFile, 'utf8').trim().split('\n').length !== 3) throw new Error('reload');
rmSync(dir, { recursive: true, force: true });
console.log('SELFTEST MERKLE LOG OK');

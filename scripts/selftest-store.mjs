#!/usr/bin/env node
import crypto from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const k of Object.keys(value).sort()) sorted[k] = sortKeys(value[k]);
    return sorted;
  }
  return value;
}
const canonicalJson = (v) => JSON.stringify(sortKeys(v));
function assert(c, m) { if (!c) throw new Error(m); }

const dir = mkdtempSync(join(tmpdir(), 'es-self-'));
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
const spki = publicKey.export({ type: 'spki', format: 'der' });
const fp = crypto.createHash('sha256').update(spki.subarray(spki.length - 32)).digest('hex').slice(0, 16);

const audio = Buffer.from('selftest-audio');
const contentHash = crypto.createHash('sha256').update(audio).digest('hex');
const manifest = {
  version: '1', contentHash,
  capture: { startedAt: new Date().toISOString(), endedAt: new Date().toISOString() },
  timestamps: { serverReceivedAt: new Date().toISOString() },
  signer: { keyFingerprint: fp, orgId: 'org_test' },
};
const canonical = canonicalJson(manifest);
const sig = crypto.sign(null, Buffer.from(canonical, 'utf8'), privateKey).toString('base64url');
assert(crypto.verify(null, Buffer.from(canonical, 'utf8'), publicKey, Buffer.from(sig, 'base64url')), 'sig');

const bad = { ...manifest, contentHash: 'ff'.repeat(32) };
assert(!crypto.verify(null, Buffer.from(canonicalJson(bad), 'utf8'), publicKey, Buffer.from(sig, 'base64url')), 'tamper');

mkdirSync(join(dir, 'packages'), { recursive: true });
writeFileSync(join(dir, 'packages', 'pkg_self.json'), JSON.stringify({ id: 'pkg_self', manifest, signatureB64u: sig, publicKeyPem: pubPem, keyFingerprint: fp }));
const loaded = JSON.parse(readFileSync(join(dir, 'packages', 'pkg_self.json'), 'utf8'));
assert(loaded.keyFingerprint === fp, 'store');

rmSync(dir, { recursive: true, force: true });
console.log('SELFTEST OK');

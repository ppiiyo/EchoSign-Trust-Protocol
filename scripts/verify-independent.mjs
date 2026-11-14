#!/usr/bin/env node
/**
 * Independent offline verifier for EchoSign Attest proof bundles.
 * Usage: node scripts/verify-independent.mjs <manifest.json> <signature.b64u> <public.pem>
 * Exit: 0=valid, 1=invalid, 2=usage/file error
 * Depends only on Node built-ins.
 */
import { readFileSync } from 'node:fs';
import { createPublicKey, verify, createHash } from 'node:crypto';

function usage() {
  console.error('Usage: node verify-independent.mjs <manifest.json> <signature.b64u> <public.pem>');
  process.exit(2);
}

function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const k of Object.keys(value).sort()) sorted[k] = sortKeys(value[k]);
    return sorted;
  }
  return value;
}

const [,, manifestPath, sigPath, pubPath] = process.argv;
if (!manifestPath || !sigPath || !pubPath) usage();

let manifest, signatureB64u, publicPem;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  signatureB64u = readFileSync(sigPath, 'utf8').trim();
  publicPem = readFileSync(pubPath, 'utf8');
} catch (err) {
  console.error('File error:', err.message);
  process.exit(2);
}

const canonical = canonicalJson(manifest);
const contentHash = createHash('sha256').update(canonical, 'utf8').digest('hex');
const key = createPublicKey(publicPem);
const signature = Buffer.from(signatureB64u, 'base64url');
const valid = verify(null, Buffer.from(canonical, 'utf8'), key, signature);

console.log('Manifest content hash :', contentHash);
console.log('Signature valid       :', valid);
if (manifest.contentHash) console.log('Declared audio hash   :', manifest.contentHash);

if (!valid) {
  console.error('FAIL: signature does not match manifest');
  process.exit(1);
}
console.log('OK: signature verifies under the provided public key');
process.exit(0);

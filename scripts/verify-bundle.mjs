#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { createPublicKey, verify, createHash } from 'node:crypto';

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
function hashNode(left, right) {
  return createHash('sha256').update(Buffer.concat([Buffer.from([0x01]), left, right])).digest();
}
function verifyInclusion(leafHash, path, expectedRootHex) {
  let acc = Buffer.from(leafHash);
  for (const step of path) {
    const sib = Buffer.from(step.hash, 'hex');
    acc = step.side === 'L' ? hashNode(sib, acc) : hashNode(acc, sib);
  }
  return acc.toString('hex') === expectedRootHex.toLowerCase();
}
function tsaStructural(tokenB64, imprintHex) {
  if (!tokenB64 || !imprintHex) return { checked: false };
  const buf = Buffer.from(tokenB64, 'base64');
  if (buf.length < 32 || buf[0] !== 0x30) return { checked: true, ok: false, reason: 'token not DER SEQUENCE' };
  const imprint = Buffer.from(imprintHex, 'hex');
  if (!buf.includes(imprint)) return { checked: true, ok: false, reason: 'imprint not in token' };
  return { checked: true, ok: true, reason: 'structural only — openssl ts -verify for full PKI' };
}

const args = process.argv.slice(2);
const flags = { json: args.includes('--json'), expectRoot: null, proofPath: null };
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--json') continue;
  if (args[i] === '--expect-root') { flags.expectRoot = args[++i]; continue; }
  if (args[i] === '--proof') { flags.proofPath = args[++i]; continue; }
  pos.push(args[i]);
}
if (pos.length < 1) {
  console.error('Usage: node scripts/verify-bundle.mjs <bundle.esatt.json> [--expect-root HEX] [--proof proof.json] [--json]');
  process.exit(2);
}

let manifest, signatureB64u, publicPem, timeAttestation, logMeta, packageId;
if (pos.length === 1) {
  const bundle = JSON.parse(readFileSync(pos[0], 'utf8'));
  manifest = bundle.manifest; signatureB64u = bundle.signatureB64u; publicPem = bundle.publicKeyPem;
  timeAttestation = bundle.timeAttestation; logMeta = bundle.log; packageId = bundle.packageId;
  if (!manifest || !signatureB64u || !publicPem) { console.error('Bundle incomplete'); process.exit(2); }
} else if (pos.length >= 3) {
  manifest = JSON.parse(readFileSync(pos[0], 'utf8'));
  signatureB64u = readFileSync(pos[1], 'utf8').trim();
  publicPem = readFileSync(pos[2], 'utf8');
} else { process.exit(2); }

const canonical = canonicalJson(manifest);
const contentHash = createHash('sha256').update(canonical, 'utf8').digest('hex');
const sigValid = verify(null, Buffer.from(canonical, 'utf8'), createPublicKey(publicPem), Buffer.from(signatureB64u, 'base64url'));
const result = {
  valid: sigValid, packageId: packageId || null, contentHash, signatureValid: sigValid,
  claims: {
    proves: 'Integrity of the signed manifest (and referenced audio contentHash) at signing time',
    doesNotProve: ['That a human was speaking', 'Deepfake / AI detection', 'Legal certification or chain-of-custody by itself'],
  },
  timeAttestation: null, logInclusion: null,
};
if (timeAttestation) {
  result.timeAttestation = {
    clockSource: timeAttestation.clockSource,
    tsaStatus: timeAttestation.tsa?.status,
    otsStatus: timeAttestation.ots?.status,
    tsaStructural: tsaStructural(timeAttestation.tsa?.tokenB64, timeAttestation.tsa?.imprintHex || timeAttestation.contentHashHex),
  };
}
let proof = logMeta?.inclusionProof ? { path: logMeta.inclusionProof, leafHashHex: logMeta.leafHashHex } : null;
if (flags.proofPath && existsSync(flags.proofPath)) proof = JSON.parse(readFileSync(flags.proofPath, 'utf8'));
const rootHex = flags.expectRoot || logMeta?.rootHex;
if (proof && rootHex && proof.leafHashHex) {
  const ok = verifyInclusion(Buffer.from(proof.leafHashHex, 'hex'), proof.path || proof.inclusionProof || [], rootHex);
  result.logInclusion = { checked: true, ok, rootHex, leafHashHex: proof.leafHashHex };
  if (!ok) result.valid = false;
}
if (flags.json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(sigValid ? 'SIGNATURE: VALID' : 'SIGNATURE: INVALID');
  console.log('contentHash:', contentHash);
  if (result.timeAttestation) console.log('time:', result.timeAttestation.clockSource, 'tsa=', result.timeAttestation.tsaStatus, 'ots=', result.timeAttestation.otsStatus);
  if (result.logInclusion?.checked) console.log('log inclusion:', result.logInclusion.ok ? 'OK' : 'FAIL');
  console.log('Proves:', result.claims.proves);
  console.log('Does NOT prove:', result.claims.doesNotProve.join('; '));
}
process.exit(result.valid ? 0 : 1);

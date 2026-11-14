#!/usr/bin/env node
/**
 * End-to-end demo: generate key → sign manifest → verify.
 * Usage: node scripts/demo-sign-verify.mjs
 * Writes ./tmp-demo/ for use with verify-independent.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash, generateKeyPairSync, sign as nodeSign, verify as nodeVerify } from 'node:crypto';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'tmp-demo');
mkdirSync(outDir, { recursive: true });

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

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const spkiDer = publicKey.export({ type: 'spki', format: 'der' });
const rawPub = spkiDer.subarray(spkiDer.length - 32);
const fingerprint = createHash('sha256').update(rawPub).digest('hex').slice(0, 16);

const audioHash = createHash('sha256').update('demo-audio-pcm-bytes').digest('hex');
const manifest = {
  version: '1',
  contentHash: audioHash,
  capture: {
    startedAt: new Date(Date.now() - 5000).toISOString(),
    endedAt: new Date().toISOString(),
    sampleRate: 16000,
    channels: 1,
  },
  timestamps: { serverReceivedAt: new Date().toISOString() },
  signer: {
    keyFingerprint: fingerprint,
    orgId: 'org_demo',
    deviceId: 'dev_demo_01',
  },
};

const canonical = canonicalJson(manifest);
const contentHash = createHash('sha256').update(canonical, 'utf8').digest('hex');
const signature = nodeSign(null, Buffer.from(canonical, 'utf8'), privateKey);
const signatureB64u = signature.toString('base64url');
const ok = nodeVerify(null, Buffer.from(canonical, 'utf8'), publicKey, signature);

console.log('Fingerprint     :', fingerprint);
console.log('Manifest hash   :', contentHash);
console.log('Signature valid :', ok);

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(outDir, 'manifest.canonical.json'), canonical);
writeFileSync(join(outDir, 'signature.b64u'), signatureB64u);
writeFileSync(join(outDir, 'public.pem'), pubPem);
writeFileSync(join(outDir, 'private.pem'), privPem);

console.log('\nArtifacts written to', outDir);
console.log('Independent verify:');
console.log('  node scripts/verify-independent.mjs tmp-demo/manifest.json tmp-demo/signature.b64u tmp-demo/public.pem');
process.exit(ok ? 0 : 1);

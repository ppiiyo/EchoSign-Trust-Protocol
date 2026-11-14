#!/usr/bin/env node
const BASE = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:3000';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log('Smoke MVP →', BASE);
  const health = await req('/health');
  assert(health.status === 200 && health.body.status === 'ok', 'health failed');
  console.log('✓ health', health.body.version);

  const keyRes = await req('/api/v1/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'smoke' }),
  });
  assert(keyRes.status === 201 || keyRes.status === 200, 'key create failed');
  const secret = keyRes.body.secret;
  console.log('✓ api key');

  const wav = Buffer.alloc(44 + 1600);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + 1600, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22); wav.writeUInt32LE(16000, 24); wav.writeUInt32LE(32000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(1600, 40);

  const form = new FormData();
  form.append('file', new Blob([wav]), 'smoke.wav');
  const headers = secret ? { Authorization: `Bearer ${secret}` } : {};
  const sign = await req('/api/v1/attest/sign', { method: 'POST', headers, body: form });
  assert((sign.status === 201 || sign.status === 200) && sign.body.signatureB64u, `sign failed: ${JSON.stringify(sign.body)}`);
  console.log('✓ sign', sign.body.packageId);

  const verify = await req('/api/v1/attest/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      manifest: sign.body.manifest,
      signatureB64u: sign.body.signatureB64u,
      publicKeyPem: sign.body.publicKeyPem,
    }),
  });
  assert(verify.status === 200 && verify.body.valid === true, 'verify failed');
  console.log('✓ verify');

  if (sign.body.packageId) {
    const bundle = await req(`/api/v1/attest/packages/${sign.body.packageId}/bundle`);
    assert(bundle.status === 200, 'bundle failed');
    console.log('✓ bundle');
  }

  const jwks = await req('/api/v1/attest/jwks');
  assert(jwks.body.keys?.length >= 1, 'jwks empty');
  console.log('✓ jwks');
  console.log('\nSMOKE OK');
}

main().catch((e) => { console.error('SMOKE FAIL:', e.message); process.exit(1); });

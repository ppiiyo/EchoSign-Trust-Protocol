import { describe, it, expect } from 'vitest';
import {
  generateEd25519KeyPair,
  sign,
  verify,
  signManifest,
  verifyManifest,
  canonicalJson,
  generateTestVector,
  createManifestV1,
} from '../src/index.js';

describe('Ed25519 sign/verify', () => {
  it('generates a keypair and round-trips a signature', async () => {
    const kp = await generateEd25519KeyPair();
    expect(kp.privateKeyPem).toContain('PRIVATE KEY');
    expect(kp.publicKeyPem).toContain('PUBLIC KEY');
    expect(kp.fingerprint).toHaveLength(16);

    const payload = Buffer.from('hello echosign attest');
    const { signatureB64u, alg } = sign(kp.privateKeyPem, payload, kp.fingerprint);
    expect(alg).toBe('Ed25519');

    const ok = verify(kp.publicKeyPem, payload, signatureB64u);
    expect(ok.valid).toBe(true);

    const bad = verify(kp.publicKeyPem, Buffer.from('tampered'), signatureB64u);
    expect(bad.valid).toBe(false);
  });

  it('canonicalJson is deterministic and key-order independent', () => {
    const a = canonicalJson({ b: 1, a: { z: 3, y: 2 } });
    const b = canonicalJson({ a: { y: 2, z: 3 }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"y":2,"z":3},"b":1}');
  });

  it('signManifest / verifyManifest round-trip', async () => {
    const kp = await generateEd25519KeyPair();
    const manifest = createManifestV1({
      contentHash: 'abc123',
      capture: {
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: '2026-01-01T00:00:01.000Z',
      },
      timestamps: {},
      signer: { keyFingerprint: kp.fingerprint },
    });

    const { signatureB64u, contentHash } = signManifest(kp.privateKeyPem, manifest, kp.fingerprint);
    expect(contentHash).toHaveLength(64);

    const result = verifyManifest(kp.publicKeyPem, manifest, signatureB64u);
    expect(result.valid).toBe(true);
    expect(result.contentHash).toBe(contentHash);
  });

  it('test vector can be verified independently', async () => {
    const tv = await generateTestVector();
    const result = verifyManifest(
      tv.keyPair.publicKeyPem,
      tv.manifest,
      tv.signatureB64u
    );
    expect(result.valid).toBe(true);
  });
});

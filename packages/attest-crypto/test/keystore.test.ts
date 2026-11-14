import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EncryptedKeystore } from '../src/keystore.js';
import { sign, verify } from '../src/index.js';

describe('EncryptedKeystore', () => {
  let dir: string;
  let path: string;
  const passphrase = 'test-passphrase-at-least-16-chars';

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'echosign-ks-'));
    path = join(dir, 'keystore.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates, generates a key, signs and verifies', async () => {
    const ks = EncryptedKeystore.create({ path, passphrase });
    const { keyId, fingerprint, publicKeyPem } = await ks.generateKey({
      purpose: 'org-root',
      orgId: 'org_test',
    });

    expect(keyId).toContain(fingerprint);
    expect(publicKeyPem).toContain('PUBLIC KEY');

    const priv = ks.getPrivateKeyPem(keyId);
    const payload = Buffer.from('keystore round-trip');
    const { signatureB64u } = sign(priv, payload, fingerprint);
    const result = verify(publicKeyPem, payload, signatureB64u);
    expect(result.valid).toBe(true);
  });

  it('persists and reloads', async () => {
    const ks1 = EncryptedKeystore.create({ path, passphrase });
    const { keyId, publicKeyPem } = await ks1.generateKey({ purpose: 'device', deviceId: 'd1' });

    const ks2 = EncryptedKeystore.load({ path, passphrase });
    const priv = ks2.getPrivateKeyPem(keyId);
    const { signatureB64u } = sign(priv, 'reload-test', ks2.getRecord(keyId)!.fingerprint);
    expect(verify(publicKeyPem, 'reload-test', signatureB64u).valid).toBe(true);
  });

  it('rotate keeps old key decryptable, new key active', async () => {
    const ks = EncryptedKeystore.create({ path, passphrase });
    const old = await ks.generateKey({ purpose: 'org-root' });
    const neu = await ks.rotateKey(old.keyId);

    expect(ks.getRecord(old.keyId)!.status).toBe('rotated');
    expect(ks.getRecord(neu.keyId)!.status).toBe('active');

    const oldPriv = ks.getPrivateKeyPem(old.keyId);
    const { signatureB64u } = sign(oldPriv, 'historical', old.fingerprint);
    expect(verify(old.publicKeyPem, 'historical', signatureB64u).valid).toBe(true);
  });

  it('revoked key cannot be used via getPrivateKeyPem', async () => {
    const ks = EncryptedKeystore.create({ path, passphrase });
    const { keyId } = await ks.generateKey({ purpose: 'device' });
    ks.revokeKey(keyId, 'compromised');
    expect(() => ks.getPrivateKeyPem(keyId)).toThrow(/revoked/);
  });

  it('exports JWKS without private material', async () => {
    const ks = EncryptedKeystore.create({ path, passphrase });
    await ks.generateKey({ purpose: 'org-root' });
    const jwks = ks.toJwks();
    expect(jwks.keys.length).toBe(1);
    expect(jwks.keys[0].kty).toBe('OKP');
    expect(jwks.keys[0].crv).toBe('Ed25519');
    expect(jwks.keys[0].x).toBeTruthy();
    expect(JSON.stringify(jwks)).not.toMatch(/PRIVATE/);
  });
});

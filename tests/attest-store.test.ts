import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createApiKey, findApiKeyBySecret, registerDevice,
  savePackage, getPackage, listPackages, storeInit,
} from '../server/services/store';
import { attestSignAudio, attestVerify } from '../server/services/attest';

describe('MVP store + attest', () => {
  let dir: string;
  const prev = process.env.ATTEST_DATA_DIR;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'echosign-mvp-'));
    process.env.ATTEST_DATA_DIR = dir;
    process.env.DEMO_MODE = '1';
    process.env.KMS_MASTER_KEY = 'test-master-key-16chars-min';
  });

  afterAll(() => {
    if (prev !== undefined) process.env.ATTEST_DATA_DIR = prev;
    else delete process.env.ATTEST_DATA_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates and looks up API key', () => {
    const { record, secret } = createApiKey({ name: 'test' });
    expect(secret.startsWith('esk_live_')).toBe(true);
    expect(findApiKeyBySecret(secret)?.id).toBe(record.id);
    expect(findApiKeyBySecret('wrong')).toBeNull();
  });

  it('registers device', () => {
    const d = registerDevice({ label: 'Booth A' });
    expect(d.id).toMatch(/^dev_/);
  });

  it('signs audio and stores package', () => {
    const signed = attestSignAudio({ audioBuffer: Buffer.from('mvp-test-audio'), deviceId: 'dev_x' });
    expect(attestVerify({
      manifest: signed.manifest,
      signatureB64u: signed.signatureB64u,
      publicKeyPem: signed.publicKeyPem,
    }).valid).toBe(true);

    savePackage({
      id: 'pkg_test_1',
      orgId: 'org_default',
      createdAt: new Date().toISOString(),
      audioContentHash: signed.manifest.contentHash,
      manifest: signed.manifest,
      signatureB64u: signed.signatureB64u,
      publicKeyPem: signed.publicKeyPem,
      keyFingerprint: signed.keyFingerprint,
      disclaimer: 'test',
    });
    expect(getPackage('pkg_test_1')?.keyFingerprint).toBe(signed.keyFingerprint);
    expect(listPackages().length).toBeGreaterThanOrEqual(1);
    expect(storeInit().packageCount).toBeGreaterThanOrEqual(1);
  });

  it('rejects tampered manifest', () => {
    const signed = attestSignAudio({ audioBuffer: Buffer.from('abc') });
    const bad = { ...(signed.manifest as object), contentHash: '00'.repeat(32) };
    expect(attestVerify({
      manifest: bad,
      signatureB64u: signed.signatureB64u,
      publicKeyPem: signed.publicKeyPem,
    }).valid).toBe(false);
  });
});

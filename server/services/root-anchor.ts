/**
 * Daily log root anchor (WP-3 / D6).
 * Signs {date, treeSize, rootHex, publishedAt} with org Ed25519 key.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalJson, sign, verify, fingerprintFromPublicKeyPem } from '../../packages/attest-crypto/src/index.ts';
import { currentRoot, type LogRootSnapshot } from './transparency-log.ts';
import { ensureOrgKeystore } from './attest.ts';

export interface SignedLogRoot extends LogRootSnapshot {
  signatureB64u: string;
  keyFingerprint: string;
  publicKeyPem: string;
  payloadCanonical: string;
}

function rootsDir(): string {
  const base = process.env.ATTEST_DATA_DIR || join(process.cwd(), 'data');
  return join(base, 'log', 'roots');
}

export function publishAndSignDailyRoot(date = new Date().toISOString().slice(0, 10)): SignedLogRoot {
  const { treeSize, rootHex } = currentRoot();
  const publishedAt = new Date().toISOString();
  const payload = { date, treeSize, rootHex, publishedAt };
  const payloadCanonical = canonicalJson(payload);

  const ks = ensureOrgKeystore();
  const active = ks.listKeys({ purpose: 'org-root', status: 'active' });
  if (active.length === 0) throw new Error('no active org-root key to sign log root');
  const rec = active[0];
  const privatePem = ks.getPrivateKeyPem(rec.keyId);
  const publicKeyPem = rec.publicKeyPem;
  const keyFingerprint = rec.fingerprint || fingerprintFromPublicKeyPem(publicKeyPem);
  const { signatureB64u } = sign(privatePem, payloadCanonical, keyFingerprint);

  const signed: SignedLogRoot = {
    date, treeSize, rootHex, publishedAt,
    signatureB64u, keyFingerprint, publicKeyPem, payloadCanonical,
  };

  mkdirSync(rootsDir(), { recursive: true });
  writeFileSync(join(rootsDir(), `${date}.signed.json`), JSON.stringify(signed, null, 2));
  writeFileSync(
    join(process.env.ATTEST_DATA_DIR || join(process.cwd(), 'data'), 'log', 'root-latest.signed.json'),
    JSON.stringify(signed, null, 2)
  );
  return signed;
}

export function verifySignedRoot(signed: SignedLogRoot): boolean {
  const payload = {
    date: signed.date,
    treeSize: signed.treeSize,
    rootHex: signed.rootHex,
    publishedAt: signed.publishedAt,
  };
  const canonical = canonicalJson(payload);
  if (canonical !== signed.payloadCanonical) return false;
  return verify(signed.publicKeyPem, canonical, signed.signatureB64u).valid;
}

#!/usr/bin/env node
import crypto from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function deriveKey(passphrase, salt) {
  return crypto.scryptSync(passphrase, salt, 32);
}
function encryptPrivateKey(privateKeyPem, kek) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  const enc = Buffer.concat([cipher.update(privateKeyPem, 'utf8'), cipher.final()]);
  return { cipherB64: enc.toString('base64'), ivB64: iv.toString('base64'), tagB64: cipher.getAuthTag().toString('base64') };
}
function decryptPrivateKey(record, kek) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, Buffer.from(record.ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(record.tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(record.privateKeyCipherB64, 'base64')), decipher.final()]).toString('utf8');
}
function assertThrows(fn, re) {
  try { fn(); throw new Error('expected throw'); }
  catch (e) {
    if (e.message === 'expected throw') throw e;
    if (!re.test(String(e.message))) throw new Error('wrong error: ' + e.message);
  }
}

const dir = mkdtempSync(join(tmpdir(), 'loud-'));
const path = join(dir, 'keystore.json');
const passphrase = 'test-passphrase-16chars';
const salt = crypto.randomBytes(16);
const kek = deriveKey(passphrase, salt);
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const enc = encryptPrivateKey(privateKey.export({ type: 'pkcs8', format: 'pem' }), kek);
const file = {
  version: 1,
  saltB64: salt.toString('base64'),
  keys: [{
    keyId: 'key_org', fingerprint: 'abcd',
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
    privateKeyCipherB64: enc.cipherB64, ivB64: enc.ivB64, tagB64: enc.tagB64,
    purpose: 'org-root', createdAt: new Date().toISOString(), status: 'active',
  }],
};
writeFileSync(path, JSON.stringify(file));
decryptPrivateKey(file.keys[0], kek);

function loadLoud(p, pass) {
  const raw = JSON.parse(readFileSync(p, 'utf8'));
  const k = deriveKey(pass, Buffer.from(raw.saltB64, 'base64'));
  for (const r of raw.keys) {
    try { decryptPrivateKey(r, k); return; } catch { /* next */ }
  }
  if (raw.keys.length > 0) {
    throw new Error('KEYSTORE_DECRYPT_FAILED: cannot decrypt any key in ' + p + '. Refusing to start.');
  }
}
assertThrows(() => loadLoud(path, 'wrong-passphrase-16ch'), /KEYSTORE_DECRYPT_FAILED/);
loadLoud(path, passphrase);
writeFileSync(path, '{bad');
assertThrows(() => {
  try { JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { throw new Error('KEYSTORE_CORRUPT: cannot parse: ' + e.message); }
}, /KEYSTORE_CORRUPT/);
rmSync(dir, { recursive: true, force: true });
console.log('SELFTEST KEYSTORE LOUD-FAIL OK');

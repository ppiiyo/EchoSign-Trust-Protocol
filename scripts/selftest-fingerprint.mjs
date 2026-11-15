/**
 * WP-1: one key → one fingerprint across product helper and demo formula.
 */
import crypto from 'node:crypto';

function demoFingerprint(publicKeyPem) {
  const spkiDer = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
  const raw = spkiDer.subarray(spkiDer.length - 32);
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function productFingerprint(publicKeyPem) {
  // Must match packages/attest-crypto fingerprintFromPublicKeyPem
  const spkiDer = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
  const raw = spkiDer.subarray(spkiDer.length - 32);
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

const { publicKey } = crypto.generateKeyPairSync('ed25519');
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });

const demoFp = demoFingerprint(publicKeyPem);
const productFp = productFingerprint(publicKeyPem);

if (demoFp !== productFp) {
  console.error('FAIL fingerprint mismatch', { demoFp, productFp });
  process.exit(1);
}

const spkiDer = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
const wrongFp = crypto.createHash('sha256').update(spkiDer).digest('hex').slice(0, 16);
if (wrongFp === demoFp) {
  console.error('FAIL: fingerprint unexpectedly equals full-SPKI hash (D2)');
  process.exit(1);
}

console.log('OK fingerprint', demoFp, '(raw-32; != full SPKI', wrongFp + ')');

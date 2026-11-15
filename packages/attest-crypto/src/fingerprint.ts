/**
 * Canonical key fingerprint — single definition for product + limited demo.
 * kid = SHA-256(raw 32-byte Ed25519 public key).hex.slice(0, 16)
 */
import crypto from 'node:crypto';

export function ed25519PublicKeyRaw(publicKeyPem: string): Buffer {
  const spkiDer = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' }) as Buffer;
  return spkiDer.subarray(spkiDer.length - 32);
}

export function fingerprintFromPublicKeyPem(publicKeyPem: string): string {
  return crypto.createHash('sha256').update(ed25519PublicKeyRaw(publicKeyPem)).digest('hex').slice(0, 16);
}

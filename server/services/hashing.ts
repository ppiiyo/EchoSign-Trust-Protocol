import crypto from 'crypto';
import { KMSKeyInfo } from '../types';

export class KeyManagementService {
  private masterRootKey: Buffer;
  private currentEpoch: number = 1;
  private keyRing: Map<string, { key: Buffer; info: KMSKeyInfo }> = new Map();
  private activeKeyIds: Record<string, string> = {};

  constructor(masterSecret: string = process.env.SECRET_KEY || 'echosign_master_protocol_root_key_2026_v4') {
    this.masterRootKey = crypto.createHash('sha256').update(masterSecret).digest();
    this.initializeKeyRing();
  }

  private deriveDomainKey(domain: string, epoch: number): Buffer {
    const salt = Buffer.from(`echosign_kms_salt_${domain}_epoch_${epoch}`, 'utf8');
    return crypto.pbkdf2Sync(this.masterRootKey, salt, 10000, 32, 'sha256');
  }

  private initializeKeyRing(): void {
    const purposes: Array<{ purpose: KMSKeyInfo['purpose']; domain: string; alg: string }> = [
      { purpose: 'WATERMARK_HMAC', domain: 'watermark_hmac', alg: 'HMAC-SHA256' },
      { purpose: 'DATA_ENCRYPTION_GCM', domain: 'aes_gcm_256', alg: 'AES-256-GCM' },
      { purpose: 'BLOCKCHAIN_SEALING', domain: 'blockchain_seal', alg: 'SHA256-SEAL' },
      { purpose: 'JWT_AUTH', domain: 'jwt_auth', alg: 'HS256' }
    ];

    for (const p of purposes) {
      const keyId = `kms-${p.domain.replace(/_/g, '-')}-ep${this.currentEpoch}`;
      const derived = this.deriveDomainKey(p.domain, this.currentEpoch);
      const info: KMSKeyInfo = {
        keyId,
        epoch: this.currentEpoch,
        purpose: p.purpose,
        algorithm: p.alg,
        createdAt: Date.now(),
        status: 'ACTIVE'
      };
      this.keyRing.set(keyId, { key: derived, info });
      this.activeKeyIds[p.purpose] = keyId;
    }
  }

  public rotateKeys(reason: string = 'Scheduled Automated Key Rotation'): { epoch: number; rotatedKeys: string[]; message: string } {
    this.currentEpoch += 1;
    const rotatedKeys: string[] = [];

    // Mark previous as ROTATED
    for (const [id, entry] of this.keyRing.entries()) {
      if (entry.info.status === 'ACTIVE') {
        entry.info.status = 'ROTATED';
      }
    }

    const purposes: Array<{ purpose: KMSKeyInfo['purpose']; domain: string; alg: string }> = [
      { purpose: 'WATERMARK_HMAC', domain: 'watermark_hmac', alg: 'HMAC-SHA256' },
      { purpose: 'DATA_ENCRYPTION_GCM', domain: 'aes_gcm_256', alg: 'AES-256-GCM' },
      { purpose: 'BLOCKCHAIN_SEALING', domain: 'blockchain_seal', alg: 'SHA256-SEAL' },
      { purpose: 'JWT_AUTH', domain: 'jwt_auth', alg: 'HS256' }
    ];

    for (const p of purposes) {
      const keyId = `kms-${p.domain.replace(/_/g, '-')}-ep${this.currentEpoch}`;
      const derived = this.deriveDomainKey(p.domain, this.currentEpoch);
      const info: KMSKeyInfo = {
        keyId,
        epoch: this.currentEpoch,
        purpose: p.purpose,
        algorithm: p.alg,
        createdAt: Date.now(),
        status: 'ACTIVE'
      };
      this.keyRing.set(keyId, { key: derived, info });
      this.activeKeyIds[p.purpose] = keyId;
      rotatedKeys.push(keyId);
    }

    return {
      epoch: this.currentEpoch,
      rotatedKeys,
      message: `KMS successfully rotated to epoch ${this.currentEpoch}. Reason: ${reason}`
    };
  }

  public getActiveKey(purpose: KMSKeyInfo['purpose']): { keyId: string; key: Buffer } {
    const keyId = this.activeKeyIds[purpose];
    const entry = this.keyRing.get(keyId);
    if (!entry) throw new Error(`Active key not found for purpose: ${purpose}`);
    return { keyId, key: entry.key };
  }

  public getKeyById(keyId: string): Buffer | null {
    const entry = this.keyRing.get(keyId);
    return entry ? entry.key : null;
  }

  public getKeyRingStatus(): KMSKeyInfo[] {
    return Array.from(this.keyRing.values()).map(v => v.info);
  }

  // SHA256 utilities
  public sha256(data: Buffer | string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  public sha256Hex(data: any): string {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  // HMAC signing with active Watermark key
  public hmacSign(message: string): string {
    const { key } = this.getActiveKey('WATERMARK_HMAC');
    return crypto.createHmac('sha256', key).update(message).digest('hex');
  }

  public hmacVerify(message: string, signature: string): boolean {
    // Try with active key first, then backwards compatible with rotated keys
    for (const entry of this.keyRing.values()) {
      if (entry.info.purpose === 'WATERMARK_HMAC') {
        const expected = crypto.createHmac('sha256', entry.key).update(message).digest('hex');
        try {
          if (crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))) {
            return true;
          }
        } catch {
          // ignore length mismatch
        }
      }
    }
    return false;
  }

  // Authenticated AES-256-GCM Encryption with Random 96-bit IV and 128-bit Auth Tag
  public encryptGCM(plainText: string): string {
    const { keyId, key } = this.getActiveKey('DATA_ENCRYPTION_GCM');
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${keyId}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  public decryptGCM(cipherText: string): string {
    const parts = cipherText.split(':');
    if (parts.length !== 4) throw new Error('Invalid GCM ciphertext format (expected keyId:iv:authTag:payload)');
    const [keyId, ivHex, authTagHex, encryptedHex] = parts;
    const key = this.getKeyById(keyId);
    if (!key) throw new Error(`KMS key ${keyId} not found in key ring`);

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Backward compatibility alias for legacy AES-CBC if needed
  public encrypt(plainText: string): string {
    return this.encryptGCM(plainText);
  }

  public decrypt(cipherText: string): string {
    if (cipherText.split(':').length === 4) {
      return this.decryptGCM(cipherText);
    }
    // Legacy fallback
    const { key } = this.getActiveKey('DATA_ENCRYPTION_GCM');
    const parts = cipherText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export const hasher = new KeyManagementService();

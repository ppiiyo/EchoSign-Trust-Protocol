import crypto from 'crypto';
import { KMSKeyInfo } from '../types';

export class KeyManagementService {
  private masterRootKey: Buffer;
  private currentEpoch: number = 1;
  private keyRing: Map<string, { key: Buffer; info: KMSKeyInfo }> = new Map();
  private activeKeyIds: Record<string, string> = {};

  constructor(masterSecret?: string) {
    const secret =
      masterSecret ||
      process.env.KMS_MASTER_KEY ||
      process.env.SECRET_KEY;

    if (!secret || secret.length < 16) {
      // Fail-fast: never ship with a hardcoded default master key.
      // In pure demo mode you may set DEMO_MODE=1 to allow an ephemeral in-memory key.
      if (process.env.DEMO_MODE === '1' || process.env.NODE_ENV !== 'production') {
        console.warn(
          '[KMS] KMS_MASTER_KEY not set \u2014 using ephemeral demo key (data will not survive restarts). Set KMS_MASTER_KEY for persistent demos.'
        );
        this.masterRootKey = crypto.randomBytes(32);
      } else {
        throw new Error(
          'KMS_MASTER_KEY (or SECRET_KEY) environment variable is required and must be at least 16 characters. Refusing to start with a default secret.'
        );
      }
    } else {
      this.masterRootKey = crypto.createHash('sha256').update(secret).digest();
    }
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
      message: `Rotated to epoch ${this.currentEpoch}: ${reason}`
    };
  }

  public getActiveKey(purpose: KMSKeyInfo['purpose']): { keyId: string; key: Buffer; info: KMSKeyInfo } {
    const keyId = this.activeKeyIds[purpose];
    if (!keyId) throw new Error(`No active key for purpose ${purpose}`);
    const entry = this.keyRing.get(keyId);
    if (!entry) throw new Error(`Key ring missing entry ${keyId}`);
    return { keyId, key: entry.key, info: entry.info };
  }

  public hmacSign(purpose: KMSKeyInfo['purpose'], data: Buffer | string): string {
    const { key, keyId } = this.getActiveKey(purpose);
    const h = crypto.createHmac('sha256', key);
    h.update(typeof data === 'string' ? data : data);
    return `${keyId}.${h.digest('hex')}`;
  }

  public hmacVerify(purpose: KMSKeyInfo['purpose'], data: Buffer | string, signature: string): boolean {
    const parts = signature.split('.');
    if (parts.length !== 2) return false;
    const [keyId, expectedHex] = parts;
    const entry = this.keyRing.get(keyId);
    if (!entry) return false;
    const h = crypto.createHmac('sha256', entry.key);
    h.update(typeof data === 'string' ? data : data);
    const actual = h.digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expectedHex, 'hex'));
    } catch {
      return false;
    }
  }

  public getStatus(): { epoch: number; activeKeys: Record<string, string>; keyCount: number } {
    return {
      epoch: this.currentEpoch,
      activeKeys: { ...this.activeKeyIds },
      keyCount: this.keyRing.size
    };
  }
}

export const hasher = new KeyManagementService();

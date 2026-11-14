import {
  createApiKey as fileCreateApiKey,
  findApiKeyBySecret as fileFindApiKey,
  listApiKeys as fileListApiKeys,
  revokeApiKey as fileRevokeApiKey,
  registerDevice as fileRegisterDevice,
  listDevices as fileListDevices,
  savePackage as fileSavePackage,
  getPackage as fileGetPackage,
  listPackages as fileListPackages,
  type ApiKeyRecord,
  type DeviceRecord,
  type ProofPackage,
} from './store.ts';
import {
  isPgEnabled,
  createApiKeyPg,
  findApiKeyBySecretPg,
  savePackageWithLogPg,
  getPackagePg,
  listPackagesPg,
  registerDevicePg,
} from './store-pg.ts';
import { appendPackageLeaf } from './transparency-log.ts';

export function storageMode(): 'file' | 'postgres' {
  return isPgEnabled() ? 'postgres' : 'file';
}

export async function createApiKey(params: {
  name: string; orgId?: string; scopes?: ApiKeyRecord['scopes'];
}): Promise<{ record: ApiKeyRecord; secret: string }> {
  if (isPgEnabled()) return createApiKeyPg(params);
  return fileCreateApiKey(params);
}

export async function findApiKeyBySecret(secret: string): Promise<ApiKeyRecord | null> {
  if (isPgEnabled()) return findApiKeyBySecretPg(secret);
  return fileFindApiKey(secret);
}

export function listApiKeys(orgId?: string) {
  return fileListApiKeys(orgId);
}

export function revokeApiKey(id: string) {
  return fileRevokeApiKey(id);
}

export async function registerDevice(params: {
  orgId?: string; label: string; publicKeyPem?: string; fingerprint?: string;
}): Promise<DeviceRecord> {
  if (isPgEnabled()) return registerDevicePg(params);
  return fileRegisterDevice(params);
}

export function listDevices(orgId?: string) {
  return fileListDevices(orgId);
}

export async function getPackage(id: string): Promise<ProofPackage | null> {
  if (isPgEnabled()) return getPackagePg(id);
  return fileGetPackage(id);
}

export async function listPackages(limit = 100): Promise<ProofPackage[]> {
  if (isPgEnabled()) return listPackagesPg(limit);
  return fileListPackages(limit);
}

export async function savePackageAndLog(pkg: ProofPackage): Promise<{
  entry: { index: number; leafHashHex: string; timestamp: string };
  rootHex: string;
  treeSize: number;
  proof: { side: 'L' | 'R'; hash: string }[];
}> {
  const logResult = appendPackageLeaf({
    packageId: pkg.id,
    contentHash: pkg.audioContentHash,
    keyFingerprint: pkg.keyFingerprint,
  });
  if (isPgEnabled()) {
    await savePackageWithLogPg(pkg, {
      index: logResult.entry.index,
      timestamp: logResult.entry.timestamp,
      leafHashHex: logResult.entry.leafHashHex,
    });
  } else {
    fileSavePackage(pkg);
  }
  return {
    entry: {
      index: logResult.entry.index,
      leafHashHex: logResult.entry.leafHashHex,
      timestamp: logResult.entry.timestamp,
    },
    rootHex: logResult.rootHex,
    treeSize: logResult.treeSize,
    proof: logResult.proof,
  };
}

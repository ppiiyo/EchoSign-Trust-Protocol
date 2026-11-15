/**
 * Persistence facade (WP-2): active backend is file XOR postgres.
 * Log API and package/key/device lists always follow the active backend.
 */
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
  listApiKeysPg,
  revokeApiKeyPg,
  savePackageWithLogPg,
  getPackagePg,
  listPackagesPg,
  registerDevicePg,
  listDevicesPg,
  loadLogEntriesPg,
  currentRootPg,
} from './store-pg.ts';
import {
  appendPackageLeaf,
  loadEntries,
  currentRoot,
  getInclusionProof,
  type LogEntry,
} from './transparency-log.ts';

export function storageMode(): 'file' | 'postgres' {
  return isPgEnabled() ? 'postgres' : 'file';
}

export async function createApiKey(params: {
  name: string;
  orgId?: string;
  scopes?: ApiKeyRecord['scopes'];
}): Promise<{ record: ApiKeyRecord; secret: string }> {
  if (isPgEnabled()) return createApiKeyPg(params);
  return fileCreateApiKey(params);
}

export async function findApiKeyBySecret(secret: string): Promise<ApiKeyRecord | null> {
  if (isPgEnabled()) return findApiKeyBySecretPg(secret);
  return fileFindApiKey(secret);
}

export async function listApiKeys(orgId?: string): Promise<Omit<ApiKeyRecord, 'secretHash'>[]> {
  if (isPgEnabled()) return listApiKeysPg(orgId);
  return fileListApiKeys(orgId);
}

export async function revokeApiKey(id: string): Promise<boolean> {
  if (isPgEnabled()) return revokeApiKeyPg(id);
  return fileRevokeApiKey(id);
}

export async function registerDevice(params: {
  orgId?: string;
  label: string;
  publicKeyPem?: string;
  fingerprint?: string;
}): Promise<DeviceRecord> {
  if (isPgEnabled()) return registerDevicePg(params);
  return fileRegisterDevice(params);
}

export async function listDevices(orgId?: string): Promise<DeviceRecord[]> {
  if (isPgEnabled()) return listDevicesPg(orgId);
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

export async function loadLogEntries(): Promise<LogEntry[]> {
  if (isPgEnabled()) return loadLogEntriesPg();
  return loadEntries();
}

export async function getLogRoot(): Promise<{ treeSize: number; rootHex: string }> {
  if (isPgEnabled()) return currentRootPg();
  return currentRoot();
}

/**
 * Save package + append log leaf on the active backend only (no split-brain).
 */
export async function savePackageAndLog(pkg: ProofPackage): Promise<{
  entry: { index: number; leafHashHex: string; timestamp: string };
  rootHex: string;
  treeSize: number;
  proof: { side: 'L' | 'R'; hash: string }[];
}> {
  if (isPgEnabled()) {
    const result = await savePackageWithLogPg(pkg);
    return {
      entry: {
        index: result.entry.index,
        leafHashHex: result.entry.leafHashHex,
        timestamp: result.entry.timestamp,
      },
      rootHex: result.rootHex,
      treeSize: result.treeSize,
      proof: result.proof,
    };
  }

  fileSavePackage(pkg);
  const logResult = appendPackageLeaf({
    packageId: pkg.id,
    contentHash: pkg.audioContentHash,
    keyFingerprint: pkg.keyFingerprint,
    timestamp: pkg.createdAt,
  });
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

export function getFileInclusionProof(index: number) {
  return getInclusionProof(index);
}

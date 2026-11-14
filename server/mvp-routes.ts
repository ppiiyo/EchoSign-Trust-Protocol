import type { Express, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { attestSignAudioWithTime, attestVerify, attestJwks, attestStatus } from './services/attest';
import {
  createApiKey, listApiKeys, revokeApiKey,
  registerDevice, listDevices,
  savePackage, getPackage, listPackages, storeInit,
  type ProofPackage,
} from './services/store';
import { requireScope, type AuthedRequest } from './services/auth';
import {
  appendPackageLeaf,
  currentRoot,
  getInclusionProof,
  getLatestPublishedRoot,
  getPublishedRoot,
  publishDailyRoot,
  listPublishedRootDates,
  checkConsistency,
  loadEntries,
  verifyEntryInclusion,
} from './services/transparency-log';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const DISCLAIMER =
  'Signature proves integrity of the audio bytes at signing time. It does not prove a human was speaking.';

export function registerMvpRoutes(app: Express): void {
  app.post('/api/v1/keys', (req: Request, res: Response) => {
    if (process.env.DEMO_MODE !== '1' && process.env.ALLOW_PUBLIC_KEY_CREATE !== '1') {
      const bootstrap = req.headers['x-bootstrap-secret'];
      if (!bootstrap || bootstrap !== process.env.BOOTSTRAP_SECRET) {
        return res.status(403).json({ error: 'Key creation requires DEMO_MODE=1 or X-Bootstrap-Secret' });
      }
    }
    const { record, secret } = createApiKey({
      name: req.body?.name || 'default',
      orgId: req.body?.orgId,
      scopes: req.body?.scopes,
    });
    res.status(201).json({ id: record.id, prefix: record.prefix, secret, scopes: record.scopes, orgId: record.orgId });
  });

  app.get('/api/v1/keys', requireScope('admin'), (_req, res) => {
    res.json({ keys: listApiKeys().map(({ secretHash, ...r }) => r) });
  });

  app.delete('/api/v1/keys/:id', requireScope('admin'), (req, res) => {
    const ok = revokeApiKey(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Key not found' });
    res.json({ revoked: true });
  });

  app.post('/api/v1/devices', requireScope('devices:write', 'admin', 'attest:sign'), (req: AuthedRequest, res) => {
    const device = registerDevice({
      label: req.body?.label || 'device',
      orgId: req.apiKey?.orgId || req.body?.orgId,
    });
    res.status(201).json(device);
  });

  app.get('/api/v1/devices', requireScope('attest:read', 'admin'), (req: AuthedRequest, res) => {
    res.json({ devices: listDevices(req.apiKey?.orgId) });
  });

  app.post('/api/v1/attest/sign', requireScope('attest:sign', 'admin'), upload.single('file'), async (req: AuthedRequest, res) => {
    try {
      if (!req.file?.buffer) return res.status(400).json({ error: 'multipart field "file" (audio) is required' });
      const offline =
        process.env.ATTEST_OFFLINE === '1' ||
        req.body.offline === '1' ||
        req.body.offline === true;
      const signed = await attestSignAudioWithTime({
        audioBuffer: req.file.buffer,
        sampleRate: req.body.sampleRate ? Number(req.body.sampleRate) : undefined,
        channels: req.body.channels ? Number(req.body.channels) : undefined,
        deviceId: req.body.deviceId,
        orgId: req.apiKey?.orgId || req.body.orgId,
        captureStartedAt: req.body.captureStartedAt,
        captureEndedAt: req.body.captureEndedAt,
        offline,
      });
      const id = `pkg_${crypto.randomBytes(12).toString('hex')}`;
      const pkg: ProofPackage = {
        id,
        orgId: req.apiKey?.orgId || 'org_default',
        deviceId: req.body.deviceId,
        createdAt: new Date().toISOString(),
        audioContentHash: signed.manifest.contentHash,
        manifest: signed.manifest,
        signatureB64u: signed.signatureB64u,
        publicKeyPem: signed.publicKeyPem,
        keyFingerprint: signed.keyFingerprint,
        audioStored: false,
        disclaimer: DISCLAIMER,
        timeAttestation: signed.timeAttestation,
      };
      savePackage(pkg);
      const logResult = appendPackageLeaf({
        packageId: id,
        contentHash: signed.manifest.contentHash,
        keyFingerprint: signed.keyFingerprint,
      });
      publishDailyRoot();
      res.status(201).json({
        packageId: id,
        ...signed,
        disclaimer: DISCLAIMER,
        verifyUrl: `/api/v1/attest/packages/${id}`,
        offlineHint:
          'Download bundle and open /verify/ — no upload. TSA/OTS full verify: CLI (openssl ts / ots verify).',
        log: {
          index: logResult.entry.index,
          leafHashHex: logResult.entry.leafHashHex,
          treeSize: logResult.treeSize,
          rootHex: logResult.rootHex,
          inclusionProof: logResult.proof,
        },
      });
    } catch (err) {
      console.error('[attest/sign]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'sign failed' });
    }
  });

  app.post('/api/v1/attest/verify', (req, res) => {
    try {
      const { manifest, signatureB64u, publicKeyPem } = req.body || {};
      if (!manifest || !signatureB64u) {
        return res.status(400).json({ error: 'manifest and signatureB64u are required' });
      }
      const result = attestVerify({ manifest, signatureB64u, publicKeyPem });
      res.status(result.valid ? 200 : 400).json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'verify failed' });
    }
  });

  app.get('/api/v1/attest/jwks', (_req, res) => res.json(attestJwks()));
  app.get('/api/v1/attest/status', (_req, res) => res.json({ ...attestStatus(), store: storeInit() }));
  app.get('/api/v1/attest/packages', requireScope('attest:read', 'admin'), (_req, res) => {
    res.json({ packages: listPackages(100) });
  });
  app.get('/api/v1/attest/packages/:id', (req, res) => {
    const pkg = getPackage(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  });
  app.get('/api/v1/attest/packages/:id/bundle', (req, res) => {
    const pkg = getPackage(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.setHeader('Content-Disposition', `attachment; filename="${pkg.id}.esatt.json"`);
    res.json({
      format: 'echosign-attest-bundle-v1',
      packageId: pkg.id,
      manifest: pkg.manifest,
      signatureB64u: pkg.signatureB64u,
      publicKeyPem: pkg.publicKeyPem,
      timeAttestation: pkg.timeAttestation,
      disclaimer: pkg.disclaimer,
      createdAt: pkg.createdAt,
    });
  });

  app.get('/api/v1/log/root', (_req, res) => {
    res.json({ live: currentRoot(), published: getLatestPublishedRoot() });
  });
  app.get('/api/v1/log/root/:date', (req, res) => {
    const snap = getPublishedRoot(req.params.date);
    if (!snap) return res.status(404).json({ error: 'No published root for date' });
    res.json(snap);
  });
  app.get('/api/v1/log/entries', (_req, res) => {
    res.json({ entries: loadEntries(), ...currentRoot() });
  });
  app.get('/api/v1/log/proof/:index', (req, res) => {
    const index = Number(req.params.index);
    if (!Number.isFinite(index)) return res.status(400).json({ error: 'bad index' });
    const proof = getInclusionProof(index);
    if (!proof) return res.status(404).json({ error: 'index not found' });
    res.json({ ...proof, verifiedLocally: verifyEntryInclusion(index) });
  });
  app.get('/api/v1/log/consistency', (req, res) => {
    const oldSize = Number(req.query.oldSize);
    const oldRoot = String(req.query.oldRoot || '');
    if (!Number.isFinite(oldSize) || !oldRoot) {
      return res.status(400).json({ error: 'oldSize and oldRoot query params required' });
    }
    res.json({ consistent: checkConsistency(oldSize, oldRoot), ...currentRoot() });
  });
  app.get('/api/v1/log/roots', (_req, res) => {
    res.json({ dates: listPublishedRootDates() });
  });
}

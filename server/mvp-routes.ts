import type { Express, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { attestSignAudio, attestVerify, attestJwks, attestStatus } from './services/attest';
import {
  createApiKey, listApiKeys, revokeApiKey,
  registerDevice, listDevices,
  savePackage, getPackage, listPackages, storeInit,
  type ProofPackage,
} from './services/store';
import { requireScope, type AuthedRequest } from './services/auth';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const DISCLAIMER =
  'Signature proves integrity of the audio bytes at signing time. It does not prove a human was speaking.';

export function registerMvpRoutes(app: Express): void {
  app.post('/api/v1/keys', (req: Request, res: Response) => {
    if (process.env.DEMO_MODE !== '1' && process.env.ALLOW_PUBLIC_KEY_CREATE !== '1') {
      const bootstrap = req.headers['x-bootstrap-secret'];
      if (!bootstrap || bootstrap !== process.env.BOOTSTRAP_SECRET) {
        return res.status(403).json({ error: 'Key creation disabled. Set DEMO_MODE=1 or BOOTSTRAP_SECRET.' });
      }
    }
    const { record, secret } = createApiKey({ name: (req.body?.name as string) || 'default', orgId: req.body?.orgId, scopes: req.body?.scopes });
    res.status(201).json({
      id: record.id, name: record.name, prefix: record.prefix, scopes: record.scopes,
      orgId: record.orgId, createdAt: record.createdAt, secret,
      warning: 'Store the secret now — it will not be shown again.',
    });
  });

  app.get('/api/v1/keys', requireScope('admin', 'attest:read'), (_req, res) => {
    res.json({ keys: listApiKeys() });
  });

  app.delete('/api/v1/keys/:id', requireScope('admin'), (req, res) => {
    if (!revokeApiKey(req.params.id)) return res.status(404).json({ error: 'Key not found' });
    res.json({ revoked: true, id: req.params.id });
  });

  app.post('/api/v1/devices', requireScope('devices:write', 'admin', 'attest:sign'), (req: AuthedRequest, res) => {
    const label = req.body?.label;
    if (!label) return res.status(400).json({ error: 'label is required' });
    res.status(201).json(registerDevice({
      label, orgId: req.apiKey?.orgId || req.body?.orgId,
      publicKeyPem: req.body?.publicKeyPem, fingerprint: req.body?.fingerprint,
    }));
  });

  app.get('/api/v1/devices', requireScope('attest:read', 'admin'), (req: AuthedRequest, res) => {
    res.json({ devices: listDevices(req.apiKey?.orgId) });
  });

  app.post('/api/v1/attest/sign', requireScope('attest:sign', 'admin'), upload.single('file'), (req: AuthedRequest, res) => {
    try {
      if (!req.file?.buffer) return res.status(400).json({ error: 'multipart field "file" (audio) is required' });
      const signed = attestSignAudio({
        audioBuffer: req.file.buffer,
        sampleRate: req.body.sampleRate ? Number(req.body.sampleRate) : undefined,
        channels: req.body.channels ? Number(req.body.channels) : undefined,
        deviceId: req.body.deviceId,
        orgId: req.apiKey?.orgId || req.body.orgId,
        captureStartedAt: req.body.captureStartedAt,
        captureEndedAt: req.body.captureEndedAt,
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
      };
      savePackage(pkg);
      res.status(201).json({
        packageId: id, ...signed, disclaimer: DISCLAIMER,
        verifyUrl: `/api/v1/attest/packages/${id}`,
        offlineHint: 'Download bundle and open /verify/ — no upload.',
      });
    } catch (err) {
      console.error('[attest/sign]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'sign failed' });
    }
  });

  app.post('/api/v1/attest/verify', (req, res) => {
    try {
      const { manifest, signatureB64u, publicKeyPem } = req.body || {};
      if (!manifest || !signatureB64u) return res.status(400).json({ error: 'manifest and signatureB64u are required' });
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
      disclaimer: pkg.disclaimer,
      createdAt: pkg.createdAt,
    });
  });
}

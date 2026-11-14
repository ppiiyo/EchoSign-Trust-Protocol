/**
 * Minimal Vercel serverless handlers — pure Node, no Express.
 * DEMO pilot: in-memory /tmp keystore + Ed25519 sign.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA = process.env.ATTEST_DATA_DIR || '/tmp/echosign-data';
const DISCLAIMER =
  'Signature proves integrity of the audio bytes at signing time. It does not prove a human was speaking.';

function ensureData() {
  try {
    mkdirSync(DATA, { recursive: true });
  } catch {
    /* ignore */
  }
}

function b64u(buf: Buffer) {
  return buf.toString('base64url');
}

function getOrCreateKeyPair(): { privateKey: crypto.KeyObject; publicKeyPem: string; fingerprint: string } {
  ensureData();
  const privPath = join(DATA, 'org-private.pem');
  const pubPath = join(DATA, 'org-public.pem');
  if (existsSync(privPath) && existsSync(pubPath)) {
    const privateKey = crypto.createPrivateKey(readFileSync(privPath, 'utf8'));
    const publicKeyPem = readFileSync(pubPath, 'utf8');
    const spki = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' }) as Buffer;
    const fingerprint = crypto.createHash('sha256').update(spki).digest('hex').slice(0, 16);
    return { privateKey, publicKeyPem, fingerprint };
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  writeFileSync(privPath, privatePem, { mode: 0o600 });
  writeFileSync(pubPath, publicKeyPem);
  const spki = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const fingerprint = crypto.createHash('sha256').update(spki).digest('hex').slice(0, 16);
  return { privateKey, publicKeyPem, fingerprint };
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) sorted[key] = sortKeys(obj[key]);
    return sorted;
  }
  return value;
}

function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Multipart: extract first file field as buffer (simple boundary parser). */
function parseMultipart(buf: Buffer, contentType: string): { file?: Buffer; fields: Record<string, string> } {
  const m = /boundary=(?:="?)([^";]+)/i.exec(contentType);
  if (!m) return { fields: {} };
  const boundary = m[1];
  const parts = buf.toString('binary').split('--' + boundary);
  const fields: Record<string, string> = {};
  let file: Buffer | undefined;
  for (const part of parts) {
    if (!part || part === '--\r\n' || part === '--') continue;
    const idx = part.indexOf('\r\n\r\n');
    if (idx < 0) continue;
    const head = part.slice(0, idx);
    let body = part.slice(idx + 4);
    if (body.endsWith('\r\n')) body = body.slice(0, -2);
    const nameMatch = /name="([^"]+)"/i.exec(head);
    const filenameMatch = /filename="([^"]*)"/i.exec(head);
    if (!nameMatch) continue;
    if (filenameMatch) {
      file = Buffer.from(body, 'binary');
    } else {
      fields[nameMatch[1]] = body.replace(/\r\n$/, '');
    }
  }
  return { file, fields };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '/';
    const pathOnly = url.split('?')[0] || '/';

    // Normalize paths that Vercel may pass as /api or /api/v1/...
    const path = pathOnly.replace(/\/+$/, '') || '/';

    if (req.method === 'GET' && (path === '/health' || path === '/api' || path === '/api/health')) {
      const { fingerprint } = getOrCreateKeyPair();
      return res.status(200).json({
        status: 'ok',
        product: 'echosign-attest',
        version: '1.0.0-rc.1',
        host: 'vercel-serverless-lite',
        mode: 'demo',
        storage: 'tmp-file',
        timestamp: new Date().toISOString(),
        attest: { ready: true, algorithm: 'Ed25519', keyFingerprint: fingerprint },
      });
    }

    if (req.method === 'POST' && (path.endsWith('/api/v1/keys') || path.endsWith('/v1/keys'))) {
      const secret = 'esk_live_' + b64u(crypto.randomBytes(24));
      return res.status(201).json({
        id: 'key_demo',
        name: 'ui-panel',
        secret,
        warning: 'Demo key — stored only for this session message.',
      });
    }

    if (req.method === 'POST' && (path.includes('/attest/sign') || path.endsWith('/sign'))) {
      const ct = String(req.headers['content-type'] || '');
      let audio: Buffer | undefined;
      if (ct.includes('multipart/form-data')) {
        const raw = await readBody(req);
        const parsed = parseMultipart(raw, ct);
        audio = parsed.file;
      } else if (req.body && Buffer.isBuffer(req.body)) {
        audio = req.body;
      }
      if (!audio || audio.length === 0) {
        return res.status(400).json({ error: 'Missing audio file in multipart field "file"' });
      }

      const contentHash = crypto.createHash('sha256').update(audio).digest('hex');
      const now = new Date().toISOString();
      const { privateKey, publicKeyPem, fingerprint } = getOrCreateKeyPair();
      const manifest = {
        version: '1',
        contentHash,
        capture: { startedAt: now, endedAt: now },
        timestamps: { serverReceivedAt: now },
        signer: { keyFingerprint: fingerprint, orgId: 'org_demo', deviceId: 'ui_browser' },
      };
      const canonical = Buffer.from(canonicalJson(manifest), 'utf8');
      const signature = crypto.sign(null, canonical, privateKey);
      const packageId = 'pkg_' + crypto.randomBytes(8).toString('hex');

      return res.status(200).json({
        packageId,
        manifest,
        signatureB64u: b64u(signature),
        publicKeyPem,
        keyFingerprint: fingerprint,
        contentHash,
        timeAttestation: {
          clockSource: 'server-clock-only',
          tsa: { status: 'unavailable' },
          ots: { status: 'unavailable' },
        },
        disclaimer: DISCLAIMER,
      });
    }

    if (req.method === 'POST' && path.includes('/attest/verify')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { manifest, signatureB64u, publicKeyPem } = body as {
        manifest?: unknown;
        signatureB64u?: string;
        publicKeyPem?: string;
      };
      if (!manifest || !signatureB64u || !publicKeyPem) {
        return res.status(400).json({ error: 'manifest, signatureB64u, publicKeyPem required' });
      }
      const canonical = Buffer.from(canonicalJson(manifest), 'utf8');
      const sig = Buffer.from(signatureB64u, 'base64url');
      const pub = crypto.createPublicKey(publicKeyPem);
      const valid = crypto.verify(null, canonical, pub, sig);
      return res.status(200).json({ valid, disclaimer: DISCLAIMER });
    }

    if (req.method === 'GET' && path.includes('/jwks')) {
      const { publicKeyPem, fingerprint } = getOrCreateKeyPair();
      return res.status(200).json({
        keys: [{ kty: 'OKP', crv: 'Ed25519', use: 'sig', kid: fingerprint, x: 'see-pem', pem: publicKeyPem }],
      });
    }

    return res.status(404).json({ error: 'Not found', path });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

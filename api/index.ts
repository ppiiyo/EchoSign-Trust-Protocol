/**
 * LIMITED DEMO (Vercel). Product = docker compose + server.ts — docs/DEPLOYMENT.md.
 * Fingerprint: SHA-256(raw 32-byte Ed25519 pubkey).hex.slice(0,16) — same as packages/attest-crypto.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = process.env.ATTEST_DATA_DIR || '/tmp/echosign-data';
const DISCLAIMER =
  'Signature proves integrity of the audio bytes at signing time. It does not prove a human was speaking.';
const DEMO_BANNER =
  'Limited demo: ephemeral keys, no time attestation, no transparency log. Run the real stack via docker compose (docs/DEPLOYMENT.md).';

function appVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')).version as string;
  } catch {
    return '0.0.0-demo';
  }
}

type Req = IncomingMessage & { body?: unknown };

function ensureData() {
  try { mkdirSync(DATA, { recursive: true }); } catch { /* */ }
}
function b64u(buf: Buffer) { return buf.toString('base64url'); }

/** MUST match packages/attest-crypto fingerprintFromPublicKeyPem */
export function fingerprintFromPublicKeyPem(publicKeyPem: string): string {
  const spkiDer = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' }) as Buffer;
  const raw = spkiDer.subarray(spkiDer.length - 32);
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const s: Record<string, unknown> = {};
    for (const k of Object.keys(o).sort()) s[k] = sortKeys(o[k]);
    return s;
  }
  return value;
}

function getOrCreateKeyPair() {
  ensureData();
  const privPath = join(DATA, 'org-private.pem');
  const pubPath = join(DATA, 'org-public.pem');
  if (existsSync(privPath) && existsSync(pubPath)) {
    const privateKey = crypto.createPrivateKey(readFileSync(privPath, 'utf8'));
    const publicKeyPem = readFileSync(pubPath, 'utf8');
    return { privateKey, publicKeyPem, fingerprint: fingerprintFromPublicKeyPem(publicKeyPem) };
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  writeFileSync(privPath, privatePem, { mode: 0o600 });
  writeFileSync(pubPath, publicKeyPem);
  return { privateKey, publicKeyPem, fingerprint: fingerprintFromPublicKeyPem(publicKeyPem) };
}

async function readRawBody(req: Req): Promise<Buffer> {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    if (typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(buf: Buffer, contentType: string): { file?: Buffer } {
  const m = /boundary=(?:"?)([^"\;]+)/i.exec(contentType);
  if (!m) return {};
  const sep = Buffer.from('--' + m[1].trim());
  let file: Buffer | undefined;
  let start = buf.indexOf(sep);
  while (start >= 0) {
    let next = buf.indexOf(sep, start + sep.length);
    if (next < 0) next = buf.length;
    let part = buf.subarray(start + sep.length, next);
    if (part[0] === 0x0d && part[1] === 0x0a) part = part.subarray(2);
    if (part.length >= 2 && part[part.length - 2] === 0x0d) part = part.subarray(0, part.length - 2);
    if (part[0] === 0x2d && part[1] === 0x2d) break;
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd < 0) { start = next; continue; }
    const head = part.subarray(0, headerEnd).toString('utf8');
    const body = part.subarray(headerEnd + 4);
    if (/filename="/i.test(head)) file = Buffer.from(body);
    start = next;
  }
  return { file };
}

function corsOrigin(req: IncomingMessage): string | null {
  const allow = (process.env.CORS_ALLOW_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = String(req.headers.origin || '');
  if (!allow.length || allow.includes('*')) return null;
  if (origin && allow.includes(origin)) return origin;
  return allow[0] || null;
}

function sendJson(req: IncomingMessage, res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const o = corsOrigin(req);
  if (o) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('X-EchoSign-Demo', 'limited');
  res.end(JSON.stringify(body));
}

export default async function handler(req: Req, res: ServerResponse) {
  try {
    if ((req.method || '').toUpperCase() === 'OPTIONS') {
      res.statusCode = 204;
      const o = corsOrigin(req);
      if (o) res.setHeader('Access-Control-Allow-Origin', o);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.end();
    }
    const path = ((req.url || '/').split('?')[0] || '/').replace(/\/+$/, '') || '/';
    const method = (req.method || 'GET').toUpperCase();
    const version = appVersion();

    if (method === 'GET' && (path === '/health' || path === '/api' || path === '/api/health')) {
      const { fingerprint } = getOrCreateKeyPair();
      return sendJson(req, res, 200, {
        status: 'ok',
        product: 'echosign-attest-demo',
        version,
        host: 'vercel-limited-demo',
        mode: 'limited-demo',
        storage: 'ephemeral-tmp',
        limitations: DEMO_BANNER,
        timestamp: new Date().toISOString(),
        attest: { ready: true, algorithm: 'Ed25519', keyFingerprint: fingerprint },
      });
    }

    if (method === 'POST' && (path.endsWith('/api/v1/keys') || path.endsWith('/v1/keys'))) {
      return sendJson(req, res, 403, {
        error: 'API key creation is disabled on the limited demo host. Use docker compose (docs/DEPLOYMENT.md).',
        limitations: DEMO_BANNER,
      });
    }

    if (method === 'POST' && (path.includes('/attest/sign') || path.endsWith('/sign'))) {
      const ct = String(req.headers['content-type'] || '');
      const raw = await readRawBody(req);
      let audio: Buffer | undefined;
      if (ct.includes('multipart/form-data')) audio = parseMultipart(raw, ct).file;
      else if (ct.includes('application/json')) {
        try {
          const j = JSON.parse(raw.toString('utf8')) as { audioBase64?: string; fileBase64?: string };
          const b64 = j.audioBase64 || j.fileBase64;
          if (b64) audio = Buffer.from(b64, 'base64');
        } catch { /* */ }
      } else if (raw.length) audio = raw;
      if (!audio?.length) return sendJson(req, res, 400, { error: 'Missing audio file in multipart field "file"' });

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
      return sendJson(req, res, 200, {
        packageId: 'pkg_' + crypto.randomBytes(8).toString('hex'),
        manifest,
        signatureB64u: b64u(signature),
        publicKeyPem,
        keyFingerprint: fingerprint,
        contentHash,
        timeAttestation: { clockSource: 'server-clock-only', tsa: { status: 'unavailable' }, ots: { status: 'unavailable' } },
        limitations: DEMO_BANNER,
        disclaimer: DISCLAIMER,
      });
    }

    if (method === 'POST' && path.includes('/attest/verify')) {
      const body = JSON.parse((await readRawBody(req)).toString('utf8') || '{}') as {
        manifest?: unknown; signatureB64u?: string; publicKeyPem?: string;
      };
      if (!body.manifest || !body.signatureB64u || !body.publicKeyPem) {
        return sendJson(req, res, 400, { error: 'manifest, signatureB64u, publicKeyPem required' });
      }
      const canonical = Buffer.from(canonicalJson(body.manifest), 'utf8');
      const valid = crypto.verify(null, canonical, crypto.createPublicKey(body.publicKeyPem), Buffer.from(body.signatureB64u, 'base64url'));
      return sendJson(req, res, 200, {
        valid,
        keyFingerprint: fingerprintFromPublicKeyPem(body.publicKeyPem),
        limitations: DEMO_BANNER,
        disclaimer: DISCLAIMER,
      });
    }

    if (method === 'GET' && path.includes('/jwks')) {
      const { publicKeyPem, fingerprint } = getOrCreateKeyPair();
      return sendJson(req, res, 200, {
        keys: [{ kty: 'OKP', crv: 'Ed25519', use: 'sig', kid: fingerprint, pem: publicKeyPem }],
        limitations: DEMO_BANNER,
      });
    }

    return sendJson(req, res, 404, { error: 'Not found', path, limitations: DEMO_BANNER });
  } catch (err) {
    console.error(err);
    return sendJson(req, res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
}

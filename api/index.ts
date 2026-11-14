/**
 * Minimal Vercel serverless handlers — pure Node crypto, no Express.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA = process.env.ATTEST_DATA_DIR || '/tmp/echosign-data';
const DISCLAIMER =
  'Signature proves integrity of the audio bytes at signing time. It does not prove a human was speaking.';

type Req = IncomingMessage & { url?: string; method?: string; body?: unknown };

function ensureData() {
  try { mkdirSync(DATA, { recursive: true }); } catch { /* */ }
}
function b64u(buf: Buffer) { return buf.toString('base64url'); }

function getOrCreateKeyPair() {
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

async function readRawBody(req: Req): Promise<Buffer> {
  const anyReq = req as Req & { body?: unknown };
  if (anyReq.body !== undefined && anyReq.body !== null) {
    if (Buffer.isBuffer(anyReq.body)) return anyReq.body;
    if (typeof anyReq.body === 'string') return Buffer.from(anyReq.body);
    if (anyReq.body instanceof ArrayBuffer) return Buffer.from(anyReq.body);
    // JSON already parsed
    if (typeof anyReq.body === 'object') return Buffer.from(JSON.stringify(anyReq.body));
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(buf: Buffer, contentType: string): { file?: Buffer; fields: Record<string, string> } {
  const m = /boundary=(?:"?)([^";]+)/i.exec(contentType);
  if (!m) return { fields: {} };
  const boundary = m[1].trim();
  const sep = Buffer.from('--' + boundary);
  const fields: Record<string, string> = {};
  let file: Buffer | undefined;

  // Split by boundary markers in binary
  let start = buf.indexOf(sep);
  while (start >= 0) {
    let next = buf.indexOf(sep, start + sep.length);
    if (next < 0) next = buf.length;
    let part = buf.subarray(start + sep.length, next);
    // strip leading CRLF
    if (part[0] === 0x0d && part[1] === 0x0a) part = part.subarray(2);
    // strip trailing CRLF
    if (part.length >= 2 && part[part.length - 2] === 0x0d && part[part.length - 1] === 0x0a) {
      part = part.subarray(0, part.length - 2);
    }
    // end marker --
    if (part[0] === 0x2d && part[1] === 0x2d) break;

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd < 0) {
      start = next;
      continue;
    }
    const head = part.subarray(0, headerEnd).toString('utf8');
    let body = part.subarray(headerEnd + 4);
    // final boundary may leave trailing \r\n
    const nameMatch = /name="([^"]+)"/i.exec(head);
    const filenameMatch = /filename="([^"]*)"/i.exec(head);
    if (nameMatch) {
      if (filenameMatch !== null) {
        file = Buffer.from(body);
      } else {
        fields[nameMatch[1]] = body.toString('utf8').replace(/\r\n$/, '');
      }
    }
    start = next;
  }
  return { file, fields };
}

function sendJson(res: ServerResponse, code: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(payload);
}

export default async function handler(req: Req, res: ServerResponse) {
  try {
    if ((req.method || '').toUpperCase() === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.end();
    }

    const url = req.url || '/';
    const path = (url.split('?')[0] || '/').replace(/\/+$/, '') || '/';
    const method = (req.method || 'GET').toUpperCase();

    if (method === 'GET' && (path === '/health' || path === '/api' || path === '/api/health')) {
      const { fingerprint } = getOrCreateKeyPair();
      return sendJson(res, 200, {
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

    if (method === 'POST' && (path.endsWith('/api/v1/keys') || path.endsWith('/v1/keys'))) {
      const secret = 'esk_live_' + b64u(crypto.randomBytes(24));
      return sendJson(res, 201, { id: 'key_demo', name: 'ui-panel', secret, warning: 'Demo key.' });
    }

    if (method === 'POST' && (path.includes('/attest/sign') || path.endsWith('/sign'))) {
      const ct = String(req.headers['content-type'] || '');
      const raw = await readRawBody(req);
      let audio: Buffer | undefined;

      if (ct.includes('multipart/form-data')) {
        audio = parseMultipart(raw, ct).file;
      } else if (ct.includes('application/json')) {
        try {
          const j = JSON.parse(raw.toString('utf8')) as { audioBase64?: string; fileBase64?: string };
          const b64 = j.audioBase64 || j.fileBase64;
          if (b64) audio = Buffer.from(b64, 'base64');
        } catch { /* */ }
      } else if (raw.length > 0) {
        audio = raw;
      }

      if (!audio || audio.length === 0) {
        return sendJson(res, 400, {
          error: 'Missing audio file in multipart field "file"',
          debug: { contentType: ct, bodyBytes: raw.length },
        });
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
      return sendJson(res, 200, {
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

    if (method === 'POST' && path.includes('/attest/verify')) {
      const raw = await readRawBody(req);
      const body = JSON.parse(raw.toString('utf8') || '{}') as {
        manifest?: unknown; signatureB64u?: string; publicKeyPem?: string;
      };
      if (!body.manifest || !body.signatureB64u || !body.publicKeyPem) {
        return sendJson(res, 400, { error: 'manifest, signatureB64u, publicKeyPem required' });
      }
      const canonical = Buffer.from(canonicalJson(body.manifest), 'utf8');
      const sig = Buffer.from(body.signatureB64u, 'base64url');
      const pub = crypto.createPublicKey(body.publicKeyPem);
      const valid = crypto.verify(null, canonical, pub, sig);
      return sendJson(res, 200, { valid, disclaimer: DISCLAIMER });
    }

    if (method === 'GET' && path.includes('/jwks')) {
      const { publicKeyPem, fingerprint } = getOrCreateKeyPair();
      return sendJson(res, 200, {
        keys: [{ kty: 'OKP', crv: 'Ed25519', use: 'sig', kid: fingerprint, pem: publicKeyPem }],
      });
    }

    return sendJson(res, 404, { error: 'Not found', path });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * RFC 3161 Timestamp Authority client (E3-1).
 * Configurable TSA URL (default FreeTSA).
 * Returns raw TimeStampResp token (base64) for storage in the manifest.
 *
 * Verify offline:
 *   openssl ts -verify -data <canonical.json> -in token.tsr -CAfile cacert.pem
 */

import crypto from 'node:crypto';

export interface TsaRequestOptions {
  data: Buffer;
  hashAlgo?: 'sha256' | 'sha512';
  tsaUrl?: string;
  timeoutMs?: number;
}

export interface TsaResult {
  tokenB64: string;
  tsaUrl: string;
  hashAlgo: string;
  imprintHex: string;
}

const DEFAULT_TSA = process.env.TSA_URL || 'https://freetsa.org/tsr';

function derLength(len: number): Buffer {
  if (len < 0x80) return Buffer.from([len]);
  if (len < 0x100) return Buffer.from([0x81, len]);
  return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
}

function derSequence(content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x30]), derLength(content.length), content]);
}

function derOctetString(content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x04]), derLength(content.length), content]);
}

function derInteger(content: Buffer): Buffer {
  let body = content;
  if (body[0] & 0x80) body = Buffer.concat([Buffer.from([0x00]), body]);
  return Buffer.concat([Buffer.from([0x02]), derLength(body.length), body]);
}

function derObjectIdentifier(oidBody: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x06]), derLength(oidBody.length), oidBody]);
}

function buildTimestampRequest(imprint: Buffer, hashOid: string, nonce: Buffer): Buffer {
  const oidSha256 = Buffer.from('608648016503040201', 'hex');
  const oidSha512 = Buffer.from('608648016503040203', 'hex');
  const oid = hashOid === 'sha512' ? oidSha512 : oidSha256;

  const algId = derSequence(
    Buffer.concat([derObjectIdentifier(oid), Buffer.from([0x05, 0x00])])
  );
  const messageImprint = derSequence(Buffer.concat([algId, derOctetString(imprint)]));
  const version = derInteger(Buffer.from([0x01]));
  const nonceInt = derInteger(nonce);
  const certReq = Buffer.from([0x01, 0x01, 0xff]);

  return derSequence(Buffer.concat([version, messageImprint, nonceInt, certReq]));
}

export async function requestTimestamp(opts: TsaRequestOptions): Promise<TsaResult> {
  const hashAlgo = opts.hashAlgo ?? 'sha256';
  const tsaUrl = opts.tsaUrl ?? DEFAULT_TSA;
  const timeoutMs = opts.timeoutMs ?? 15_000;

  const imprint = crypto.createHash(hashAlgo).update(opts.data).digest();
  const nonce = crypto.randomBytes(8);
  const reqDer = buildTimestampRequest(imprint, hashAlgo, nonce);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(tsaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/timestamp-query',
        Accept: 'application/timestamp-reply',
      },
      body: reqDer,
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`TSA HTTP ${res.status} from ${tsaUrl}`);

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10) throw new Error('TSA returned empty or too-short response');
    if (buf[0] !== 0x30) throw new Error('TSA response does not look like DER SEQUENCE');

    return {
      tokenB64: buf.toString('base64'),
      tsaUrl,
      hashAlgo,
      imprintHex: imprint.toString('hex'),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function timestampCanonicalJson(
  canonical: string,
  tsaUrl?: string
): Promise<TsaResult> {
  return requestTimestamp({ data: Buffer.from(canonical, 'utf8'), tsaUrl });
}

/**
 * OpenTimestamps client (E3-2) — stamp / upgrade / verify (structural).
 * Calendar default: https://alice.btc.calendar.opentimestamps.org
 * Full Bitcoin merkle verification: use official `ots verify` client.
 */

import crypto from 'node:crypto';

const DEFAULT_CALENDAR =
  process.env.OTS_CALENDAR_URL || 'https://alice.btc.calendar.opentimestamps.org';

export interface OtsStampResult {
  proofB64: string;
  digestHex: string;
  calendarUrl: string;
  complete: boolean;
}

export interface OtsVerifyResult {
  valid: boolean;
  complete: boolean;
  reason?: string;
  attestation?: string;
}

const OTS_MAGIC = Buffer.from([
  0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61,
  0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf,
  0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94,
]);

function sha256(data: Buffer): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

function looksComplete(proof: Buffer): boolean {
  const markers = [
    Buffer.from('bitcoin'),
    Buffer.from('BitcoinBlockHeaderAttestation'),
    Buffer.from([0x05, 0x88, 0x96, 0x0d]),
  ];
  return markers.some((m) => proof.includes(m));
}

export async function otsStamp(
  dataOrDigest: Buffer,
  opts?: { calendarUrl?: string; alreadyHashed?: boolean; timeoutMs?: number }
): Promise<OtsStampResult> {
  const calendarUrl = (opts?.calendarUrl ?? DEFAULT_CALENDAR).replace(/\/$/, '');
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const digest = opts?.alreadyHashed
    ? dataOrDigest.length === 32
      ? dataOrDigest
      : sha256(dataOrDigest)
    : sha256(dataOrDigest);

  if (digest.length !== 32) {
    throw new Error('OTS digest must be 32 bytes (SHA-256)');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${calendarUrl}/timestamp`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.opentimestamps.v1',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: digest,
      signal: controller.signal,
    });

    if (!res.ok) {
      const res2 = await fetch(`${calendarUrl}/timestamp/${digest.toString('hex')}`, {
        method: 'POST',
        headers: { Accept: 'application/vnd.opentimestamps.v1' },
        signal: controller.signal,
      });
      if (!res2.ok) {
        throw new Error(`OTS calendar HTTP ${res.status}/${res2.status} from ${calendarUrl}`);
      }
      const buf2 = Buffer.from(await res2.arrayBuffer());
      return {
        proofB64: buf2.toString('base64'),
        digestHex: digest.toString('hex'),
        calendarUrl,
        complete: looksComplete(buf2),
      };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8) throw new Error('OTS calendar returned empty proof');

    return {
      proofB64: buf.toString('base64'),
      digestHex: digest.toString('hex'),
      calendarUrl,
      complete: looksComplete(buf),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function otsUpgrade(
  proofB64: string,
  opts?: { calendarUrl?: string; timeoutMs?: number }
): Promise<OtsStampResult> {
  const calendarUrl = (opts?.calendarUrl ?? DEFAULT_CALENDAR).replace(/\/$/, '');
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const proof = Buffer.from(proofB64, 'base64');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${calendarUrl}/timestamp`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.opentimestamps.v1',
        'Content-Type': 'application/vnd.opentimestamps.v1',
      },
      body: proof,
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        proofB64,
        digestHex: '',
        calendarUrl,
        complete: looksComplete(proof),
      };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const upgraded = buf.length > proof.length ? buf : proof;

    return {
      proofB64: upgraded.toString('base64'),
      digestHex: '',
      calendarUrl,
      complete: looksComplete(upgraded),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function otsVerifyLocal(proofB64: string, _digestHex?: string): OtsVerifyResult {
  const proof = Buffer.from(proofB64, 'base64');

  if (proof.length < 16) {
    return { valid: false, complete: false, reason: 'proof too short' };
  }

  const complete = looksComplete(proof);

  return {
    valid: true,
    complete,
    reason: complete
      ? 'Proof contains Bitcoin attestation markers (verify with `ots verify` for full check)'
      : 'Pending proof — not yet in a Bitcoin block. Run otsUpgrade later.',
    attestation: complete ? 'bitcoin-attestation-present' : 'pending',
  };
}

export async function otsStampCanonical(
  canonical: string,
  calendarUrl?: string
): Promise<OtsStampResult> {
  return otsStamp(Buffer.from(canonical, 'utf8'), { calendarUrl });
}

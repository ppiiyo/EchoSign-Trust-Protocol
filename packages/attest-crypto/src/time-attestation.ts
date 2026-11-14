/**
 * Time attestation pipeline (WP-3).
 * Signature covers manifest without TSA/OTS tokens. Tokens bind to SHA-256(canonical).
 */
import crypto from 'node:crypto';
import { requestTimestamp, type TsaResult } from './tsa.js';
import { otsStamp, type OtsStampResult } from './ots.js';

export type TsaStatus = 'granted' | 'failed' | 'unavailable';
export type OtsStatus = 'pending-calendar' | 'bitcoin-confirmed' | 'unavailable';
export type ClockSource = 'tsa' | 'ots-pending' | 'server-clock-only';

export interface TimeAttestation {
  contentHashHex: string;
  serverReceivedAt: string;
  tsa: {
    status: TsaStatus;
    tokenB64?: string;
    tsaUrl?: string;
    hashAlgo?: string;
    imprintHex?: string;
    error?: string;
  };
  ots: {
    status: OtsStatus;
    proofB64?: string;
    calendarUrl?: string;
    digestHex?: string;
    error?: string;
  };
  clockSource: ClockSource;
}

export interface AttachTimeOptions {
  offline?: boolean;
  tsaUrl?: string;
  otsCalendarUrl?: string;
  tsaTimeoutMs?: number;
  otsTimeoutMs?: number;
}

const DEFAULT_ALLOW = [
  'freetsa.org',
  'alice.btc.calendar.opentimestamps.org',
  'bob.btc.calendar.opentimestamps.org',
  'finney.calendar.eternitywall.com',
];

function hostAllowed(urlStr: string): boolean {
  const extra = (process.env.TIME_SERVICE_ALLOWLIST || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allow = new Set([...DEFAULT_ALLOW, ...extra]);
  let host: string;
  try { host = new URL(urlStr).hostname.toLowerCase(); } catch { return false; }
  if (allow.has(host)) return true;
  if (
    host === 'localhost' || host.endsWith('.local') || host.startsWith('127.') ||
    host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) return false;
  return allow.has(host);
}

export async function attachTimeAttestation(
  canonical: string,
  opts: AttachTimeOptions = {}
): Promise<TimeAttestation> {
  const serverReceivedAt = new Date().toISOString();
  const hash = crypto.createHash('sha256').update(canonical, 'utf8').digest();
  const hex = hash.toString('hex');

  const offline =
    opts.offline === true ||
    process.env.ATTEST_OFFLINE === '1' ||
    process.env.TIME_ATTEST_OFFLINE === '1';

  if (offline) {
    return {
      contentHashHex: hex,
      serverReceivedAt,
      tsa: { status: 'unavailable', error: 'offline mode — server-clock only' },
      ots: { status: 'unavailable', error: 'offline mode — server-clock only' },
      clockSource: 'server-clock-only',
    };
  }

  let tsaStatus: TsaStatus = 'unavailable';
  let tsaResult: TsaResult | undefined;
  let tsaError: string | undefined;
  const tsaUrl = opts.tsaUrl || process.env.TSA_URL || 'https://freetsa.org/tsr';

  if (!hostAllowed(tsaUrl)) {
    tsaError = `TSA host not in allowlist: ${tsaUrl}`;
  } else {
    try {
      tsaResult = await requestTimestamp({
        data: Buffer.from(canonical, 'utf8'),
        tsaUrl,
        timeoutMs: opts.tsaTimeoutMs ?? 12_000,
      });
      tsaStatus = 'granted';
    } catch (err) {
      tsaStatus = 'failed';
      tsaError = err instanceof Error ? err.message : String(err);
    }
  }

  let otsStatus: OtsStatus = 'unavailable';
  let otsResult: OtsStampResult | undefined;
  let otsError: string | undefined;
  const calendar =
    opts.otsCalendarUrl ||
    process.env.OTS_CALENDAR_URL ||
    'https://alice.btc.calendar.opentimestamps.org';

  if (!hostAllowed(calendar)) {
    otsError = `OTS calendar not in allowlist: ${calendar}`;
  } else {
    try {
      otsResult = await otsStamp(hash, {
        calendarUrl: calendar,
        alreadyHashed: true,
        timeoutMs: opts.otsTimeoutMs ?? 15_000,
      });
      otsStatus = 'pending-calendar';
    } catch (err) {
      otsStatus = 'unavailable';
      otsError = err instanceof Error ? err.message : String(err);
    }
  }

  let clockSource: ClockSource = 'server-clock-only';
  if (tsaStatus === 'granted') clockSource = 'tsa';
  else if (otsStatus === 'pending-calendar' || otsStatus === 'bitcoin-confirmed') clockSource = 'ots-pending';

  return {
    contentHashHex: hex,
    serverReceivedAt,
    tsa: {
      status: tsaStatus,
      tokenB64: tsaResult?.tokenB64,
      tsaUrl: tsaResult?.tsaUrl ?? tsaUrl,
      hashAlgo: tsaResult?.hashAlgo,
      imprintHex: tsaResult?.imprintHex,
      error: tsaError,
    },
    ots: {
      status: otsStatus,
      proofB64: otsResult?.proofB64,
      calendarUrl: otsResult?.calendarUrl ?? calendar,
      digestHex: otsResult?.digestHex ?? hex,
      error: otsError,
    },
    clockSource,
  };
}

export function tsaTokenStructuralCheck(
  tokenB64: string,
  expectedImprintHex: string
): { ok: boolean; reason?: string } {
  let buf: Buffer;
  try { buf = Buffer.from(tokenB64, 'base64'); } catch { return { ok: false, reason: 'invalid base64' }; }
  if (buf.length < 32) return { ok: false, reason: 'token too short' };
  if (buf[0] !== 0x30) return { ok: false, reason: 'not a DER SEQUENCE' };
  const imprint = Buffer.from(expectedImprintHex, 'hex');
  if (imprint.length !== 32 && imprint.length !== 64) {
    return { ok: false, reason: 'expected imprint must be sha256/sha512' };
  }
  if (!buf.includes(imprint)) {
    return { ok: false, reason: 'messageImprint not found in token (forged or wrong data)' };
  }
  return { ok: true };
}

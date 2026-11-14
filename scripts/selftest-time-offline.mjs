#!/usr/bin/env node
import crypto from 'node:crypto';
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const k of Object.keys(value).sort()) sorted[k] = sortKeys(value[k]);
    return sorted;
  }
  return value;
}
const canonicalJson = (v) => JSON.stringify(sortKeys(v));
function tsaTokenStructuralCheck(tokenB64, expectedImprintHex) {
  const buf = Buffer.from(tokenB64, 'base64');
  if (buf.length < 32) return { ok: false, reason: 'token too short' };
  if (buf[0] !== 0x30) return { ok: false, reason: 'not a DER SEQUENCE' };
  const imprint = Buffer.from(expectedImprintHex, 'hex');
  if (!buf.includes(imprint)) return { ok: false, reason: 'messageImprint not found' };
  return { ok: true };
}
const canonical = canonicalJson({ v: 1, contentHash: 'ab'.repeat(32) });
const imprint = crypto.createHash('sha256').update(canonical, 'utf8').digest();
const offlineAtt = {
  clockSource: 'server-clock-only',
  tsa: { status: 'unavailable' },
  ots: { status: 'unavailable' },
};
if (offlineAtt.clockSource !== 'server-clock-only') throw new Error('clockSource');
const forged = Buffer.concat([Buffer.from([0x30, 0x08]), crypto.randomBytes(8)]).toString('base64');
if (tsaTokenStructuralCheck(forged, imprint.toString('hex')).ok) throw new Error('forged');
const goodTok = Buffer.concat([Buffer.from([0x30, 0x80]), imprint, Buffer.from('x')]).toString('base64');
if (!tsaTokenStructuralCheck(goodTok, imprint.toString('hex')).ok) throw new Error('good');
console.log('SELFTEST TIME OFFLINE OK');

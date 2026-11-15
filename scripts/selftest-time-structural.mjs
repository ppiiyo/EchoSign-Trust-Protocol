/**
 * WP-3: TSA structural check — imprint present / wrong imprint fails.
 */
import crypto from 'node:crypto';

function tsaTokenStructuralCheck(tokenB64, expectedImprintHex) {
  let buf;
  try { buf = Buffer.from(tokenB64, 'base64'); } catch { return { ok: false, reason: 'invalid base64' }; }
  if (buf.length < 32) return { ok: false, reason: 'token too short' };
  if (buf[0] !== 0x30) return { ok: false, reason: 'not a DER SEQUENCE' };
  const imprint = Buffer.from(expectedImprintHex, 'hex');
  if (imprint.length !== 32 && imprint.length !== 64) return { ok: false, reason: 'bad imprint len' };
  if (!buf.includes(imprint)) return { ok: false, reason: 'messageImprint not found in token' };
  return { ok: true };
}

const imprint = crypto.createHash('sha256').update('canonical-demo').digest();
const token = Buffer.concat([Buffer.from([0x30, 0x80]), Buffer.from('padding'), imprint, Buffer.from('trailer')]);
const ok = tsaTokenStructuralCheck(token.toString('base64'), imprint.toString('hex'));
if (!ok.ok) { console.error('FAIL expected ok', ok); process.exit(1); }
const wrong = tsaTokenStructuralCheck(token.toString('base64'), crypto.randomBytes(32).toString('hex'));
if (wrong.ok) { console.error('FAIL expected fail on wrong imprint'); process.exit(1); }
const notDer = tsaTokenStructuralCheck(Buffer.from('hello').toString('base64'), imprint.toString('hex'));
if (notDer.ok) { console.error('FAIL expected fail on non-DER'); process.exit(1); }
console.log('OK TSA structural checks (present / wrong / non-DER)');

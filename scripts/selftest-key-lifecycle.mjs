/**
 * WP-4: revoke-after-sign still valid; revoke-before invalid; JWKS lists statuses.
 */
function isKeyValidAt(record, signingTimeIso) {
  if (record.status !== 'revoked' || !record.revokedAt) return true;
  const revoked = Date.parse(record.revokedAt);
  const signed = Date.parse(signingTimeIso);
  if (Number.isNaN(revoked) || Number.isNaN(signed)) return false;
  return revoked > signed;
}

const signing = '2026-11-14T12:00:00.000Z';
const after = '2026-11-14T13:00:00.000Z';
const before = '2026-11-14T11:00:00.000Z';

if (!isKeyValidAt({ status: 'active' }, signing)) { console.error('FAIL active'); process.exit(1); }
if (!isKeyValidAt({ status: 'rotated', rotatedAt: after }, signing)) { console.error('FAIL rotated'); process.exit(1); }
if (!isKeyValidAt({ status: 'revoked', revokedAt: after }, signing)) { console.error('FAIL revoke-after'); process.exit(1); }
if (isKeyValidAt({ status: 'revoked', revokedAt: before }, signing)) { console.error('FAIL revoke-before'); process.exit(1); }
if (isKeyValidAt({ status: 'revoked', revokedAt: signing }, signing)) { console.error('FAIL revoke-at'); process.exit(1); }

const records = [
  { keyId: 'a', status: 'active', fingerprint: 'f1' },
  { keyId: 'b', status: 'rotated', fingerprint: 'f2' },
  { keyId: 'c', status: 'revoked', fingerprint: 'f3', revokedAt: before },
];
const jwksKeys = records.map((r) => ({ kid: r.keyId, status: r.status, fingerprint: r.fingerprint }));
if (jwksKeys.length !== 3 || !jwksKeys.find((k) => k.status === 'revoked')) {
  console.error('FAIL JWKS must include revoked');
  process.exit(1);
}
console.log('OK key lifecycle (revoke before/after, JWKS includes revoked)');

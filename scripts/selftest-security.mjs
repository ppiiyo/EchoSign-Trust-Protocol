#!/usr/bin/env node
function isBlockedOutboundHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === '0.0.0.0' || host === '::1') return true;
  if (host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.')) return true;
  if (host.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}
function assertSafeRuntimeSim(env) {
  const prod = env.NODE_ENV === 'production';
  const demo = env.DEMO_MODE === '1';
  if (prod && demo) return { ok: false, reason: 'prod+demo' };
  if (prod && !env.KMS_MASTER_KEY) return { ok: false, reason: 'no-kms' };
  if (prod && env.KMS_MASTER_KEY && env.KMS_MASTER_KEY.length < 16) return { ok: false, reason: 'short-kms' };
  return { ok: true };
}
for (const h of ['169.254.169.254', '10.0.0.5', '192.168.1.1', '127.0.0.1', 'localhost']) {
  if (!isBlockedOutboundHost(h)) throw new Error('should block ' + h);
}
if (isBlockedOutboundHost('freetsa.org')) throw new Error('allow freetsa');
if (assertSafeRuntimeSim({ NODE_ENV: 'production', DEMO_MODE: '1', KMS_MASTER_KEY: 'x'.repeat(16) }).ok) throw new Error('prod+demo');
if (assertSafeRuntimeSim({ NODE_ENV: 'production', DEMO_MODE: '0' }).ok) throw new Error('no-kms');
if (!assertSafeRuntimeSim({ NODE_ENV: 'production', DEMO_MODE: '0', KMS_MASTER_KEY: 'production-secret-key' }).ok) throw new Error('good');
console.log('SELFTEST SECURITY OK');

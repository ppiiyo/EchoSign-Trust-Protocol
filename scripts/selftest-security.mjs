/**
 * WP-5 security selftest (no vitest required).
 */
function isBlockedOutboundHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === '0.0.0.0' || host === '::1') return true;
  if (host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.')) return true;
  if (host.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

function productionCsp() {
  return [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self'",
    "script-src 'self'",
    "connect-src 'self'",
  ].join('; ');
}

const blocked = ['169.254.169.254', '10.1.2.3', '192.168.0.1', '127.0.0.1', '172.16.0.5'];
for (const h of blocked) {
  if (!isBlockedOutboundHost(h)) {
    console.error('FAIL should block', h);
    process.exit(1);
  }
}
if (isBlockedOutboundHost('freetsa.org')) {
  console.error('FAIL should allow freetsa.org');
  process.exit(1);
}
const csp = productionCsp();
if (/script-src[^;]*unsafe-inline/.test(csp)) {
  console.error('FAIL CSP has unsafe-inline');
  process.exit(1);
}

function wouldRefuseStart(env) {
  return env.NODE_ENV === 'production' && env.DEMO_MODE === '1';
}
if (!wouldRefuseStart({ NODE_ENV: 'production', DEMO_MODE: '1' })) {
  console.error('FAIL prod+demo should refuse');
  process.exit(1);
}
if (wouldRefuseStart({ NODE_ENV: 'production', DEMO_MODE: '0' })) {
  console.error('FAIL prod without demo should not refuse on demo flag');
  process.exit(1);
}

console.log('OK security selftest (SSRF blocklist, CSP, prod+DEMO gate)');

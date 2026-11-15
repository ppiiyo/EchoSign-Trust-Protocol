import { describe, it, expect } from 'vitest';
import {
  isBlockedOutboundHost,
  assertSafeOutboundUrl,
  contentSecurityPolicy,
  productionCspHasUnsafeInline,
} from '../server/security.ts';

describe('security (WP-5)', () => {
  it('blocks cloud metadata and private ranges', () => {
    for (const h of [
      '169.254.169.254',
      '10.1.2.3',
      '192.168.0.1',
      '127.0.0.1',
      'localhost',
      '172.16.0.1',
      '172.31.255.1',
    ]) {
      expect(isBlockedOutboundHost(h)).toBe(true);
    }
  });

  it('allows public TSA hostnames', () => {
    expect(isBlockedOutboundHost('freetsa.org')).toBe(false);
    expect(isBlockedOutboundHost('alice.btc.calendar.opentimestamps.org')).toBe(false);
  });

  it('assertSafeOutboundUrl throws on metadata IP', () => {
    expect(() => assertSafeOutboundUrl('http://169.254.169.254/latest')).toThrow(/blocked/i);
    expect(() => assertSafeOutboundUrl('http://10.0.0.5/')).toThrow(/blocked/i);
  });

  it('assertSafeOutboundUrl allows freetsa', () => {
    expect(() => assertSafeOutboundUrl('https://freetsa.org/tsr')).not.toThrow();
  });

  it('production CSP has no script unsafe-inline', () => {
    expect(productionCspHasUnsafeInline()).toBe(false);
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const csp = contentSecurityPolicy();
    process.env.NODE_ENV = prev;
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });
});

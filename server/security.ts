import type { Express, Request, Response, NextFunction } from 'express';

export function assertSafeRuntime(): void {
  const prod = process.env.NODE_ENV === 'production';
  const demo = process.env.DEMO_MODE === '1';
  if (prod && demo) {
    console.error('[security] FATAL: NODE_ENV=production and DEMO_MODE=1 are incompatible.');
    process.exit(1);
  }
  if (prod && !process.env.KMS_MASTER_KEY) {
    console.error('[security] FATAL: KMS_MASTER_KEY is required when NODE_ENV=production.');
    process.exit(1);
  }
  if (prod && process.env.KMS_MASTER_KEY && process.env.KMS_MASTER_KEY.length < 16) {
    console.error('[security] FATAL: KMS_MASTER_KEY must be at least 16 characters.');
    process.exit(1);
  }
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'"
  );
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
}

export function rateLimit(opts: { windowMs?: number; max?: number; pathPrefix?: string } = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 120;
  const prefix = opts.pathPrefix ?? '/api/';
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith(prefix)) return next();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = hits.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      hits.set(ip, bucket);
    }
    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests', retryAfterMs: bucket.resetAt - now });
    }
    next();
  };
}

export function signRateLimit() {
  const windowMs = 60_000;
  const max = Number(process.env.SIGN_RATE_LIMIT_MAX || 30);
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST' || !req.path.includes('/attest/sign')) return next();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = hits.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      hits.set(ip, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Sign rate limit exceeded', limit: max, windowMs });
    }
    next();
  };
}

export function applySecurityMiddleware(app: Express): void {
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders);
  app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.API_RATE_LIMIT_MAX || 180) }));
  app.use(signRateLimit());
}

export function isBlockedOutboundHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === '0.0.0.0' || host === '::1' || host === '[::1]') return true;
  if (host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.')) return true;
  if (host.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

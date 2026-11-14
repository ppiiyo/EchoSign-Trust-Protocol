import type { Request, Response, NextFunction } from 'express';
import type { ApiKeyRecord } from './store';
import { findApiKeyBySecret } from './persistence';

export interface AuthedRequest extends Request {
  apiKey?: ApiKeyRecord;
}

export function requireScope(...scopes: ApiKeyRecord['scopes']) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!token) {
      if (process.env.DEMO_MODE === '1') {
        res.setHeader('X-EchoSign-Auth', 'demo-open');
        return next();
      }
      return res.status(401).json({
        error: 'Missing Authorization: Bearer <api_key>',
        hint: 'POST /api/v1/keys to create a key, or set DEMO_MODE=1 for open local demo',
      });
    }

    const key = await findApiKeyBySecret(token);
    if (!key) {
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    const ok = scopes.some((s) => key.scopes.includes(s) || key.scopes.includes('admin'));
    if (!ok) {
      return res.status(403).json({ error: 'API key lacks required scope', required: scopes });
    }

    req.apiKey = key;
    next();
  };
}

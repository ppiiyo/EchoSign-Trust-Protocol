/**
 * Vercel serverless entry (Express).
 * Env MUST be set before service modules initialize keystore/store.
 */
process.env.DEMO_MODE = process.env.DEMO_MODE || '1';
process.env.ATTEST_OFFLINE = process.env.ATTEST_OFFLINE || '1';
process.env.ATTEST_DATA_DIR = process.env.ATTEST_DATA_DIR || '/tmp/echosign-data';

import express from 'express';
import path from 'path';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';

try {
  mkdirSync(process.env.ATTEST_DATA_DIR, { recursive: true });
} catch {
  /* ignore */
}

import { attestStatus } from '../server/services/attest';
import { registerMvpRoutes } from '../server/mvp-routes';
import { storeInit } from '../server/services/store';
import { applySecurityMiddleware } from '../server/security';

const app = express();
applySecurityMiddleware(app);
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

app.get('/health', (_req, res) => {
  try {
    const attest = attestStatus();
    res.json({
      status: 'ok',
      product: 'echosign-attest',
      version: '1.0.0-rc.1',
      host: 'vercel-serverless',
      mode: attest.demoMode ? 'demo' : 'persistent-keys',
      storage: 'file',
      dataDir: process.env.ATTEST_DATA_DIR,
      timestamp: new Date().toISOString(),
      attest: {
        ready: attest.ready,
        algorithm: attest.algorithm,
        keyFingerprint: attest.keyFingerprint,
      },
      store: storeInit(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.get('/api/v1/openapi.json', (_req, res) => {
  const yamlPath = path.join(process.cwd(), 'openapi', 'openapi-v1.yaml');
  if (!existsSync(yamlPath)) return res.status(404).json({ error: 'OpenAPI spec missing' });
  res.type('application/yaml').send(readFileSync(yamlPath, 'utf8'));
});

registerMvpRoutes(app);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api]', err);
  res.status(500).json({
    error: err instanceof Error ? err.message : 'Internal error',
  });
});

export default app;

/**
 * Vercel serverless entry — Express without listen().
 * DEMO_MODE=1 recommended for public pilot preview.
 */
import express from 'express';
import path from 'path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { attestStatus } from '../server/services/attest.js';
import { registerMvpRoutes } from '../server/mvp-routes.js';
import { storeInit } from '../server/services/store.js';
import { applySecurityMiddleware } from '../server/security.js';

const app = express();

if (!process.env.DEMO_MODE && !process.env.KMS_MASTER_KEY) {
  process.env.DEMO_MODE = '1';
  process.env.ATTEST_OFFLINE = process.env.ATTEST_OFFLINE || '1';
}

applySecurityMiddleware(app);
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

app.get('/health', (_req, res) => {
  const attest = attestStatus();
  res.json({
    status: 'ok',
    product: 'echosign-attest',
    version: '1.0.0-rc.1',
    mode: attest.demoMode ? 'demo' : 'persistent-keys',
    storage: 'file',
    timestamp: new Date().toISOString(),
    attest: {
      ready: attest.ready,
      algorithm: attest.algorithm,
      keyFingerprint: attest.keyFingerprint,
    },
    store: storeInit(),
  });
});

app.get('/api/v1/openapi.json', (_req, res) => {
  const yamlPath = path.join(process.cwd(), 'openapi', 'openapi-v1.yaml');
  if (!existsSync(yamlPath)) return res.status(404).json({ error: 'OpenAPI spec missing' });
  res.type('application/yaml').send(readFileSync(yamlPath, 'utf8'));
});

registerMvpRoutes(app);

export default app;

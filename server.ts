import express from 'express';
import path from 'path';
import { readFileSync, existsSync } from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { attestStatus } from './server/services/attest';
import { registerMvpRoutes } from './server/mvp-routes';
import { storeInit } from './server/services/store';
import { isPgEnabled, migrate, pgHealth } from './server/services/store-pg';
import { assertSafeRuntime, applySecurityMiddleware } from './server/security';

async function startServer() {
  assertSafeRuntime();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  applySecurityMiddleware(app);
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));

  if (isPgEnabled()) {
    try {
      await migrate();
      console.log('[store] Postgres migrations applied');
    } catch (err) {
      console.error('[store] Postgres migrate failed:', err);
      if (process.env.NODE_ENV === 'production') process.exit(1);
    }
  }

  app.get('/health', async (_req, res) => {
    const attest = attestStatus();
    const pg = isPgEnabled() ? await pgHealth() : { ok: true };
    res.json({
      status: pg.ok === false ? 'degraded' : 'ok',
      product: 'echosign-attest',
      version: '0.5.0-wp6',
      mode: attest.demoMode ? 'demo' : 'persistent-keys',
      storage: isPgEnabled() ? 'postgres' : 'file',
      timestamp: new Date().toISOString(),
      attest: {
        ready: attest.ready,
        algorithm: attest.algorithm,
        keyFingerprint: attest.keyFingerprint,
      },
      store: storeInit(),
      postgres: isPgEnabled() ? pg : undefined,
    });
  });

  app.get('/api/v1/openapi.json', (_req, res) => {
    const yamlPath = path.join(process.cwd(), 'openapi', 'openapi-v1.yaml');
    if (!existsSync(yamlPath)) return res.status(404).json({ error: 'OpenAPI spec missing' });
    res.type('application/yaml').send(readFileSync(yamlPath, 'utf8'));
  });

  registerMvpRoutes(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoSign Attest on http://0.0.0.0:${PORT} storage=${isPgEnabled() ? 'postgres' : 'file'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});

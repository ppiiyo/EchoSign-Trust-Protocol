import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { attestStatus } from './server/services/attest';
import { registerMvpRoutes } from './server/mvp-routes';
import { storeInit } from './server/services/store';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));

  app.get('/health', (_req, res) => {
    const attest = attestStatus();
    res.json({
      status: 'ok',
      product: 'echosign-attest',
      version: '0.4.0-wp1',
      mode: attest.demoMode ? 'demo' : 'persistent-keys',
      timestamp: new Date().toISOString(),
      attest: { ready: attest.ready, algorithm: attest.algorithm, keyFingerprint: attest.keyFingerprint },
      store: storeInit(),
    });
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
    console.log(`EchoSign Attest on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});

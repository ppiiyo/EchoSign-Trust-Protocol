/**
 * Ops: structured logs, request-id, /metrics, deep /healthz (WP-8).
 */
import type { Express, Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';
import { existsSync, accessSync, constants } from 'node:fs';
import { join } from 'node:path';
import { isPgEnabled, pgHealth } from './services/store-pg.ts';
import { attestStatus } from './services/attest.ts';
import { currentRoot, loadEntries } from './services/transparency-log.ts';
import { getLogRoot } from './services/persistence.ts';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function log(level: LogLevel, msg: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

export function metricInc(name: string, by = 1): void {
  counters.set(name, (counters.get(name) || 0) + by);
}

export function metricObserve(name: string, valueMs: number): void {
  const arr = histograms.get(name) || [];
  arr.push(valueMs);
  if (arr.length > 500) arr.shift();
  histograms.set(name, arr);
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)));
  return sorted[idx];
}

export function renderMetrics(): string {
  const lines: string[] = [];
  lines.push('# HELP echosign_info Static labels');
  lines.push('# TYPE echosign_info gauge');
  lines.push('echosign_info{product="echosign-attest"} 1');
  for (const [name, val] of counters) {
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name} ${val}`);
  }
  for (const [name, arr] of histograms) {
    const sorted = [...arr].sort((a, b) => a - b);
    lines.push(`# TYPE ${name} summary`);
    lines.push(`${name}_count ${sorted.length}`);
    lines.push(`${name}_sum ${sorted.reduce((a, b) => a + b, 0)}`);
    lines.push(`${name}{quantile="0.5"} ${quantile(sorted, 0.5)}`);
    lines.push(`${name}{quantile="0.95"} ${quantile(sorted, 0.95)}`);
  }
  try {
    const root = currentRoot();
    lines.push('# TYPE echosign_log_tree_size gauge');
    lines.push(`echosign_log_tree_size ${root.treeSize}`);
  } catch { /* */ }
  return lines.join('\n') + '\n';
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || randomBytes(8).toString('hex');
  (req as Request & { requestId?: string }).requestId = id;
  res.setHeader('X-Request-Id', id);
  const start = Date.now();
  res.on('finish', () => {
    metricInc('echosign_http_requests_total');
    metricObserve('echosign_http_request_duration_ms', Date.now() - start);
    log('info', 'request', {
      requestId: id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
}

export async function deepHealth(): Promise<{
  status: 'ok' | 'degraded' | 'fail';
  checks: Record<string, { ok: boolean; detail?: string }>;
}> {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};
  try {
    const st = attestStatus();
    checks.keystore = { ok: !!st.ready, detail: st.ready ? `fp=${st.keyFingerprint}` : st.error || 'not ready' };
  } catch (e) {
    checks.keystore = { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
  const dataDir = process.env.ATTEST_DATA_DIR || join(process.cwd(), 'data');
  try {
    if (!existsSync(dataDir)) checks.storage = { ok: false, detail: `missing ${dataDir}` };
    else {
      accessSync(dataDir, constants.W_OK);
      checks.storage = { ok: true, detail: dataDir };
    }
  } catch (e) {
    checks.storage = { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
  if (isPgEnabled()) {
    const pg = await pgHealth();
    checks.postgres = { ok: pg.ok, detail: pg.error };
  } else {
    checks.postgres = { ok: true, detail: 'file-mode (DATABASE_URL unset)' };
  }
  try {
    if (isPgEnabled()) {
      const root = await getLogRoot();
      checks.log = { ok: true, detail: `treeSize=${root.treeSize}` };
    } else {
      const entries = loadEntries();
      const root = currentRoot(entries);
      checks.log = { ok: true, detail: `treeSize=${root.treeSize}` };
    }
  } catch (e) {
    checks.log = { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
  const values = Object.values(checks);
  const anyFail = values.some((c) => !c.ok);
  const status = anyFail ? (checks.keystore?.ok === false ? 'fail' : 'degraded') : 'ok';
  return { status, checks };
}

export function registerOpsRoutes(app: Express): void {
  app.get('/metrics', (_req, res) => {
    res.type('text/plain; version=0.0.4').send(renderMetrics());
  });
  app.get('/healthz', async (_req, res) => {
    const h = await deepHealth();
    if (h.status === 'degraded' && h.checks.postgres && !h.checks.postgres.ok) {
      return res.status(503).json(h);
    }
    const code = h.status === 'fail' ? 503 : 200;
    res.status(code).json(h);
  });
}

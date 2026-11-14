#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, createPublicKey, verify } from 'node:crypto';
import { spawnSync } from 'node:child_process';

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const k of Object.keys(value).sort()) sorted[k] = sortKeys(value[k]);
    return sorted;
  }
  return value;
}
const canonicalJson = (v) => JSON.stringify(sortKeys(v));

function fingerprintSvg(text, size = 128) {
  const h = createHash('sha256').update(text).digest();
  const n = 16; const cell = size / n; let rects = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const bit = (h[(y * n + x) % h.length] >> (x % 8)) & 1;
    if (bit) rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#0f172a"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#f8fafc"/>${rects}</svg>`;
}

function minimalPdf(lines) {
  const contentLines = lines.map((l, i) => `BT /F1 10 Tf 50 ${750 - i * 14} Td (${l.replace(/[()\\]/g, '')}) Tj ET`);
  const stream = contentLines.join('\n');
  const objs = [];
  objs.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n');
  objs.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n');
  objs.push('3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n');
  objs.push(`4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`);
  objs.push('5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n');
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  for (const o of objs) { offsets.push(Buffer.byteLength(pdf, 'utf8')); pdf += o; }
  const xrefPos = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  pdf += `trailer<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

const args = process.argv.slice(2);
if (args.length < 1) { console.error('Usage: node scripts/report-integrity.mjs <bundle.esatt.json> [--out dir]'); process.exit(2); }
const bundlePath = args[0];
let outDir = 'tmp-report';
const oi = args.indexOf('--out'); if (oi >= 0) outDir = args[oi + 1];
const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));
const { manifest, signatureB64u, publicKeyPem } = bundle;
if (!manifest || !signatureB64u || !publicKeyPem) { console.error('Invalid bundle'); process.exit(2); }
const canonical = canonicalJson(manifest);
const contentHash = createHash('sha256').update(canonical, 'utf8').digest('hex');
const sigValid = verify(null, Buffer.from(canonical, 'utf8'), createPublicKey(publicKeyPem), Buffer.from(signatureB64u, 'base64url'));
const cli = spawnSync(process.execPath, [join(process.cwd(), 'scripts/verify-bundle.mjs'), bundlePath, '--json'], { encoding: 'utf8' });
let verifyJson; try { verifyJson = JSON.parse(cli.stdout || '{}'); } catch { verifyJson = { signatureValid: sigValid, contentHash }; }
mkdirSync(outDir, { recursive: true });
const svg = fingerprintSvg(contentHash + '|' + (bundle.packageId || ''));
writeFileSync(join(outDir, 'fingerprint.svg'), svg);
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>EchoSign Integrity Report</title>
<style>body{font-family:system-ui;max-width:720px;margin:2rem auto} .banner{background:#fff7ed;border:1px solid #fdba74;padding:.75rem} .ok{color:#047857;font-weight:700} .bad{color:#b91c1c;font-weight:700} code{word-break:break-all}</style></head><body>
<h1>EchoSign Integrity Report</h1>
<div class="banner"><strong>Proves</strong> integrity of signed manifest at signing time.<br/><strong>Does not prove</strong> human speaker, deepfake detection, or legal seal.</div>
<p class="${sigValid ? 'ok' : 'bad'}">Signature: ${sigValid ? 'VALID' : 'INVALID'}</p>
<p>Hash: <code>${contentHash}</code></p>
<p>Clock: ${bundle.timeAttestation?.clockSource || 'unknown'}</p>
<div>${svg}</div>
<pre>${JSON.stringify(verifyJson, null, 2)}</pre>
</body></html>`;
writeFileSync(join(outDir, 'report.html'), html);
writeFileSync(join(outDir, 'report.pdf'), minimalPdf([
  'EchoSign Integrity Report',
  `Signature: ${sigValid ? 'VALID' : 'INVALID'}`,
  `Hash: ${contentHash}`,
  `Clock: ${bundle.timeAttestation?.clockSource || 'unknown'}`,
  'Proves: integrity of signed manifest at signing time.',
  'Does NOT prove: human speaker, deepfake detection, legal seal.',
]));
writeFileSync(join(outDir, 'report.json'), JSON.stringify({ ...verifyJson, generatedAt: new Date().toISOString() }, null, 2));
console.log('Report written to', outDir);
process.exit(sigValid ? 0 : 1);

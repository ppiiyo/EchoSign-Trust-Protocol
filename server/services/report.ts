/**
 * Integrity report builder (WP-6). Honest levels only.
 */
import type { ProofPackage } from './store.ts';

export type ReportLevel = {
  id: 'L1' | 'L2' | 'L3' | 'L4';
  title: string;
  status: 'pass' | 'fail' | 'stored' | 'not-checked';
  detail: string;
};

export function buildIntegrityReport(
  pkg: ProofPackage,
  opts: { signatureValid?: boolean; baseUrl?: string } = {}
) {
  const sig = opts.signatureValid;
  const levels: ReportLevel[] = [
    {
      id: 'L1',
      title: 'Ed25519 signature over canonical manifest',
      status: sig === true ? 'pass' : sig === false ? 'fail' : 'not-checked',
      detail:
        sig === true
          ? 'Signature verified against package public key'
          : sig === false
            ? 'Signature invalid'
            : 'Re-verify with verify endpoint or CLI',
    },
    {
      id: 'L2',
      title: 'Time attestation (TSA / OTS)',
      status: 'stored',
      detail: `Stored statuses only — TSA=${pkg.timeAttestation?.tsa?.status ?? 'n/a'}, OTS=${pkg.timeAttestation?.ots?.status ?? 'n/a'}, clock=${pkg.timeAttestation?.clockSource ?? 'n/a'}. Independent check: openssl ts / ots verify.`,
    },
    {
      id: 'L3',
      title: 'Transparency log inclusion',
      status: 'stored',
      detail: 'Confirm against published/signed daily root via /api/v1/log/* or CLI.',
    },
    {
      id: 'L4',
      title: 'Key lifecycle (JWKS)',
      status: 'not-checked',
      detail: `Fingerprint ${pkg.keyFingerprint}. Check /api/v1/attest/jwks for status and revokedAt vs signing time.`,
    },
  ];

  const payload = `echosign:v1:${pkg.id}:${pkg.audioContentHash}`;
  const verifyPath = opts.baseUrl
    ? `${opts.baseUrl.replace(/\/$/, '')}/verify/`
    : '/verify/';

  return {
    product: 'echosign-attest',
    reportType: 'integrity',
    disclaimer:
      'Not a forensic examination. Proves integrity of audio bytes at signing time and control of the signing key — not that a human was speaking.',
    packageId: pkg.id,
    createdAt: pkg.createdAt,
    contentHash: pkg.audioContentHash,
    keyFingerprint: pkg.keyFingerprint,
    levels,
    timeAttestation: pkg.timeAttestation ?? null,
    qrPayload: payload,
    verifyUrl: verifyPath,
    generatedAt: new Date().toISOString(),
  };
}

export function reportToHtml(report: ReturnType<typeof buildIntegrityReport>): string {
  const rows = report.levels
    .map(
      (l) =>
        `<tr><td>${l.id}</td><td>${l.title}</td><td>${l.status}</td><td>${escapeHtml(l.detail)}</td></tr>`
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>EchoSign report ${escapeHtml(report.packageId)}</title>
  <style>body{font-family:system-ui;max-width:48rem;margin:2rem auto;padding:0 1rem;color:#0f172a}
  table{border-collapse:collapse;width:100%;font-size:0.9rem}td,th{border:1px solid #cbd5e1;padding:0.4rem 0.5rem;text-align:left}
  .warn{background:#fffbeb;border:1px solid #f59e0b;padding:0.75rem;border-radius:0.5rem;margin:1rem 0}</style></head><body>
  <h1>EchoSign integrity report</h1>
  <div class="warn">${escapeHtml(report.disclaimer)}</div>
  <p><strong>Package</strong> ${escapeHtml(report.packageId)}<br/>
  <strong>Content hash</strong> <code>${escapeHtml(report.contentHash)}</code><br/>
  <strong>Key</strong> <code>${escapeHtml(report.keyFingerprint)}</code></p>
  <table><thead><tr><th>Level</th><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>
  <p>QR payload: <code>${escapeHtml(report.qrPayload)}</code><br/>
  Offline verifier: <code>${escapeHtml(report.verifyUrl)}</code></p>
  <p style="color:#64748b;font-size:0.8rem">Generated ${escapeHtml(report.generatedAt)}</p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

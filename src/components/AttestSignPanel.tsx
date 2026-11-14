import React, { useCallback, useRef, useState } from 'react';
import {
  UploadCloud, FileAudio, ShieldCheck, Key, Download, Copy, Check,
  Loader2, AlertTriangle, ExternalLink, Package,
} from 'lucide-react';

interface SignResponse {
  packageId?: string;
  manifest: unknown;
  signatureB64u: string;
  publicKeyPem: string;
  keyFingerprint: string;
  contentHash?: string;
  disclaimer?: string;
  verifyUrl?: string;
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(
      res.status >= 500
        ? `API unavailable (HTTP ${res.status}). Serverless backend error — try again or use local demo.`
        : `Invalid API response (HTTP ${res.status})`
    );
  }
}

export const AttestSignPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const createKey = async () => {
    setError(null);
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ui-panel' }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(String(data.error || `HTTP ${res.status}`));
      if (typeof data.secret === 'string') setApiKey(data.secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Key create failed');
    }
  };

  const sign = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('deviceId', 'ui_browser');
      form.append('offline', '1');
      const headers: Record<string, string> = {};
      if (apiKey.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;
      const res = await fetch('/api/v1/attest/sign', { method: 'POST', headers, body: form });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(String(data.error || `HTTP ${res.status}`));
      setResult(data as unknown as SignResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadBundle = () => {
    if (!result) return;
    const bundle = {
      format: 'echosign-attest-bundle-v1',
      packageId: result.packageId,
      manifest: result.manifest,
      signatureB64u: result.signatureB64u,
      publicKeyPem: result.publicKeyPem,
      disclaimer: result.disclaimer,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.packageId || 'attest'}.esatt.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPart = (name: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-900/50 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Attest — Sign audio
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Creates an Ed25519 proof package for the file bytes. Proves integrity at signing time —
              not that a human was speaking.
            </p>
          </div>
          <a href="/verify/" target="_blank" rel="noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0">
            Offline verifier <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <label className="flex-1 text-xs text-slate-400">
            API key <span className="text-slate-600">(optional in DEMO_MODE)</span>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="esk_live_…"
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 font-mono" />
          </label>
          <button type="button" onClick={createKey}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200">
            <Key className="w-3.5 h-3.5" /> Create key
          </button>
        </div>
      </div>

      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)} onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
        }`}>
        <input ref={inputRef} type="file" accept="audio/*,.wav,.mp3,.webm,.ogg" className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300 font-medium">Drop audio or click to select</p>
        <p className="text-xs text-slate-500 mt-1">WAV / MP3 / WebM — hashed and signed as-is</p>
        {file && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200">
            <FileAudio className="w-4 h-4 text-cyan-400" />
            {file.name}
            <span className="text-slate-500 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!file || loading} onClick={sign}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
          Sign & create package
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" /> Package signed
            </h3>
            {result.packageId && (
              <span className="font-mono text-xs text-slate-500">{result.packageId}</span>
            )}
          </div>
          <p className="text-xs text-amber-500/90 border border-amber-900/40 rounded-lg px-3 py-2 bg-amber-950/20">
            {result.disclaimer ||
              'Signature proves integrity of the audio bytes at signing time. It does not prove a human was speaking.'}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-slate-500 uppercase tracking-wide">Key fingerprint</dt>
              <dd className="font-mono text-cyan-300 mt-0.5">{result.keyFingerprint}</dd>
            </div>
            <div>
              <dt className="text-slate-500 uppercase tracking-wide">Signature</dt>
              <dd className="font-mono text-slate-300 mt-0.5 truncate">{result.signatureB64u}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadBundle}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-100">
              <Download className="w-3.5 h-3.5" /> Download .esatt.json
            </button>
            <button type="button" onClick={() => downloadPart('manifest.json', JSON.stringify(result.manifest, null, 2))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200">manifest.json</button>
            <button type="button" onClick={() => downloadPart('signature.b64u', result.signatureB64u)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200">signature.b64u</button>
            <button type="button" onClick={() => downloadPart('public.pem', result.publicKeyPem)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200">public.pem</button>
            <button type="button" onClick={() => copy('sig', result.signatureB64u)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
              {copied === 'sig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy signature
            </button>
            <a href="/verify/" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 text-emerald-400 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-950/40">
              Open offline verifier
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttestSignPanel;

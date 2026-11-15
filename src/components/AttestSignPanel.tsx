import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  timeAttestation?: { clockSource?: string; tsa?: { status?: string }; ots?: { status?: string } };
  limitations?: string;
}

const glass = 'rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/40';

export const AttestSignPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File) => { setFile(f); setResult(null); setError(null); }, []);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0]; if (f) onFile(f);
  };

  const createKey = async () => {
    setError(null);
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ui-panel' }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = text ? JSON.parse(text) : {}; }
      catch { throw new Error(`API unavailable (HTTP ${res.status}). Backend not ready.`); }
      if (!res.ok) throw new Error(String(data.error || `HTTP ${res.status}`));
      if (typeof data.secret === 'string') setApiKey(data.secret);
    } catch (err) { setError(err instanceof Error ? err.message : 'Key create failed'); }
  };

  // Vercel serverless request body ~4.5MB on hobby — fail fast with honest message
  const DEMO_MAX_BYTES = 4 * 1024 * 1024;

  const sign = async () => {
    if (!file) return;
    if (file.size > DEMO_MAX_BYTES) {
      setError(
        `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Limited demo host accepts up to ~4 MB (Vercel body limit). Use a shorter clip or docker compose for full 50 MB (docs/DEPLOYMENT.md).`
      );
      return;
    }
    setLoading(true); setError(null); setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('deviceId', 'ui_browser');
      const headers: Record<string, string> = {};
      if (apiKey.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;
      const res = await fetch('/api/v1/attest/sign', { method: 'POST', headers, body: form });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = text ? JSON.parse(text) : {}; }
      catch {
        if (res.status === 413) {
          throw new Error('Payload too large (HTTP 413). Limited demo accepts ~4 MB max. Use a shorter clip or docker compose.');
        }
        throw new Error(res.status >= 500
          ? `API unavailable (HTTP ${res.status}). Serverless backend error — try again or use local demo.`
          : `Invalid API response (HTTP ${res.status})`);
      }
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Payload too large (HTTP 413). Limited demo accepts ~4 MB max. Use a shorter clip or docker compose.');
        }
        throw new Error(String(data.error || `HTTP ${res.status}`));
      }
      setResult(data as unknown as SignResponse);
    } catch (err) { setError(err instanceof Error ? err.message : 'Sign failed'); }
    finally { setLoading(false); }
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
      keyFingerprint: result.keyFingerprint,
      contentHash: result.contentHash,
      timeAttestation: result.timeAttestation,
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

  return (
    <div className="space-y-5">
      <motion.section className={`${glass} p-6 sm:p-8`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </span>
              Sign audio
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              Builds a canonical manifest, signs with Ed25519, returns a proof package you can verify offline.
            </p>
          </div>
          <a href="/verify/" className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 shrink-0">
            Offline verifier <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <label className="flex-1 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            API key <span className="normal-case tracking-normal text-slate-600 font-normal ml-1">(optional in DEMO_MODE)</span>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="esk_live_…"
              className="mt-1.5 w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
          </label>
          <motion.button type="button" onClick={createKey} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200">
            <Key className="w-3.5 h-3.5 text-cyan-400" /> Create key
          </motion.button>
        </div>
      </motion.section>

      <motion.div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={onDrop} onClick={() => inputRef.current?.click()}
        className={`${glass} cursor-pointer p-10 sm:p-12 text-center transition-all duration-300 ${dragging ? 'border-emerald-400/50 bg-emerald-500/10 scale-[1.01]' : 'hover:border-white/20'}`}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <input ref={inputRef} type="file" accept="audio/*,.wav,.mp3,.webm,.ogg" className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center">
          <UploadCloud className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-200 font-medium text-[15px]">Drop audio or click to select</p>
        <p className="text-xs text-slate-500 mt-1.5">WAV · MP3 · WebM — hashed and signed as-is</p>
        <AnimatePresence>
          {file && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="mt-5 inline-flex items-center gap-2.5 rounded-2xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-slate-200">
              <FileAudio className="w-4 h-4 text-cyan-400" />
              <span className="max-w-[14rem] truncate">{file.name}</span>
              <span className="text-slate-500 text-xs tabular-nums">{(file.size / 1024).toFixed(1)} KB</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button type="button" disabled={!file || loading} onClick={sign}
        whileHover={!file || loading ? {} : { scale: 1.02 }} whileTap={!file || loading ? {} : { scale: 0.98 }}
        className="relative inline-flex items-center gap-2.5 rounded-2xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-40 overflow-hidden">
        <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600" />
        <span className="relative flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
          {loading ? 'Signing…' : 'Sign & create package'}
        </span>
      </motion.button>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />{error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className={`${glass} p-6 sm:p-8 space-y-5 border-emerald-500/20`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-emerald-300 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20"><Check className="w-4 h-4" /></span>
                Package signed
              </h3>
              {result.packageId && (
                <span className="font-mono text-[11px] text-slate-500 bg-black/30 px-2 py-1 rounded-lg border border-white/5">{result.packageId}</span>
              )}
            </div>
            <p className="text-xs text-amber-200/90 border border-amber-500/20 rounded-2xl px-4 py-3 bg-amber-500/5 leading-relaxed">
              {result.disclaimer || 'Signature proves integrity of the audio bytes at signing time. It does not prove a human was speaking.'}
              {result.limitations ? <span className="block mt-1.5 text-amber-200/60">{result.limitations}</span> : null}
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/25 border border-white/5 px-4 py-3">
                <dt className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Key fingerprint</dt>
                <dd className="text-sm text-slate-200 font-mono break-all flex items-start gap-2">
                  {result.keyFingerprint}
                  <button type="button" className="text-slate-500 hover:text-cyan-400 shrink-0" onClick={() => copy('fp', result.keyFingerprint)}>
                    {copied === 'fp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </dd>
              </div>
              <div className="rounded-2xl bg-black/25 border border-white/5 px-4 py-3">
                <dt className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Content hash</dt>
                <dd className="text-sm text-slate-200 font-mono break-all">{result.contentHash || '—'}</dd>
              </div>
              <div className="rounded-2xl bg-black/25 border border-white/5 px-4 py-3 sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Clock / TSA / OTS</dt>
                <dd className="text-sm text-slate-200 font-mono">
                  {result.timeAttestation?.clockSource || 'n/a'} · TSA {result.timeAttestation?.tsa?.status || 'n/a'} · OTS {result.timeAttestation?.ots?.status || 'n/a'}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-1">
              <motion.button type="button" onClick={downloadBundle} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-xs font-bold">
                <Download className="w-3.5 h-3.5" /> Download .esatt.json
              </motion.button>
              <button type="button" onClick={() => copy('sig', result.signatureB64u)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200">
                {copied === 'sig' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy signature
              </button>
              <a href="/verify/" className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300">
                Verify offline <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttestSignPanel;

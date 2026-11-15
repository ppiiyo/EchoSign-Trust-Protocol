import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { AttestSignPanel } from './components/AttestSignPanel';
import { AppTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('attest');

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500/40 selection:text-white relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#05070c]" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[40vh] rounded-full bg-emerald-600/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.08) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} chainStats={null} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-8 sm:mb-10">
            <motion.p
              className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400/80 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Pilot · v1.0.0-rc.2
            </motion.p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white max-w-2xl leading-[1.15]">
              Sign audio. Prove integrity.{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Verify offline.
              </span>
            </h1>
            <p className="mt-3 text-slate-400 max-w-xl text-sm sm:text-[15px] leading-relaxed">
              Ed25519 attestation of file bytes — not deepfake detection, not “human vs AI”.
              Download a proof package and open the offline verifier.
            </p>
          </div>

          {activeTab === 'attest' && <AttestSignPanel />}
        </motion.div>
      </main>

      <footer className="border-t border-white/5 bg-black/20 backdrop-blur-md py-6 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="text-slate-300 font-medium">EchoSign Attest</span>
            <span className="text-slate-700">·</span>
            <span>Integrity & provenance only</span>
            <span className="text-slate-700">·</span>
            <a href="/verify/" className="text-emerald-400/90 hover:text-emerald-300 transition-colors">
              Offline verify
            </a>
            <span className="text-slate-700">·</span>
            <a
              href="https://echosign-attest.vercel.app"
              className="text-cyan-400/90 hover:text-cyan-300 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Live demo
            </a>
          </div>
          <p className="text-amber-500/70 text-[11px] text-center sm:text-right">
            Signed ≠ a human was speaking. Not certified expertise.
          </p>
        </div>
      </footer>
    </div>
  );
}

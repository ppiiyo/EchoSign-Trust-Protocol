import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AttestSignPanel } from './components/AttestSignPanel';
import { AppTab } from './types';

/** Product UI: Attest only. Legacy mocks on branch legacy-demo. */
export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('attest');

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white font-sans antialiased">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} chainStats={null} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'attest' && <AttestSignPanel />}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-400">EchoSign Attest</span>
            <span>•</span>
            <span>Integrity & provenance — not deepfake detection</span>
            <span>•</span>
            <a href="/verify/" className="text-emerald-500/90 hover:text-emerald-400">Offline verify</a>
            <span>•</span>
            <a href="https://github.com/ppiiyo/EchoSign-Trust-Protocol/blob/main/docs/THREAT_MODEL.md" className="text-cyan-500/80 hover:text-cyan-400" target="_blank" rel="noreferrer">Threat model</a>
          </div>
          <div className="text-amber-600/80 text-[11px]">Signed ≠ human was speaking. Not a certified expertise.</div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Link2, CheckCircle2, Mic, Users, Key,
  Webhook, Chrome, ShieldAlert, Radio, Boxes, Award, ChevronDown,
} from 'lucide-react';
import { AppTab, ChainStats } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  chainStats: ChainStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, chainStats }) => {
  const [b2bOpen, setB2bOpen] = useState(false);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const isB2bActive = ['webhooks', 'extension', 'soc'].includes(activeTab);
  const isEnterpriseActive = ['telephony', 'deployment', 'compliance'].includes(activeTab);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('attest')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-200">
                EchoSign
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-mono font-medium">
                Demo v0.3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Attest integrity · Offline verify · Heuristic liveness (demo)
            </p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('attest')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'attest'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Attest</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'verify'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Детекция</span>
          </button>

          <a
            href="/verify/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-emerald-400/90 hover:text-emerald-300 hover:bg-slate-800/60 border border-emerald-900/50"
            title="Offline integrity verifier"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Offline Verify</span>
          </a>

          <button
            onClick={() => setActiveTab('diarization')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'diarization'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Спикеры</span>
          </button>

          <button
            onClick={() => setActiveTab('developers')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'developers'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API</span>
          </button>

          <div className="relative">
            <button
              onClick={() => { setB2bOpen(!b2bOpen); setEnterpriseOpen(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                isB2bActive ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>B2B</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {b2bOpen && (
              <div className="absolute top-full mt-1 left-0 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                <button onClick={() => { setActiveTab('webhooks'); setB2bOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <Webhook className="w-4 h-4 text-cyan-400" /><span>Webhooks</span>
                </button>
                <button onClick={() => { setActiveTab('extension'); setB2bOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <Chrome className="w-4 h-4 text-emerald-400" /><span>Extension</span>
                </button>
                <button onClick={() => { setActiveTab('soc'); setB2bOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /><span>SOC (sim)</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setEnterpriseOpen(!enterpriseOpen); setB2bOpen(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                isEnterpriseActive ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {enterpriseOpen && (
              <div className="absolute top-full mt-1 left-0 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                <button onClick={() => { setActiveTab('telephony'); setEnterpriseOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <Radio className="w-4 h-4" /><span>Telephony (sim)</span>
                </button>
                <button onClick={() => { setActiveTab('deployment'); setEnterpriseOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <Boxes className="w-4 h-4" /><span>Deploy</span>
                </button>
                <button onClick={() => { setActiveTab('compliance'); setEnterpriseOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <Award className="w-4 h-4" /><span>Compliance (sim)</span>
                </button>
                <button onClick={() => { setActiveTab('watermark'); setEnterpriseOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <Lock className="w-4 h-4" /><span>Watermark</span>
                </button>
                <button onClick={() => { setActiveTab('blockchain'); setEnterpriseOpen(false); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <Link2 className="w-4 h-4" /><span>Ledger (sim)</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center space-x-2">
          {chainStats && (
            <div onClick={() => setActiveTab('blockchain')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs border font-mono bg-slate-900 border-slate-700 text-slate-400 cursor-pointer">
              <span className="hidden sm:inline">sim ledger</span>
              <span className="text-[10px]">{chainStats.totalBlocks} blk</span>
            </div>
          )}
        </div>
      </div>

      <div className="lg:hidden flex items-center space-x-1 bg-slate-900 border-t border-slate-800 py-2 px-3 overflow-x-auto text-xs whitespace-nowrap">
        <button onClick={() => setActiveTab('attest')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'attest' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Attest</button>
        <button onClick={() => setActiveTab('verify')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'verify' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Детекция</button>
        <a href="/verify/" className="px-2.5 py-1 rounded-lg text-emerald-400">Offline</a>
        <button onClick={() => setActiveTab('developers')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'developers' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>API</button>
      </div>
    </header>
  );
};

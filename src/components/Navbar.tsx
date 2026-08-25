import React from 'react';
import { ShieldCheck, Lock, Link2, Activity, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ChainStats } from '../types';

interface NavbarProps {
  activeTab: 'verify' | 'watermark' | 'blockchain' | 'forensics' | 'audit';
  setActiveTab: (tab: 'verify' | 'watermark' | 'blockchain' | 'forensics' | 'audit') => void;
  chainStats: ChainStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, chainStats }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Protocol Status */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-200">
                EchoSign Trust Protocol
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-mono font-medium">
                v4.0.0 PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Аутентификация аудио • DCT+HMAC водяные знаки • Liveness • Блокчейн
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-tab-verify"
            onClick={() => setActiveTab('verify')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'verify'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Верификация</span>
          </button>

          <button
            id="nav-tab-watermark"
            onClick={() => setActiveTab('watermark')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'watermark'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Водяной Знак</span>
          </button>

          <button
            id="nav-tab-blockchain"
            onClick={() => setActiveTab('blockchain')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'blockchain'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Блокчейн Реестр</span>
          </button>

          <button
            id="nav-tab-forensics"
            onClick={() => setActiveTab('forensics')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'forensics'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Спектр & Атаки</span>
          </button>

          <button
            id="nav-tab-audit"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm'
                : 'text-amber-400/90 hover:text-amber-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Технический Аудит</span>
          </button>
        </nav>

        {/* Live Blockchain Stats Badge */}
        <div className="flex items-center space-x-2">
          {chainStats && (
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs border font-mono ${
                chainStats.isValid
                  ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400'
                  : 'bg-rose-950/70 border-rose-800/80 text-rose-400 animate-pulse'
              }`}
            >
              {chainStats.isValid ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden sm:inline">
                {chainStats.isValid ? 'Ledger OK' : 'Tampered!'}
              </span>
              <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-1.5">
                Блок #{chainStats.totalBlocks}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2 px-1">
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex flex-col items-center text-[10px] ${
            activeTab === 'verify' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Верификация</span>
        </button>
        <button
          onClick={() => setActiveTab('watermark')}
          className={`flex flex-col items-center text-[10px] ${
            activeTab === 'watermark' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Знак</span>
        </button>
        <button
          onClick={() => setActiveTab('blockchain')}
          className={`flex flex-col items-center text-[10px] ${
            activeTab === 'blockchain' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Блокчейн</span>
        </button>
        <button
          onClick={() => setActiveTab('forensics')}
          className={`flex flex-col items-center text-[10px] ${
            activeTab === 'forensics' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Спектр</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex flex-col items-center text-[10px] ${
            activeTab === 'audit' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Аудит</span>
        </button>
      </div>
    </header>
  );
};

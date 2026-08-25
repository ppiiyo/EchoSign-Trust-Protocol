import React from 'react';
import { ShieldCheck, Lock, Link2, CheckCircle2, AlertTriangle, Mic } from 'lucide-react';
import { ChainStats } from '../types';

interface NavbarProps {
  activeTab: 'verify' | 'watermark' | 'blockchain';
  setActiveTab: (tab: 'verify' | 'watermark' | 'blockchain') => void;
  chainStats: ChainStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, chainStats }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Protocol Status */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-200">
                EchoSign Voice Inspector
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono font-medium">
                Онлайн
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Инструмент детекции Deepfake, биометрии живого голоса и проверки подлинности
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden sm:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-tab-verify"
            onClick={() => setActiveTab('verify')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'verify'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Проверка Голоса</span>
          </button>

          <button
            id="nav-tab-watermark"
            onClick={() => setActiveTab('watermark')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'watermark'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Защита Аудио</span>
          </button>

          <button
            id="nav-tab-blockchain"
            onClick={() => setActiveTab('blockchain')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'blockchain'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Реестр Записей</span>
          </button>
        </nav>

        {/* Live Blockchain Stats Badge */}
        <div className="flex items-center space-x-2">
          {chainStats && (
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs border font-mono ${
                chainStats.isValid
                  ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400'
                  : 'bg-rose-950/70 border-rose-800/80 text-rose-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Реестр активен</span>
              <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-1.5">
                {chainStats.totalBlocks} записей
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="sm:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2 px-2">
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex flex-col items-center text-xs font-medium py-1 px-3 rounded-lg ${
            activeTab === 'verify' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mb-0.5" />
          <span>Проверка</span>
        </button>
        <button
          onClick={() => setActiveTab('watermark')}
          className={`flex flex-col items-center text-xs font-medium py-1 px-3 rounded-lg ${
            activeTab === 'watermark' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <Lock className="w-4 h-4 mb-0.5" />
          <span>Защита</span>
        </button>
        <button
          onClick={() => setActiveTab('blockchain')}
          className={`flex flex-col items-center text-xs font-medium py-1 px-3 rounded-lg ${
            activeTab === 'blockchain' ? 'text-cyan-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <Link2 className="w-4 h-4 mb-0.5" />
          <span>Реестр</span>
        </button>
      </div>
    </header>
  );
};

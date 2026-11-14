import React from 'react';
import { Lock, CheckCircle2, Mic } from 'lucide-react';
import { AppTab, ChainStats } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  chainStats: ChainStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('attest')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-cyan-600 to-blue-600 flex items-center justify-center border border-emerald-400/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight">EchoSign Attest</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 font-mono">product</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">Sign · store · offline verify</p>
          </div>
        </div>
        <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button type="button" onClick={() => setActiveTab('attest')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
              activeTab === 'attest' ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>
            <Lock className="w-3.5 h-3.5" /><span>Attest</span>
          </button>
          <a href="/verify/" target="_blank" rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-emerald-400/90 border border-emerald-900/50">
            <CheckCircle2 className="w-3.5 h-3.5" /><span>Offline verify</span>
          </a>
        </nav>
      </div>
    </header>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle2, Github, Sparkles } from 'lucide-react';
import { AppTab, ChainStats } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  chainStats: ChainStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070a11]/75 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <motion.button
          type="button"
          onClick={() => setActiveTab('attest')}
          className="flex items-center gap-3 group"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 opacity-40 blur-md group-hover:opacity-70 transition-opacity" />
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] tracking-tight text-white">EchoSign</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                Attest
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Cryptographic audio provenance</p>
          </div>
        </motion.button>

        <nav className="flex items-center gap-1.5">
          <div className="flex items-center p-1 rounded-2xl bg-white/[0.03] border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('attest')}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'attest' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'attest' && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600/90 to-cyan-600/90 shadow-lg shadow-emerald-500/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Sparkles className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Sign</span>
            </button>
            <a
              href="/verify/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-emerald-300 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Verify</span>
            </a>
          </div>
          <a
            href="https://github.com/ppiiyo/EchoSign-Trust-Protocol/tree/release/v1.0.0"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/10 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </nav>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Link2,
  CheckCircle2,
  Mic,
  Users,
  Key,
  Webhook,
  Chrome,
  ShieldAlert,
  Radio,
  Boxes,
  Award,
  ChevronDown
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
        
        {/* Brand & Protocol Status */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('verify')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-200">
                EchoSign Voice Inspector
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-medium">
                Enterprise v4.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Анти-Deepfake • Судебно-Акустическая Экспертиза • SIP Шлюз
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          
          {/* Phase 1 Main Tabs */}
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

          <button
            onClick={() => setActiveTab('diarization')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'diarization'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Спикеры (Склейки)</span>
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
            <span>API-ключи</span>
          </button>

          {/* Phase 2: B2B Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setB2bOpen(!b2bOpen);
                setEnterpriseOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                isB2bActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>B2B & SOC</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {b2bOpen && (
              <div className="absolute top-full mt-1 left-0 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setActiveTab('webhooks');
                    setB2bOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Webhook className="w-4 h-4 text-cyan-400" />
                  <span>REST v2 & Webhooks</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('extension');
                    setB2bOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Chrome className="w-4 h-4 text-emerald-400" />
                  <span>Браузерное расширение</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('soc');
                    setB2bOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>SOC Дашборд ИБ</span>
                </button>
              </div>
            )}
          </div>

          {/* Phase 3: Enterprise Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setEnterpriseOpen(!enterpriseOpen);
                setB2bOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                isEnterpriseActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>Enterprise & SIP</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {enterpriseOpen && (
              <div className="absolute top-full mt-1 left-0 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setActiveTab('telephony');
                    setEnterpriseOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>SIP/RTP Телефония</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('deployment');
                    setEnterpriseOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Boxes className="w-4 h-4 text-blue-400" />
                  <span>On-Premise (Docker/K8s)</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('compliance');
                    setEnterpriseOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>ГОСТ / ISO / SOC 2</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('watermark')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'watermark'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Водяной знак</span>
          </button>

          <button
            onClick={() => setActiveTab('blockchain')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'blockchain'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Реестр</span>
          </button>
        </nav>

        {/* Live Blockchain Stats Badge */}
        <div className="flex items-center space-x-2">
          {chainStats && (
            <div
              onClick={() => setActiveTab('blockchain')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs border font-mono bg-emerald-950/70 border-emerald-800/80 text-emerald-400 cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">L2 Anchor Active</span>
              <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-1.5">
                {chainStats.totalBlocks} блоков
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Horizontal Scrollable Bar */}
      <div className="lg:hidden flex items-center space-x-1 bg-slate-900 border-t border-slate-800 py-2 px-3 overflow-x-auto text-xs whitespace-nowrap">
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'verify' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Детекция
        </button>
        <button
          onClick={() => setActiveTab('diarization')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'diarization' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Спикеры
        </button>
        <button
          onClick={() => setActiveTab('developers')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'developers' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          API
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'webhooks' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Webhooks
        </button>
        <button
          onClick={() => setActiveTab('extension')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'extension' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Расширение
        </button>
        <button
          onClick={() => setActiveTab('soc')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'soc' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          SOC
        </button>
        <button
          onClick={() => setActiveTab('telephony')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'telephony' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          SIP/RTP
        </button>
        <button
          onClick={() => setActiveTab('deployment')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'deployment' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          K8s
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'compliance' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          ГОСТ/ISO
        </button>
        <button
          onClick={() => setActiveTab('watermark')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'watermark' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Водяной знак
        </button>
        <button
          onClick={() => setActiveTab('blockchain')}
          className={`px-2.5 py-1 rounded-lg ${activeTab === 'blockchain' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
        >
          Реестр
        </button>
      </div>
    </header>
  );
};

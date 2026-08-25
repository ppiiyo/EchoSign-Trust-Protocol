import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VerificationStudio } from './components/VerificationStudio';
import { WatermarkStudio } from './components/WatermarkStudio';
import { BlockchainExplorer } from './components/BlockchainExplorer';
import { ForensicsLab } from './components/ForensicsLab';
import { AuditReportView } from './components/AuditReportView';
import { ChainStats, VerificationResponse } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'verify' | 'watermark' | 'blockchain' | 'forensics' | 'audit'>('verify');
  const [chainStats, setChainStats] = useState<ChainStats | null>(null);

  const fetchChainStats = async () => {
    try {
      const res = await fetch('/api/v1/blockchain/stats');
      if (res.ok) {
        const data = await res.json();
        setChainStats(data);
      }
    } catch (e) {
      console.warn('Failed to fetch chain stats:', e);
    }
  };

  useEffect(() => {
    fetchChainStats();
    const interval = setInterval(fetchChainStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleVerificationComplete = (_res: VerificationResponse) => {
    fetchChainStats();
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white font-sans antialiased">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        chainStats={chainStats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'verify' && (
          <VerificationStudio onVerificationComplete={handleVerificationComplete} />
        )}

        {activeTab === 'watermark' && (
          <WatermarkStudio
            onTestInVerifier={() => {
              setActiveTab('verify');
            }}
          />
        )}

        {activeTab === 'blockchain' && (
          <BlockchainExplorer onChainUpdate={fetchChainStats} />
        )}

        {activeTab === 'forensics' && (
          <ForensicsLab />
        )}

        {activeTab === 'audit' && (
          <AuditReportView />
        )}
      </main>

      {/* Protocol Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-slate-400">EchoSign Trust Protocol v4.0.0</span>
            <span>•</span>
            <span>DCT / DSSS Watermarks</span>
            <span>•</span>
            <span>Proof-of-Work Blockchain</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Biometric Vocal Liveness & Speech Forensics • 2026 Production Standard
          </div>
        </div>
      </footer>
    </div>
  );
}

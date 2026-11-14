import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VerificationStudio } from './components/VerificationStudio';
import { SpeakerDiarizationStudio } from './components/SpeakerDiarizationStudio';
import { DeveloperPortal } from './components/DeveloperPortal';
import { WebhooksStudio } from './components/WebhooksStudio';
import { BrowserExtensionHub } from './components/BrowserExtensionHub';
import { SocDashboard } from './components/SocDashboard';
import { TelephonyStreamStudio } from './components/TelephonyStreamStudio';
import { EnterpriseDeploymentHub } from './components/EnterpriseDeploymentHub';
import { ComplianceAuditMatrix } from './components/ComplianceAuditMatrix';
import { WatermarkStudio } from './components/WatermarkStudio';
import { BlockchainExplorer } from './components/BlockchainExplorer';
import { AttestSignPanel } from './components/AttestSignPanel';
import { AppTab, ChainStats, VerificationResponse } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('attest');
  const [chainStats, setChainStats] = useState<ChainStats | null>(null);

  const fetchChainStats = async () => {
    try {
      const res = await fetch('/api/v1/blockchain/stats');
      if (res.ok) setChainStats(await res.json());
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
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} chainStats={chainStats} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'verify' && (
          <VerificationStudio onVerificationComplete={handleVerificationComplete} />
        )}
        {activeTab === 'attest' && <AttestSignPanel />}
        {activeTab === 'diarization' && <SpeakerDiarizationStudio />}
        {activeTab === 'developers' && <DeveloperPortal />}
        {activeTab === 'webhooks' && <WebhooksStudio />}
        {activeTab === 'extension' && <BrowserExtensionHub />}
        {activeTab === 'soc' && <SocDashboard />}
        {activeTab === 'telephony' && <TelephonyStreamStudio />}
        {activeTab === 'deployment' && <EnterpriseDeploymentHub />}
        {activeTab === 'compliance' && <ComplianceAuditMatrix />}
        {activeTab === 'watermark' && (
          <WatermarkStudio onTestInVerifier={() => setActiveTab('verify')} />
        )}
        {activeTab === 'blockchain' && (
          <BlockchainExplorer onChainUpdate={fetchChainStats} />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-400">EchoSign Demo v0.3</span>
            <span>•</span>
            <span>Concept demo — not a certified product</span>
            <span>•</span>
            <a href="/verify/" className="text-emerald-500/90 hover:text-emerald-400">Offline Attest Verify</a>
            <span>•</span>
            <a
              href="https://github.com/ppiiyo/EchoSign-Trust-Protocol/blob/main/docs/THREAT_MODEL.md"
              className="text-cyan-500/80 hover:text-cyan-400"
              target="_blank"
              rel="noreferrer"
            >
              Threat model
            </a>
          </div>
          <div className="text-amber-600/80 text-[11px]">
            Integrity proofs ≠ human-liveness proof. Telephony/SOC/compliance UI is simulated.
          </div>
        </div>
      </footer>
    </div>
  );
}

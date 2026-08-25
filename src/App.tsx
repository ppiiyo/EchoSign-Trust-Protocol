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
import { AppTab, ChainStats, VerificationResponse } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('verify');
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
      {/* Navigation Bar with Phase 1-3 Support */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        chainStats={chainStats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Phase 1: Core Verification & Tools */}
        {activeTab === 'verify' && (
          <VerificationStudio onVerificationComplete={handleVerificationComplete} />
        )}

        {activeTab === 'diarization' && (
          <SpeakerDiarizationStudio />
        )}

        {activeTab === 'developers' && (
          <DeveloperPortal />
        )}

        {/* Phase 2: B2B Integrations & SOC */}
        {activeTab === 'webhooks' && (
          <WebhooksStudio />
        )}

        {activeTab === 'extension' && (
          <BrowserExtensionHub />
        )}

        {activeTab === 'soc' && (
          <SocDashboard />
        )}

        {/* Phase 3: Enterprise & Real-Time */}
        {activeTab === 'telephony' && (
          <TelephonyStreamStudio />
        )}

        {activeTab === 'deployment' && (
          <EnterpriseDeploymentHub />
        )}

        {activeTab === 'compliance' && (
          <ComplianceAuditMatrix />
        )}

        {/* Supporting Trust Protocol Tools */}
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
      </main>

      {/* Protocol Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-400">EchoSign Voice Trust Suite v4.1</span>
            <span>•</span>
            <span>Биометрия связок (Джиттер / Шиммер / HNR / Вокодер)</span>
            <span>•</span>
            <span>SIP/RTP Прокси</span>
            <span>•</span>
            <span>ГОСТ Р 52633 & ISO 27001</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Высокоточная защита от телефонного мошенничества и клонирования голоса
          </div>
        </div>
      </footer>
    </div>
  );
}

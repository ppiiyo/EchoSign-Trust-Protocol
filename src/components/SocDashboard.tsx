import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Users,
  PhoneCall,
  Globe,
  TrendingUp,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUpRight,
  Clock,
  Shield
} from 'lucide-react';

interface SecurityIncident {
  id: string;
  timestamp: string;
  sourceChannel: 'SIP_TELEPHONY' | 'TELEGRAM_GATEWAY' | 'WHATSAPP_BOT' | 'KYC_ONBOARDING';
  threatType: 'CEO_IMPERSONATION' | 'VOICE_CLONE_FRAUD' | 'REPLAY_ATTACK' | 'WATERMARK_FORGERY';
  callerId: string;
  targetAccount: string;
  riskScore: number;
  syntheticConfidence: number;
  status: 'BLOCKED' | 'UNDER_REVIEW' | 'FLAGGED';
  latencyMs: number;
}

export const SocDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([
    {
      id: 'INC-2026-881',
      timestamp: '15:48:12',
      sourceChannel: 'SIP_TELEPHONY',
      threatType: 'CEO_IMPERSONATION',
      callerId: '+7 (903) 124-99-10',
      targetAccount: 'FIN-DIRECTOR-OFFICE',
      riskScore: 98,
      syntheticConfidence: 0.994,
      status: 'BLOCKED',
      latencyMs: 180
    },
    {
      id: 'INC-2026-880',
      timestamp: '15:41:05',
      sourceChannel: 'TELEGRAM_GATEWAY',
      threatType: 'VOICE_CLONE_FRAUD',
      callerId: '@fake_investor_voice',
      targetAccount: 'CLIENT-SUPPORT-LINE',
      riskScore: 94,
      syntheticConfidence: 0.982,
      status: 'BLOCKED',
      latencyMs: 165
    },
    {
      id: 'INC-2026-879',
      timestamp: '15:32:40',
      sourceChannel: 'KYC_ONBOARDING',
      threatType: 'REPLAY_ATTACK',
      callerId: 'KYC-SESSION-9941a',
      targetAccount: 'NEW-ACCOUNT-REG',
      riskScore: 88,
      syntheticConfidence: 0.915,
      status: 'UNDER_REVIEW',
      latencyMs: 220
    },
    {
      id: 'INC-2026-878',
      timestamp: '15:19:18',
      sourceChannel: 'SIP_TELEPHONY',
      threatType: 'VOICE_CLONE_FRAUD',
      callerId: '+7 (916) 441-20-00',
      targetAccount: 'VIP-TRANSFERS-DEPT',
      riskScore: 96,
      syntheticConfidence: 0.989,
      status: 'BLOCKED',
      latencyMs: 175
    }
  ]);

  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(incidents[0]);
  const [filterChannel, setFilterChannel] = useState<string>('ALL');

  const filteredIncidents = filterChannel === 'ALL'
    ? incidents
    : incidents.filter(inc => inc.sourceChannel === filterChannel);

  return (
    <div className="space-y-6">
      
      {/* Top SOC Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 mb-1">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Security Operations Center (SOC)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Дашборд Службы Безопасности & Мониторинг Атак
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Сводка перехваченных Deepfake-атак в реальном времени, анализ векторов вишинга и автоматическая блокировка сессий.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            <span>Threat Level: HIGH</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Атак за сутки: <strong>48</strong></span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Предотвращено мошенничеств:</span>
          <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">99.2%</span>
          <span className="text-[10px] text-slate-400 block mt-1">47 из 48 попыток заблокировано</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Среднее время реакции:</span>
          <span className="text-xl font-bold font-mono text-cyan-300 block mt-1">180 мс</span>
          <span className="text-[10px] text-slate-400 block mt-1">Блокировка до завершения фразы</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Главный вектор атаки:</span>
          <span className="text-xl font-bold text-slate-100 block mt-1">SIP Вишинг (58%)</span>
          <span className="text-[10px] text-slate-400 block mt-1">Клонирование голоса руководства</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Сэкономлено средств:</span>
          <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">₽ 42.8 млн</span>
          <span className="text-[10px] text-slate-400 block mt-1">За текущий квартал</span>
        </div>
      </div>

      {/* Live Incident Stream & Incident Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Incident Feed */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Лента перехваченных инцидентов ({filteredIncidents.length})</span>
            </h3>

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterChannel('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterChannel === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilterChannel('SIP_TELEPHONY')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterChannel === 'SIP_TELEPHONY' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                SIP Телефония
              </button>
              <button
                onClick={() => setFilterChannel('TELEGRAM_GATEWAY')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterChannel === 'TELEGRAM_GATEWAY' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Мессенджеры
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredIncidents.map(inc => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedIncident?.id === inc.id
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-rose-300 font-mono">{inc.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                      {inc.sourceChannel}
                    </span>
                    <span className="text-xs font-semibold text-slate-100">{inc.callerId}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900/80 text-rose-200 border border-rose-700">
                    {inc.status} (Score: {inc.riskScore}%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2">
                  <span>Цель: {inc.targetAccount}</span>
                  <span>Время: {inc.timestamp} ({inc.latencyMs} мс)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Incident Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Карточка инцидента</span>
          </h3>

          {selectedIncident ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Тип угрозы:</span>
                  <span className="font-bold text-rose-400 font-mono">{selectedIncident.threatType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Вероятность синтеза:</span>
                  <span className="font-bold text-rose-300 font-mono">
                    {(selectedIncident.syntheticConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Входящий номер:</span>
                  <span className="font-mono text-slate-200">{selectedIncident.callerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Атакованный отдел:</span>
                  <span className="font-mono text-slate-200">{selectedIncident.targetAccount}</span>
                </div>
              </div>

              <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-1">
                <span className="font-bold text-rose-300 block">Автоматическое действие:</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Звонок принудительно сброшен на 3.4 секунде. Номер атакующего внесен в черный список IP-АТС, отправлен алерт дежурному офицеру ИБ.
                </p>
              </div>

              <button
                onClick={() => alert(`Номер ${selectedIncident.callerId} заблокирован на уровне SIP-транка.`)}
                className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-900/30"
              >
                Подтвердить постоянную блокировку
              </button>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              Выберите инцидент для детального просмотра
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

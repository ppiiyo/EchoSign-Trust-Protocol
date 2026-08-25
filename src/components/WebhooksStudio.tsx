import React, { useState } from 'react';
import {
  Webhook,
  Send,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Layers,
  Clock,
  Code
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  status: 'ACTIVE' | 'PAUSED';
  lastTriggered?: string;
  successRate: number;
}

interface WebhookLog {
  id: string;
  event: string;
  timestamp: string;
  status: number;
  latencyMs: number;
  payload: any;
  response: string;
}

export const WebhooksStudio: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: 'wh-bank-soc-01',
      url: 'https://security.bank-corp.com/api/v1/voice-alerts',
      secret: 'whsec_9f81a7b4c9e201d48f93e4a2bc71008d',
      events: ['voice.deepfake_detected', 'call.spoofing_alert'],
      status: 'ACTIVE',
      lastTriggered: '3 минуты назад',
      successRate: 99.8
    },
    {
      id: 'wh-crm-bot-02',
      url: 'https://bot-gateway.telecom.io/webhooks/echosign',
      secret: 'whsec_3a12f9b8c0e114d56a73e8a9bc01994e',
      events: ['voice.verified', 'watermark.found'],
      status: 'ACTIVE',
      lastTriggered: '12 минут назад',
      successRate: 100
    }
  ]);

  const [logs, setLogs] = useState<WebhookLog[]>([
    {
      id: 'log-101',
      event: 'voice.deepfake_detected',
      timestamp: '2026-08-25 15:42:10',
      status: 200,
      latencyMs: 142,
      payload: {
        event: 'voice.deepfake_detected',
        verificationId: 'VER-1724601290-A9F1',
        callerId: '+7 (999) 450-88-21',
        targetAccount: 'ACC-8821094',
        confidence: 0.984,
        vocoderArtifactScore: 0.89,
        riskLevel: 'CRITICAL',
        recommendedAction: 'BLOCK_IMMEDIATELY_AND_ALERT_SOC'
      },
      response: '{"status":"received","action_taken":"session_terminated"}'
    },
    {
      id: 'log-102',
      event: 'call.spoofing_alert',
      timestamp: '2026-08-25 15:35:44',
      status: 200,
      latencyMs: 168,
      payload: {
        event: 'call.spoofing_alert',
        verificationId: 'VER-1724600980-B4C2',
        sipChannel: 'SIP/Trunk-Asterisk-04',
        anomaly: 'SPLICED_INPAINTING_DETECTED',
        splicedTimeRange: '4.1s - 8.5s'
      },
      response: '{"status":"acknowledged"}'
    }
  ]);

  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(logs[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [testEvent, setTestEvent] = useState('voice.deepfake_detected');

  const handleTriggerTestWebhook = async () => {
    setIsSimulating(true);
    setSimulationStatus('Формирование криптографической подписи HMAC-SHA256 и отправка...');

    setTimeout(() => {
      const newLog: WebhookLog = {
        id: `log-${Date.now()}`,
        event: testEvent,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 200,
        latencyMs: Math.floor(Math.random() * 80) + 110,
        payload: {
          event: testEvent,
          verificationId: `VER-${Date.now()}-SIM`,
          timestamp: Date.now(),
          targetEndpoint: webhooks[0].url,
          syntheticScore: testEvent === 'voice.deepfake_detected' ? 0.992 : 0.04,
          verdict: testEvent === 'voice.deepfake_detected' ? 'FAKE' : 'AUTHENTIC',
          audioFingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        },
        response: '{"status":"ok","acknowledged":true,"delivery_id":"del_9941a"}'
      };

      setLogs([newLog, ...logs]);
      setSelectedLog(newLog);
      setIsSimulating(false);
      setSimulationStatus('Тестовый Webhook успешно доставлен (HTTP 200 OK, 142ms)');
      setTimeout(() => setSimulationStatus(null), 4000);
    }, 900);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Webhook className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Real-Time Event Dispatcher</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            REST API v2 & Webhooks (Для колл-центров и антифрод-систем)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Мгновенная доставка алертов при обнаружении Deepfake-атак в реальном времени с криптографической подписью HMAC-SHA256.
          </p>
        </div>

        {/* Test Trigger Button */}
        <div className="flex items-center space-x-2">
          <select
            value={testEvent}
            onChange={e => setTestEvent(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="voice.deepfake_detected">voice.deepfake_detected</option>
            <option value="call.spoofing_alert">call.spoofing_alert</option>
            <option value="voice.verified">voice.verified</option>
            <option value="watermark.tampered">watermark.tampered</option>
          </select>

          <button
            onClick={handleTriggerTestWebhook}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSimulating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Отправить Webhook</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {simulationStatus && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-3 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{simulationStatus}</span>
        </div>
      )}

      {/* Registered Webhooks List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
          <Webhook className="w-4 h-4 text-cyan-400" />
          <span>Зарегистрированные эндпоинты ({webhooks.length})</span>
        </h3>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {webhooks.map(wh => (
            <div key={wh.id} className="p-4 bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-slate-100 truncate max-w-md">
                    {wh.url}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {wh.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {wh.events.map(ev => (
                    <span key={ev} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
                <span>Успешность: <strong className="text-emerald-400">{wh.successRate}%</strong></span>
                <span>•</span>
                <span>Посл.: {wh.lastTriggered}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Delivery Inspector & Payload JSON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Deliveries List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Журнал доставок событий (Event Logs)</span>
          </h3>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {logs.map(log => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedLog?.id === log.id
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-cyan-300">{log.event}</span>
                  <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">
                    HTTP {log.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{log.timestamp}</span>
                  <span>{log.latencyMs} мс</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payload Inspector */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Тело JSON-уведомления (Payload)</span>
            </h3>
            {selectedLog && (
              <span className="text-[10px] text-slate-400 font-mono">
                Заголовок: X-EchoSign-Signature: hmac-sha256=9f81...
              </span>
            )}
          </div>

          {selectedLog ? (
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-x-auto max-h-[220px]">
                <pre className="text-[11px] font-mono text-cyan-300 leading-relaxed">
                  <code>{JSON.stringify(selectedLog.payload, null, 2)}</code>
                </pre>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Ответ целевого сервера (Response Body):</span>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-[10px] text-emerald-400 truncate">
                  {selectedLog.response}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              Выберите запись в журнале для инспекции
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

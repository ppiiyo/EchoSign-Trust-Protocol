import React, { useState, useEffect } from 'react';
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
  Code,
  Trash2,
  ExternalLink
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
  signature?: string;
}

const DEFAULT_WEBHOOKS: WebhookConfig[] = [
  {
    id: 'wh-bank-soc-01',
    url: 'https://httpbin.org/post',
    secret: 'whsec_9f81a7b4c9e201d48f93e4a2bc71008d',
    events: ['voice.deepfake_detected', 'call.spoofing_alert'],
    status: 'ACTIVE',
    lastTriggered: '3 минуты назад',
    successRate: 99.8
  },
  {
    id: 'wh-crm-bot-02',
    url: 'https://security.bank-corp.com/api/v1/voice-alerts',
    secret: 'whsec_3a12f9b8c0e114d56a73e8a9bc01994e',
    events: ['voice.verified', 'watermark.found'],
    status: 'ACTIVE',
    lastTriggered: '12 минут назад',
    successRate: 100
  }
];

export const WebhooksStudio: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(() => {
    try {
      const saved = localStorage.getItem('echosign_webhooks');
      return saved ? JSON.parse(saved) : DEFAULT_WEBHOOKS;
    } catch {
      return DEFAULT_WEBHOOKS;
    }
  });

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
      response: '{"status":"received","action_taken":"session_terminated"}',
      signature: 'sha256=9f81a7b4c9e201d48f93e4a2bc71008d'
    }
  ]);

  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(logs[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [testEvent, setTestEvent] = useState('voice.deepfake_detected');
  const [selectedWebhookId, setSelectedWebhookId] = useState(webhooks[0]?.id || '');
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newSecret, setNewSecret] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('echosign_webhooks', JSON.stringify(webhooks));
    } catch {}
  }, [webhooks]);

  const handleAddWebhook = () => {
    if (!newUrl.trim()) return;
    const item: WebhookConfig = {
      id: `wh-${Date.now()}`,
      url: newUrl.trim(),
      secret: newSecret.trim() || `whsec_${Math.random().toString(36).substring(2, 10)}`,
      events: ['voice.deepfake_detected', 'call.spoofing_alert', 'voice.verified'],
      status: 'ACTIVE',
      lastTriggered: 'Никогда',
      successRate: 100
    };
    setWebhooks([item, ...webhooks]);
    setSelectedWebhookId(item.id);
    setNewUrl('');
    setNewSecret('');
    setIsAdding(false);
  };

  const handleDeleteWebhook = (id: string) => {
    const updated = webhooks.filter(w => w.id !== id);
    setWebhooks(updated);
    if (selectedWebhookId === id && updated.length > 0) {
      setSelectedWebhookId(updated[0].id);
    }
  };

  const handleTriggerTestWebhook = async () => {
    const target = webhooks.find(w => w.id === selectedWebhookId) || webhooks[0];
    if (!target) return;

    setIsSimulating(true);
    setSimulationStatus('Формирование HMAC-SHA256 и отправка HTTP POST...');

    const payload = {
      event: testEvent,
      verificationId: `VER-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: Date.now(),
      targetEndpoint: target.url,
      confidence: testEvent === 'voice.deepfake_detected' ? 0.988 : 0.03,
      verdict: testEvent === 'voice.deepfake_detected' ? 'FAKE' : 'AUTHENTIC',
      audioFingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      liveness: {
        jitterPercent: testEvent === 'voice.deepfake_detected' ? 0.08 : 0.85,
        shimmerPercent: testEvent === 'voice.deepfake_detected' ? 0.45 : 2.6,
        hnrDb: testEvent === 'voice.deepfake_detected' ? 29.2 : 18.0
      }
    };

    try {
      const response = await fetch('/api/v1/webhooks/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target.url,
          secret: target.secret,
          event: testEvent,
          payload
        })
      });

      const resData = await response.json();

      const newLog: WebhookLog = {
        id: `log-${Date.now()}`,
        event: testEvent,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: resData.status || 200,
        latencyMs: resData.latencyMs || 120,
        payload,
        response: resData.responseBody || (resData.success ? 'HTTP 200 OK' : resData.statusText),
        signature: resData.signature
      };

      setLogs([newLog, ...logs]);
      setSelectedLog(newLog);

      // Update last triggered
      setWebhooks(prev => prev.map(w => w.id === target.id ? { ...w, lastTriggered: 'Только что' } : w));

      setSimulationStatus(`Webhook отправлен на ${target.url} (${resData.statusText || 'HTTP ' + resData.status}, ${resData.latencyMs}мс)`);
      setTimeout(() => setSimulationStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setSimulationStatus(`Ошибка отправки: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
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
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWebhookId}
            onChange={e => setSelectedWebhookId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 max-w-[200px] truncate"
          >
            {webhooks.map(w => (
              <option key={w.id} value={w.id}>{w.url}</option>
            ))}
          </select>

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
            disabled={isSimulating || webhooks.length === 0}
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
            <Webhook className="w-4 h-4 text-cyan-400" />
            <span>Зарегистрированные эндпоинты ({webhooks.length})</span>
          </h3>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить эндпоинт</span>
          </button>
        </div>

        {/* Add Webhook Form */}
        {isAdding && (
          <div className="p-4 bg-slate-950 rounded-xl border border-cyan-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">Регистрация нового Webhook URL:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://your-domain.com/webhook (или https://httpbin.org/post)"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                value={newSecret}
                onChange={e => setNewSecret(e.target.value)}
                placeholder="HMAC Secret Key (опционально, автогенерация)"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleAddWebhook}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white cursor-pointer"
              >
                Сохранить
              </button>
            </div>
          </div>
        )}

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
                <button
                  onClick={() => handleDeleteWebhook(wh.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                  <span className={`font-mono px-1.5 py-0.5 rounded text-[10px] border ${
                    log.status >= 200 && log.status < 300
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}>
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
            {selectedLog?.signature && (
              <span className="text-[10px] text-cyan-400 font-mono truncate max-w-[200px]" title={selectedLog.signature}>
                {selectedLog.signature.substring(0, 24)}...
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
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-[10px] text-emerald-400 max-h-[100px] overflow-y-auto whitespace-pre-wrap">
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

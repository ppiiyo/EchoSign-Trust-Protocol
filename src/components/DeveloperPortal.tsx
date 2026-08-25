import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Shield,
  Code2,
  Terminal,
  Zap,
  CheckCircle2,
  RefreshCw,
  Globe,
  Clock,
  Layers,
  Play,
  Send
} from 'lucide-react';

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey: string;
  environment: 'production' | 'sandbox';
  scopes: string[];
  createdAt: string;
  lastUsed: string;
  requestsCount: number;
}

const DEFAULT_KEYS: ApiKeyItem[] = [
  {
    id: 'key-prod-01',
    name: 'Call Center Audio Guard',
    keyPrefix: 'echosign_live_9f81...',
    fullKey: 'echosign_live_9f81a7b4c9e201d48f93e4a2bc71008d',
    environment: 'production',
    scopes: ['verify:audio', 'telephony:stream', 'webhooks:dispatch'],
    createdAt: '2026-08-10',
    lastUsed: '2 минуты назад',
    requestsCount: 14285
  },
  {
    id: 'key-dev-01',
    name: 'Sandbox Local Dev & CI/CD',
    keyPrefix: 'echosign_test_3a12...',
    fullKey: 'echosign_test_3a12f9b8c0e114d56a73e8a9bc01994e',
    environment: 'sandbox',
    scopes: ['verify:audio', 'watermark:embed'],
    createdAt: '2026-08-20',
    lastUsed: '1 час назад',
    requestsCount: 432
  }
];

export const DeveloperPortal: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>(() => {
    try {
      const saved = localStorage.getItem('echosign_api_keys');
      return saved ? JSON.parse(saved) : DEFAULT_KEYS;
    } catch {
      return DEFAULT_KEYS;
    }
  });

  const [activeCodeLang, setActiveCodeLang] = useState<'curl' | 'python' | 'node' | 'go'>('curl');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'production' | 'sandbox'>('production');

  // Live API Console state
  const [consoleEndpoint, setConsoleEndpoint] = useState<string>('/api/v1/blockchain/stats');
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>(keys[0]?.id || '');
  const [consoleMethod, setConsoleMethod] = useState<'GET' | 'POST'>('GET');
  const [consolePreset, setConsolePreset] = useState<'human' | 'deepfake' | 'music'>('deepfake');
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [consoleResponse, setConsoleResponse] = useState<any | null>(null);
  const [consoleStatus, setConsoleStatus] = useState<number | null>(null);
  const [consoleLatency, setConsoleLatency] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('echosign_api_keys', JSON.stringify(keys));
    } catch {}
  }, [keys]);

  const handleCopyKey = (key: ApiKeyItem) => {
    navigator.clipboard.writeText(key.fullKey);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const prefix = newKeyEnv === 'production' ? 'echosign_live_' : 'echosign_test_';
    const full = `${prefix}${randomHex}`;

    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      keyPrefix: `${full.substring(0, 18)}...`,
      fullKey: full,
      environment: newKeyEnv,
      scopes: ['verify:audio', 'telephony:stream', 'watermark:embed'],
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Только что',
      requestsCount: 0
    };

    const updated = [newKey, ...keys];
    setKeys(updated);
    setSelectedApiKeyId(newKey.id);
    setNewKeyName('');
    setIsCreating(false);
  };

  const handleDeleteKey = (id: string) => {
    const updated = keys.filter(k => k.id !== id);
    setKeys(updated);
    if (selectedApiKeyId === id && updated.length > 0) {
      setSelectedApiKeyId(updated[0].id);
    }
  };

  const handleRunConsoleTest = async () => {
    setConsoleLoading(true);
    setConsoleResponse(null);
    setConsoleStatus(null);
    const activeKey = keys.find(k => k.id === selectedApiKeyId) || keys[0];
    const startTime = Date.now();

    try {
      let res: Response;
      if (consoleEndpoint === '/api/v1/verify') {
        res = await fetch('/api/v1/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey?.fullKey || ''}`
          },
          body: JSON.stringify({ presetType: consolePreset })
        });
      } else {
        res = await fetch(consoleEndpoint, {
          method: consoleMethod,
          headers: {
            'Authorization': `Bearer ${activeKey?.fullKey || ''}`
          }
        });
      }

      const latency = Date.now() - startTime;
      const data = await res.json();
      setConsoleStatus(res.status);
      setConsoleLatency(latency);
      setConsoleResponse(data);

      // Increment request count
      if (activeKey) {
        setKeys(prev => prev.map(k => k.id === activeKey.id ? { ...k, requestsCount: k.requestsCount + 1, lastUsed: 'Только что' } : k));
      }
    } catch (err: any) {
      setConsoleStatus(500);
      setConsoleLatency(Date.now() - startTime);
      setConsoleResponse({ error: err.message });
    } finally {
      setConsoleLoading(false);
    }
  };

  const currentSelectedKey = keys.find(k => k.id === selectedApiKeyId) || keys[0];
  const activeToken = currentSelectedKey?.fullKey || 'echosign_live_9f81a7b4c9e201d48f93e4a2bc71008d';

  const codeSnippets = {
    curl: `curl -X POST "https://api.echosign.io/api/v1/verify" \\
  -H "Authorization: Bearer ${activeToken}" \\
  -F "file=@incoming_call_record.wav" \\
  -F "diarization=true"`,

    python: `import requests

url = "https://api.echosign.io/api/v1/verify"
headers = {
    "Authorization": "Bearer ${activeToken}"
}

with open("incoming_call.wav", "rb") as audio_file:
    response = requests.post(
        url,
        headers=headers,
        files={"file": audio_file}
    )

result = response.json()
print(f"Вердикт: {result['verdict']}, Достоверность: {result['confidence'] * 100}%")`,

    node: `import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const form = new FormData();
form.append('file', fs.createReadStream('incoming_call.wav'));

const { data } = await axios.post('https://api.echosign.io/api/v1/verify', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer ${activeToken}'
  }
});

console.log('EchoSign Результат:', data.verdict, data.confidence);`,

    go: `package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	file, _ := os.Open("audio.wav")
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "audio.wav")
	io.Copy(part, file)
	writer.Close()

	req, _ := http.NewRequest("POST", "https://api.echosign.io/api/v1/verify", body)
	req.Header.Set("Authorization", "Bearer ${activeToken}")
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Key className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Developer Hub & API Console</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Управление API-ключами и Интеграция SDK
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Выпуск криптографических токенов доступа для интеграции защиты от Deepfake-атак в ваши бэкенды, CRM и колл-центры.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Создать новый API-ключ</span>
        </button>
      </div>

      {/* Create Key Modal/Drawer */}
      {isCreating && (
        <div className="bg-slate-900/90 border border-cyan-500/60 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Создание нового токена API</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Отмена
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Название / Назначение ключа:</label>
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="например, CRM Asterisk Bot Production"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Окружение:</label>
              <select
                value={newKeyEnv}
                onChange={e => setNewKeyEnv(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="production">Production (echosign_live_...)</option>
                <option value="sandbox">Sandbox / Dev (echosign_test_...)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCreateKey}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Сгенерировать ключ
            </button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
          <Key className="w-4 h-4 text-cyan-400" />
          <span>Активные ключи доступа ({keys.length})</span>
        </h3>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {keys.map(key => (
            <div key={key.id} className="p-4 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-slate-100">{key.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                    key.environment === 'production'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {key.environment}
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-1 font-mono text-xs text-slate-400">
                  <span className="text-slate-300">{key.keyPrefix}</span>
                  <button
                    onClick={() => handleCopyKey(key)}
                    className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Скопировать полный ключ"
                  >
                    {copiedKeyId === key.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
                <span>Запросов: <strong className="text-slate-200">{key.requestsCount.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Активность: {key.lastUsed}</span>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live API Console Sandbox */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Live API Request Console (Интерактивная консоль)</h3>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
            Interactive Test Runner
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Endpoint selection & params */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Используемый API-ключ:</label>
              <select
                value={selectedApiKeyId}
                onChange={e => setSelectedApiKeyId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
              >
                {keys.map(k => (
                  <option key={k.id} value={k.id}>{k.name} ({k.keyPrefix})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Эндпоинт:</label>
              <select
                value={consoleEndpoint}
                onChange={e => {
                  const ep = e.target.value;
                  setConsoleEndpoint(ep);
                  setConsoleMethod(ep === '/api/v1/verify' ? 'POST' : 'GET');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="/api/v1/blockchain/stats">GET /api/v1/blockchain/stats</option>
                <option value="/health">GET /health</option>
                <option value="/api/v1/kms/status">GET /api/v1/kms/status</option>
                <option value="/api/v1/blockchain/verify">GET /api/v1/blockchain/verify</option>
                <option value="/api/v1/verifications">GET /api/v1/verifications</option>
                <option value="/api/v1/verify">POST /api/v1/verify (Фоноскопия & Liveness)</option>
              </select>
            </div>

            {consoleEndpoint === '/api/v1/verify' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Тестовый образец аудио:</label>
                <select
                  value={consolePreset}
                  onChange={e => setConsolePreset(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="deepfake">🚨 Deepfake / TTS Синтез (Нейросеть)</option>
                  <option value="human">🛡️ Human Voice (Аутентичный голос)</option>
                  <option value="music">🎵 Фоновая музыка / Шум</option>
                </select>
              </div>
            )}

            <button
              onClick={handleRunConsoleTest}
              disabled={consoleLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              {consoleLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{consoleLoading ? 'Выполнение запроса...' : 'Отправить HTTP-запрос'}</span>
            </button>
          </div>

          {/* Response payload viewer */}
          <div className="lg:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs text-slate-300 font-bold font-mono">
                {consoleMethod} {consoleEndpoint}
              </span>
              {consoleStatus && (
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${consoleStatus === 200 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'}`}>
                    HTTP {consoleStatus}
                  </span>
                  <span className="text-slate-400 text-[10px]">{consoleLatency} ms</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900/90 rounded-lg p-3 overflow-x-auto max-h-[220px] font-mono text-[11px] text-cyan-300">
              {consoleResponse ? (
                <pre><code>{JSON.stringify(consoleResponse, null, 2)}</code></pre>
              ) : (
                <div className="text-slate-500 text-center py-8">
                  Нажмите «Отправить HTTP-запрос» для выполнения реального API-вызова к бэкенду
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Примеры кода интеграции API</h3>
          </div>

          <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['curl', 'python', 'node', 'go'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setActiveCodeLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeCodeLang === lang
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <button
            onClick={() => {
              navigator.clipboard.writeText(codeSnippets[activeCodeLang]);
              setCopiedSnippet(true);
              setTimeout(() => setCopiedSnippet(false), 2000);
            }}
            className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
          >
            {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSnippet ? 'Скопировано' : 'Копировать'}</span>
          </button>

          <pre className="text-xs font-mono text-slate-300 leading-relaxed pt-2">
            <code>{codeSnippets[activeCodeLang]}</code>
          </pre>
        </div>
      </div>

    </div>
  );
};

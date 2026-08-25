import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';

interface ApiKeyItem {
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

export const DeveloperPortal: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([
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
  ]);

  const [activeCodeLang, setActiveCodeLang] = useState<'curl' | 'python' | 'node' | 'go'>('curl');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'production' | 'sandbox'>('production');

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

    setKeys([newKey, ...keys]);
    setNewKeyName('');
    setIsCreating(false);
  };

  const handleDeleteKey = (id: string) => {
    setKeys(keys.filter(k => k.id !== id));
  };

  const codeSnippets = {
    curl: `curl -X POST "https://api.echosign.io/api/v2/verify" \\
  -H "Authorization: Bearer echosign_live_9f81a7b4c9e201d48f93e4a2bc71008d" \\
  -F "file=@incoming_call_record.wav" \\
  -F "diarization=true" \\
  -F "strict_liveness=true"`,

    python: `import requests

url = "https://api.echosign.io/api/v2/verify"
headers = {
    "Authorization": "Bearer echosign_live_9f81a7b4c9e201d48f93e4a2bc71008d"
}

with open("incoming_call.wav", "rb") as audio_file:
    response = requests.post(
        url,
        headers=headers,
        files={"file": audio_file},
        data={"diarization": "true"}
    )

result = response.json()
print(f"Вердикт: {result['verdict']}, Достоверность: {result['confidence'] * 100}%")
if not result['isHuman']:
    print("🚨 Внимание! Обнаружен Deepfake клон голоса.")`,

    node: `import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const form = new FormData();
form.append('file', fs.createReadStream('./voice_sample.wav'));
form.append('diarization', 'true');

const res = await axios.post('https://api.echosign.io/api/v2/verify', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer echosign_live_9f81a7b4c9e201d48f93e4a2bc71008d'
  }
});

console.log('EchoSign Analysis Result:', res.data);`,

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
	file, _ := os.Open("voice_call.wav")
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "voice_call.wav")
	io.Copy(part, file)
	writer.Close()

	req, _ := http.NewRequest("POST", "https://api.echosign.io/api/v2/verify", body)
	req.Header.Set("Authorization", "Bearer echosign_live_9f81a7b4c9e201d48f93e4a2bc71008d")
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Response Status:", resp.Status)
}`
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeLang]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Key className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Developer API Portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Управление API-ключами и Интеграция SDK
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Выпуск секретных ключей доступа, настройка лимитов скорости (Rate Limits) и интеграция детектора в банковские сервисы и ботов.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Создать новый API-ключ</span>
        </button>
      </div>

      {/* Quotas & Usage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Пакетный тариф:</span>
          <span className="text-base font-bold text-slate-100 block mt-0.5">Enterprise Pro</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Активен (SLA 99.98%)</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Запросов за месяц:</span>
          <span className="text-base font-mono font-bold text-cyan-300 block mt-0.5">14,717 / 100,000</span>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: '14.7%' }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Средняя задержка API:</span>
          <span className="text-base font-mono font-bold text-emerald-400 block mt-0.5">165 мс</span>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">p99 &lt; 340 мс</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Лимит скорости:</span>
          <span className="text-base font-mono font-bold text-slate-100 block mt-0.5">100 req / sec</span>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Безлимитный бурст</span>
        </div>
      </div>

      {/* Modal / Inline Creator for new Key */}
      {isCreating && (
        <div className="bg-slate-950/90 border-2 border-cyan-500/60 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Выпуск нового ключа аутентификации</span>
            </h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Отмена
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Название приложения или сервиса:
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Например: Asterisk IVR Gateway"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Окружение (Environment):
              </label>
              <select
                value={newKeyEnv}
                onChange={e => setNewKeyEnv(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="production">Production (Боевой контур)</option>
                <option value="sandbox">Sandbox (Тестовая песочница)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateKey}
              disabled={!newKeyName.trim()}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Сгенерировать ключ
            </button>
          </div>
        </div>
      )}

      {/* Active API Keys List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
          <Key className="w-4 h-4 text-cyan-400" />
          <span>Активные API-ключи ({keys.length})</span>
        </h3>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {keys.map(item => (
            <div key={item.id} className="p-4 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-slate-100">{item.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    item.environment === 'production'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {item.environment.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-300 font-bold">{item.keyPrefix}</span>
                  <span>•</span>
                  <span>Запросов: {item.requestsCount.toLocaleString()}</span>
                  <span>•</span>
                  <span>Исп.: {item.lastUsed}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyKey(item)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedKeyId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Скопирован</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать ключ</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteKey(item.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer border border-transparent hover:border-rose-900"
                  title="Отозвать ключ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Code Integration Snippets */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Примеры интеграции в код (SDK / REST API)
            </h3>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['curl', 'python', 'node', 'go'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setActiveCodeLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeCodeLang === lang
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Code Display */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <button
            onClick={handleCopySnippet}
            className="absolute top-3 right-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
          >
            {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSnippet ? 'Скопировано' : 'Копировать'}</span>
          </button>

          <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
            <code>{codeSnippets[activeCodeLang]}</code>
          </pre>
        </div>
      </div>

    </div>
  );
};

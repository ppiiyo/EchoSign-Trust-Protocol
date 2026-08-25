import React, { useState } from 'react';
import {
  Chrome,
  Download,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  MessageSquare,
  Video,
  Radio,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Volume2
} from 'lucide-react';

export const BrowserExtensionHub: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<'telegram' | 'whatsapp' | 'youtube' | 'meet'>('telegram');
  const [isSimulatedPlaying, setIsSimulatedPlaying] = useState(false);
  const [manifestCopied, setManifestCopied] = useState(false);

  const manifestJson = `{
  "manifest_version": 3,
  "name": "EchoSign Voice Inspector • Deepfake Shield",
  "version": "2.4.0",
  "description": "Мгновенная детекция AI Deepfake голосов в Telegram Web, WhatsApp, YouTube и Google Meet.",
  "permissions": ["activeTab", "tabCapture", "storage", "audioCapture"],
  "host_permissions": [
    "*://web.telegram.org/*",
    "*://web.whatsapp.com/*",
    "*://www.youtube.com/*",
    "*://meet.google.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["overlay.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icons/icon128.png"
  }
}`;

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestJson);
    setManifestCopied(true);
    setTimeout(() => setManifestCopied(false), 2000);
  };

  const handleDownloadExtensionZip = () => {
    const blob = new Blob([manifestJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Chrome className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Chrome & Firefox Extension</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Браузерное расширение EchoSign Shield
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Автоматическое сканирование входящих голосовых сообщений и видеопотоков прямо в Telegram Web, WhatsApp, YouTube и Zoom.
          </p>
        </div>

        <button
          onClick={handleDownloadExtensionZip}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Скачать манифест (Manifest v3)</span>
        </button>
      </div>

      {/* Interactive Platform Selector */}
      <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActivePlatform('telegram')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activePlatform === 'telegram'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Telegram Web</span>
        </button>

        <button
          onClick={() => setActivePlatform('whatsapp')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activePlatform === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Web</span>
        </button>

        <button
          onClick={() => setActivePlatform('youtube')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activePlatform === 'youtube'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>YouTube / Подкасты</span>
        </button>

        <button
          onClick={() => setActivePlatform('meet')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activePlatform === 'meet'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Google Meet / Zoom</span>
        </button>
      </div>

      {/* Live Interactive Browser Simulation Viewport */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Browser Chrome Window Header */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 ml-3 flex items-center space-x-2">
              <span className="text-emerald-400">https://</span>
              <span>
                {activePlatform === 'telegram' && 'web.telegram.org/a/#777000'}
                {activePlatform === 'whatsapp' && 'web.whatsapp.com'}
                {activePlatform === 'youtube' && 'youtube.com/watch?v=speech_review'}
                {activePlatform === 'meet' && 'meet.google.com/abc-defg-hij'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>EchoSign Shield: Active</span>
            </span>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="p-6 sm:p-10 min-h-[340px] flex items-center justify-center">
          
          {/* Telegram Simulation */}
          {activePlatform === 'telegram' && (
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-sm text-white">
                  ИИ
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Иван Иванов (CEO)</div>
                  <div className="text-[10px] text-slate-400">был(а) недавно</div>
                </div>
              </div>

              {/* Fake Voice Message with Injected EchoSign Overlay */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsSimulatedPlaying(!isSimulatedPlaying)}
                      className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer transition-all"
                    >
                      {isSimulatedPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <span className="font-mono text-xs">0:14 • Голосовое сообщение</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">15:44</span>
                </div>

                {/* EchoSign Injected Floating Shield Badge */}
                <div className="mt-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-600/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                    <div>
                      <span className="text-[11px] font-bold text-rose-200 block">
                        🚨 ВНИМАНИЕ: AI DEEPFAKE (98.6%)
                      </span>
                      <span className="text-[9px] text-rose-300 block">
                        Синтез ElevenLabs/XTTS. Джиттер связок: 0.08% (плоский).
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-rose-900 text-rose-100 font-mono font-bold">
                    БЛОКИРОВАТЬ
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                🛡️ Расширение перехватывает WebAudio API и проверяет спектрограмму за 180 мс.
              </div>
            </div>
          )}

          {/* WhatsApp Simulation */}
          {activePlatform === 'whatsapp' && (
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm text-white">
                  АК
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Анна (Бухгалтерия)</div>
                  <div className="text-[10px] text-slate-400">онлайн</div>
                </div>
              </div>

              {/* Genuine Voice Message with Injected EchoSign Overlay */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsSimulatedPlaying(!isSimulatedPlaying)}
                      className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-all"
                    >
                      {isSimulatedPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <span className="font-mono text-xs">0:21 • Голосовая заметка</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">15:46</span>
                </div>

                {/* EchoSign Injected Floating Shield Badge */}
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[11px] font-bold text-emerald-200 block">
                        🛡️ ПОДЛИННЫЙ ГОЛОС (99.4%)
                      </span>
                      <span className="text-[9px] text-emerald-300 block">
                        Биометрия связок подтверждена. Джиттер: 0.82%, HNR: 18.4 дБ.
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-emerald-900 text-emerald-100 font-mono font-bold">
                    ПРОВЕРЕНО
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* YouTube / Podcasts Simulation */}
          {activePlatform === 'youtube' && (
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
                <div className="text-center">
                  <Video className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <span className="text-xs text-slate-400 font-mono">Анализ аудиодорожки видеоролика в реальном времени...</span>
                </div>

                {/* Injected Video Fact-Checking Banner */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md border border-cyan-500/80 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-100 block">EchoSign Speech Authenticator:</span>
                      <span className="text-[10px] text-slate-300 block">Спикер использует оригинальный голос (без нейросетевого дубляжа).</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">99.1% Real</span>
                </div>
              </div>
            </div>
          )}

          {/* Google Meet / Zoom Simulation */}
          {activePlatform === 'meet' && (
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-center relative">
                  <div className="w-12 h-12 rounded-full bg-blue-600 mx-auto mb-2 flex items-center justify-center font-bold text-white text-sm">
                    МР
                  </div>
                  <span className="text-xs font-bold text-slate-200 block">Михаил Романов</span>
                  <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    🛡️ Голос: Подлинный
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl border border-rose-800 p-4 text-center relative">
                  <div className="w-12 h-12 rounded-full bg-rose-700 mx-auto mb-2 flex items-center justify-center font-bold text-white text-sm">
                    AI
                  </div>
                  <span className="text-xs font-bold text-slate-200 block">Гость (Звонок)</span>
                  <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono animate-pulse">
                    🚨 Клон: 97.8% Deepfake
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

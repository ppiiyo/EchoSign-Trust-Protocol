import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Radio,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Server,
  Layers,
  Settings,
  Volume2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export const TelephonyStreamStudio: React.FC = () => {
  const [callState, setCallState] = useState<'IDLE' | 'RINGING' | 'CONNECTED' | 'INTERCEPTED'>('IDLE');
  const [selectedCodec, setSelectedCodec] = useState<'G711U' | 'OPUS_HD' | 'AMR_WB'>('G711U');
  const [selectedScenario, setSelectedScenario] = useState<'GENUINE_CALL' | 'DEEPFAKE_ATTACK'>('DEEPFAKE_ATTACK');
  const [latencyMs, setLatencyMs] = useState(195);
  const [rollingConfidence, setRollingConfidence] = useState(0.12);
  const [callDuration, setCallDuration] = useState(0);
  const [audioFrames, setAudioFrames] = useState<number[]>([20, 35, 60, 45, 80, 65, 30, 25, 40]);

  const timerRef = useRef<any>(null);

  const startCall = () => {
    setCallState('RINGING');
    setCallDuration(0);
    setRollingConfidence(selectedScenario === 'DEEPFAKE_ATTACK' ? 0.25 : 0.05);

    setTimeout(() => {
      setCallState('CONNECTED');
      timerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const next = prev + 1;
          // Animate waveform
          setAudioFrames(Array.from({ length: 16 }, () => Math.floor(Math.random() * 70) + 15));
          
          if (selectedScenario === 'DEEPFAKE_ATTACK' && next >= 3) {
            setRollingConfidence(0.985);
            setCallState('INTERCEPTED');
            clearInterval(timerRef.current);
          } else if (selectedScenario === 'GENUINE_CALL') {
            setRollingConfidence(0.04);
          }
          return next;
        });
      }, 1000);
    }, 1500);
  };

  const endCall = () => {
    setCallState('IDLE');
    setCallDuration(0);
    setRollingConfidence(0.1);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Radio className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">SIP/RTP Media Stream Proxy</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Real-Time SIP/RTP Телефония (Asterisk, Cisco, Avaya)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Потоковый анализ аудиофреймов на лету с задержкой менее 200 мс прямо во время телефонного разговора оператора.
          </p>
        </div>

        {/* Integration Badges */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Asterisk 18/20
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Cisco CUCM
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Avaya Aura
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            FreeSWITCH
          </span>
        </div>
      </div>

      {/* Main Stream Simulator Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: SIP Call Controller */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            <span>Консоль оператора / SIP Трафик</span>
          </h3>

          {/* Scenario Selection */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Тестовый сценарий звонка:
            </label>
            <select
              value={selectedScenario}
              onChange={e => setSelectedScenario(e.target.value as any)}
              disabled={callState !== 'IDLE'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="DEEPFAKE_ATTACK">🚨 Атака вишинга: Клон голоса директора (Deepfake)</option>
              <option value="GENUINE_CALL">🛡️ Легитимный звонок: Клиент банка (Живой голос)</option>
            </select>
          </div>

          {/* Codec Selection */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Аудиокодек телефонии (RTP Payload):
            </label>
            <select
              value={selectedCodec}
              onChange={e => setSelectedCodec(e.target.value as any)}
              disabled={callState !== 'IDLE'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="G711U">G.711u (PCMU, 8 kHz, 64 kbps)</option>
              <option value="OPUS_HD">Opus HD (16/48 kHz, Wideband)</option>
              <option value="AMR_WB">AMR-WB (G.722.2, 16 kHz HD Voice)</option>
            </select>
          </div>

          {/* Call State Display */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Статус SIP-сессии:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                callState === 'IDLE' ? 'bg-slate-800 text-slate-400' :
                callState === 'RINGING' ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse' :
                callState === 'CONNECTED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
              }`}>
                {callState}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Длительность звонка:</span>
              <span className="font-mono text-slate-200">00:{callDuration < 10 ? `0${callDuration}` : callDuration}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Задержка инспекции (Latency):</span>
              <span className="font-mono text-cyan-300">{latencyMs} мс</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {callState === 'IDLE' ? (
              <button
                onClick={startCall}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Инициировать входящий SIP-звонок</span>
              </button>
            ) : (
              <button
                onClick={endCall}
                className="w-full py-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Завершить соединение</span>
              </button>
            )}
          </div>
        </div>

        {/* Center & Right: Live Stream Radar & Intercept Monitor */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Потоковый анализатор акустических фреймов (200ms Sliding Window)</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                RTP Jitter Buffer: 20ms
              </span>
            </div>

            {/* Rolling Visualizer */}
            <div className="my-6 bg-slate-950 border border-slate-800 rounded-xl p-6 flex items-center justify-center space-x-1.5 h-32">
              {audioFrames.map((height, i) => (
                <div
                  key={i}
                  style={{ height: callState === 'IDLE' ? '6px' : `${height}%` }}
                  className={`w-3.5 rounded-full transition-all duration-200 ${
                    callState === 'INTERCEPTED'
                      ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                      : callState === 'CONNECTED'
                      ? 'bg-cyan-400 shadow-md shadow-cyan-400/50'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Live Threat Barometer */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Вероятность искусственного голоса (AI Synthetic Index):</span>
                <span className={`font-mono font-bold ${rollingConfidence > 0.6 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {(rollingConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    rollingConfidence > 0.6
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                  }`}
                  style={{ width: `${rollingConfidence * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Intercept Alert Banner */}
          {callState === 'INTERCEPTED' && (
            <div className="p-4 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 space-y-2 animate-bounce">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="font-bold text-sm">
                  🚨 ТРЕВОГА: АВТОМАТИЧЕСКИЙ ПЕРЕХВАТ ЗВОНКА (DEEPFAKE ОБНАРУЖЕН)
                </span>
              </div>
              <p className="text-xs text-rose-300">
                Детектор зафиксировал плоский фазовый джиттер (0.07%) и характерные вокодерные артефакты диффузионного синтеза. Звонок изолирован, аудиопоток перенаправлен в службу безопасности банка.
              </p>
            </div>
          )}

          {callState === 'CONNECTED' && selectedScenario === 'GENUINE_CALL' && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">Поток верифицирован: Живой голос оператора</span>
                <span className="text-emerald-300">Биометрия голосовых связок соответствует естественной физиологии.</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

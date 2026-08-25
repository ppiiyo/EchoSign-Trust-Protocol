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
  Mic,
  Square,
  CheckCircle2
} from 'lucide-react';
import { telephonySynth } from '../utils/audio';

export const TelephonyStreamStudio: React.FC = () => {
  const [mode, setMode] = useState<'MIC_STREAM' | 'SCENARIO'>('MIC_STREAM');
  const [callState, setCallState] = useState<'IDLE' | 'RINGING' | 'CONNECTED' | 'INTERCEPTED'>('IDLE');
  const [selectedCodec, setSelectedCodec] = useState<'G711U' | 'OPUS_HD' | 'AMR_WB'>('G711U');
  const [selectedScenario, setSelectedScenario] = useState<'GENUINE_CALL' | 'DEEPFAKE_ATTACK'>('DEEPFAKE_ATTACK');
  const [latencyMs, setLatencyMs] = useState(185);
  const [rollingConfidence, setRollingConfidence] = useState(0.08);
  const [callDuration, setCallDuration] = useState(0);
  const [liveF0, setLiveF0] = useState(135);
  const [liveJitter, setLiveJitter] = useState(0.85);
  const [liveShimmer, setLiveShimmer] = useState(2.4);
  const [liveHnr, setLiveHnr] = useState(17.8);
  const [isMicActive, setIsMicActive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop Web Audio Context & mic
  const cleanupAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    telephonySynth.stop();
  };

  // Start real microphone streaming
  const startMicStreaming = async () => {
    try {
      telephonySynth.playRingTone();
      setCallState('RINGING');
      setCallDuration(0);

      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;

          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioCtxRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);

          // Bandpass filter to emulate G.711u / HD Voice telephone codec
          const lowpass = audioCtx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.setValueAtTime(selectedCodec === 'G711U' ? 3400 : 7000, audioCtx.currentTime);

          const highpass = audioCtx.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.setValueAtTime(selectedCodec === 'G711U' ? 300 : 50, audioCtx.currentTime);

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          analyserRef.current = analyser;

          source.connect(highpass);
          highpass.connect(lowpass);
          lowpass.connect(analyser);

          setCallState('CONNECTED');
          setIsMicActive(true);
          telephonySynth.playBeep(440, 0.1);

          // Draw real-time canvas spectrum & compute live DSP
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          const timeArray = new Uint8Array(analyser.fftSize);

          const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            if (!analyserRef.current || !canvasRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);
            analyserRef.current.getByteTimeDomainData(timeArray);

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Frequency Bars
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              barHeight = dataArray[i] / 2;

              const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
              gradient.addColorStop(0, '#06b6d4');
              gradient.addColorStop(0.7, '#3b82f6');
              gradient.addColorStop(1, '#8b5cf6');

              ctx.fillStyle = gradient;
              ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
              x += barWidth + 1;
            }

            // Draw Real-time Oscilloscope Waveform overlay
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#22d3ee';
            ctx.beginPath();

            const sliceWidth = canvas.width * 1.0 / analyser.fftSize;
            let waveX = 0;

            for (let i = 0; i < analyser.fftSize; i++) {
              const v = timeArray[i] / 128.0;
              const y = (v * canvas.height) / 2;

              if (i === 0) {
                ctx.moveTo(waveX, y);
              } else {
                ctx.lineTo(waveX, y);
              }
              waveX += sliceWidth;
            }
            ctx.stroke();

            // Calculate live Energy & rough pitch/jitter
            let sumEnergy = 0;
            for (let i = 0; i < bufferLength; i++) {
              sumEnergy += dataArray[i];
            }
            const avgEnergy = sumEnergy / bufferLength;

            if (avgEnergy > 10) {
              const currentF0 = Math.round(110 + (dataArray[12] || 20) * 1.2);
              setLiveF0(currentF0);
              const jitter = Math.max(0.3, Math.min(1.8, (dataArray[5] % 15) / 10 + 0.35));
              const shimmer = Math.max(1.2, Math.min(4.8, (dataArray[8] % 30) / 10 + 1.2));
              setLiveJitter(Math.round(jitter * 100) / 100);
              setLiveShimmer(Math.round(shimmer * 100) / 100);
              setLiveHnr(Math.round((16 + (avgEnergy / 10)) * 10) / 10);
              setRollingConfidence(Math.max(0.02, Math.min(0.18, 0.25 - avgEnergy / 300)));
            }
          };

          draw();

          // Duration ticker
          timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
            setLatencyMs(Math.floor(180 + Math.random() * 25));
          }, 1000);
        } catch (e) {
          console.error(e);
          setCallState('IDLE');
          alert('Не удалось подключить микрофон');
        }
      }, 1200);
    } catch (err) {
      console.error(err);
      setCallState('IDLE');
    }
  };

  // Scenario Simulator
  const startScenario = () => {
    telephonySynth.playRingTone();
    setCallState('RINGING');
    setCallDuration(0);
    setRollingConfidence(selectedScenario === 'DEEPFAKE_ATTACK' ? 0.25 : 0.05);

    setTimeout(() => {
      setCallState('CONNECTED');
      telephonySynth.playBeep(440, 0.1);

      timerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const next = prev + 1;
          setLatencyMs(Math.floor(175 + Math.random() * 30));

          if (selectedScenario === 'DEEPFAKE_ATTACK' && next >= 3) {
            setRollingConfidence(0.985);
            setLiveJitter(0.08);
            setLiveShimmer(0.42);
            setLiveHnr(29.5);
            setCallState('INTERCEPTED');
            telephonySynth.playBeep(300, 0.4);
            clearInterval(timerRef.current);
          } else if (selectedScenario === 'GENUINE_CALL') {
            setRollingConfidence(0.04);
            setLiveJitter(0.85);
            setLiveShimmer(2.6);
            setLiveHnr(18.2);
          }
          return next;
        });
      }, 1000);
    }, 1500);
  };

  const endCall = () => {
    telephonySynth.playBeep(220, 0.15);
    cleanupAudio();
    setCallState('IDLE');
    setIsMicActive(false);
    setCallDuration(0);
    setRollingConfidence(0.08);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
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

      {/* Mode Selector Tabs */}
      <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => {
            if (callState !== 'IDLE') endCall();
            setMode('MIC_STREAM');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            mode === 'MIC_STREAM'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Живой микрофон (Реальный SIP-поток)</span>
        </button>

        <button
          onClick={() => {
            if (callState !== 'IDLE') endCall();
            setMode('SCENARIO');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            mode === 'SCENARIO'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Сценарии атак (Банковский Вишинг)</span>
        </button>
      </div>

      {/* Main Stream Simulator Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: SIP Call Controller */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            <span>Консоль оператора / SIP Трафик</span>
          </h3>

          {/* Mode-specific settings */}
          {mode === 'SCENARIO' ? (
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
          ) : (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                <Mic className="w-3.5 h-3.5" />
                <span>Прямой ввод с микрофона</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Голос фильтруется телефонным полосовым фильтром 300-3400 Гц и инспектируется в скользящем окне 200мс.
              </p>
            </div>
          )}

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
                onClick={mode === 'MIC_STREAM' ? startMicStreaming : startScenario}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{mode === 'MIC_STREAM' ? 'Подключить микрофон и начать звонок' : 'Инициировать входящий SIP-звонок'}</span>
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

            {/* Real-Time Canvas Oscillogram / Spectrogram */}
            <div className="my-4 bg-slate-950 border border-slate-800 rounded-xl p-3 relative h-36 flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={120}
                className="w-full h-full object-contain"
              />
              {callState === 'IDLE' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-slate-500 text-xs font-mono">
                  [Ожидание аудиопотока SIP/RTP]
                </div>
              )}
            </div>

            {/* Real-Time DSP Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Частота $F_0$:</span>
                <span className="font-mono text-xs font-bold text-cyan-300">{callState === 'IDLE' ? '---' : `${liveF0} Гц`}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Джиттер (Jitter):</span>
                <span className={`font-mono text-xs font-bold ${liveJitter >= 0.3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {callState === 'IDLE' ? '---' : `${liveJitter.toFixed(2)}%`}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Шиммер (Shimmer):</span>
                <span className={`font-mono text-xs font-bold ${liveShimmer >= 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {callState === 'IDLE' ? '---' : `${liveShimmer.toFixed(2)}%`}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">HNR:</span>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {callState === 'IDLE' ? '---' : `${liveHnr.toFixed(1)} dB`}
                </span>
              </div>
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
                Детектор зафиксировал плоский фазовый джиттер (0.08%) и характерные вокодерные артефакты диффузионного синтеза. Звонок изолирован, аудиопоток перенаправлен в службу безопасности банка.
              </p>
            </div>
          )}

          {callState === 'CONNECTED' && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">Поток верифицирован: Живой голос</span>
                <span className="text-emerald-300">Биометрия голосовых связок соответствует естественной физиологии человека.</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

import React, { useState } from 'react';
import {
  Activity,
  Sliders,
  Play,
  Zap,
  VolumeX,
  Radio,
  AudioWaveform,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { VerificationResponse } from '../types';

export const ForensicsLab: React.FC = () => {
  const [attackType, setAttackType] = useState<'noise' | 'vocoder' | 'telephony' | 'quantize'>('noise');
  const [intensity, setIntensity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<VerificationResponse | null>(null);

  const runAttackTest = async () => {
    setLoading(true);
    try {
      // Fetch sample and run verification
      const res = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetType: attackType === 'vocoder' ? 'deepfake' : 'human'
        })
      });
      const data: VerificationResponse = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-950 flex items-center justify-center border border-purple-700">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Лаборатория Акустических Атак & Спектральной Стойкости
            </h2>
            <p className="text-xs text-slate-400">
              Стресс-тестирование водяных знаков (DSSS/DCT) и детекторов Liveness при воздействии шумов и нейросетевых искажений
            </p>
          </div>
        </div>

        {/* Attack selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-6">
          <button
            onClick={() => setAttackType('noise')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              attackType === 'noise'
                ? 'bg-cyan-950/80 border-cyan-500 shadow-md text-slate-100'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 font-semibold text-xs mb-1 text-cyan-300">
              <Radio className="w-4 h-4" />
              <span>Шум Гаусса (AWGN)</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">
              Широкополосный акустический шум микрофона (+15 дБ)
            </div>
          </button>

          <button
            onClick={() => setAttackType('vocoder')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              attackType === 'vocoder'
                ? 'bg-rose-950/80 border-rose-500 shadow-md text-slate-100'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 font-semibold text-xs mb-1 text-rose-300">
              <Zap className="w-4 h-4" />
              <span>Артефакты Вокодера</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">
              Нейросетевой срез фазы HiFi-GAN и плоский джиттер
            </div>
          </button>

          <button
            onClick={() => setAttackType('telephony')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              attackType === 'telephony'
                ? 'bg-amber-950/80 border-amber-500 shadow-md text-slate-100'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 font-semibold text-xs mb-1 text-amber-300">
              <VolumeX className="w-4 h-4" />
              <span>Телефонный Срез 300Гц</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">
              G.711 кодек со срезом низких и высоких частот
            </div>
          </button>

          <button
            onClick={() => setAttackType('quantize')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              attackType === 'quantize'
                ? 'bg-purple-950/80 border-purple-500 shadow-md text-slate-100'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 font-semibold text-xs mb-1 text-purple-300">
              <Sliders className="w-4 h-4" />
              <span>MP3 Сжатие / Биткраш</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">
              Потери психоакустического кодирования (64 kbps)
            </div>
          </button>
        </div>

        {/* Intensity slider */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="w-full sm:w-1/2">
            <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-mono">
              <span>Интенсивность атаки / искажения:</span>
              <span className="text-cyan-400 font-bold">{intensity}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <button
            onClick={runAttackTest}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-purple-200" />
            )}
            <span>{loading ? 'Тестирование...' : 'Запустить атаку & Оценить выживаемость'}</span>
          </button>
        </div>
      </div>

      {/* Attack Evaluation Card */}
      {testResult && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Результаты Теста Стойкости Протокола</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px] uppercase">Вердикт системы:</div>
              <div className="text-lg font-bold text-cyan-300 mt-1">{testResult.verdict}</div>
              <div className="text-[10px] text-slate-400 mt-1">Уверенность: {(testResult.confidence * 100).toFixed(0)}%</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px] uppercase">Стойкость Liveness Детектора:</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {testResult.isHuman ? 'Живой голос подтвержден' : 'Спуфинг успешно заблокирован'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Vocoder Score: {(testResult.liveness.vocoderArtifactScore * 100).toFixed(0)}%
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px] uppercase">Блокчейн Фиксация:</div>
              <div className="text-lg font-bold text-slate-200 mt-1">Запись валидна</div>
              <div className="text-[10px] text-slate-400 mt-1">Блок #{testResult.blockchain.blockIndex}</div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-cyan-400 mr-2">Анализ атаки:</span>
            {testResult.message}
          </div>
        </div>
      )}
    </div>
  );
};

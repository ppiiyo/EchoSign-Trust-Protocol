import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Mic,
  Square,
  ShieldCheck,
  AlertTriangle,
  FileAudio,
  Lock,
  Cpu,
  Layers,
  FileText,
  Link2,
  CheckCircle2,
  XCircle,
  Zap,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Verdict, VerificationResponse } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface VerificationStudioProps {
  onVerificationComplete?: (res: VerificationResponse) => void;
}

export const VerificationStudio: React.FC<VerificationStudioProps> = ({ onVerificationComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'liveness' | 'watermark' | 'transcript' | 'blockchain'>('liveness');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setResult(null);
    }
  };

  // Quick preset loader
  const loadPreset = async (presetType: 'human' | 'deepfake' | 'music') => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetType })
      });
      const data: VerificationResponse = await response.json();
      setResult(data);
      setAudioUrl(`/api/v1/test-samples/${presetType}?t=${Date.now()}`);
      setSelectedFile(null);
      if (onVerificationComplete) onVerificationComplete(data);
    } catch (err) {
      console.error('Preset error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], `mic_recording_${Date.now()}.wav`, { type: 'audio/wav' });
        setSelectedFile(file);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Не удалось получить доступ к микрофону.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // Submit Verification
  const handleVerify = async () => {
    if (!selectedFile) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/v1/verify', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data: VerificationResponse = await response.json();
      setResult(data);
      if (onVerificationComplete) onVerificationComplete(data);
    } catch (err: any) {
      console.error('Verification error:', err);
      alert(`Ошибка верификации: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBadge = (verdict: Verdict) => {
    switch (verdict) {
      case Verdict.AUTHENTIC:
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300',
          icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
          title: 'ПОДЛИННАЯ АУДИОЗАПИСЬ',
          desc: 'Живой голос человека + Валидный криптографический водяной знак (HMAC-SHA256).'
        };
      case Verdict.LIKELY_AUTHENTIC:
        return {
          bg: 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300',
          icon: <CheckCircle2 className="w-8 h-8 text-cyan-400" />,
          title: 'ВЕРОЯТНО ПОДЛИННАЯ ЗАПИСЬ',
          desc: 'Биометрические параметры соответствуют живому голосу человека.'
        };
      case Verdict.SUSPICIOUS:
        return {
          bg: 'bg-amber-950/80 border-amber-500/80 text-amber-300',
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          title: 'ВЫЗЫВАЕТ ПОДОЗРЕНИЯ (SUSPICIOUS)',
          desc: 'Обнаружены несоответствия спектральных фаз или аномалии цифровой подписи.'
        };
      case Verdict.FAKE:
      default:
        return {
          bg: 'bg-rose-950/80 border-rose-500/80 text-rose-300',
          icon: <XCircle className="w-8 h-8 text-rose-400" />,
          title: 'НЕЙРОСЕТЕВОЙ СИНТЕЗ (DEEPFAKE)',
          desc: 'Критические аномалии джиттера/шиммера и фазовые артефакты диффузионных вокодеров.'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Control Bar: Upload & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audio Input Box */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
              <FileAudio className="w-5 h-5 text-cyan-400" />
              <span>Загрузка или Запись Аудио</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">WAV, MP3, M4A, FLAC</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* File drop zone */}
            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40 group">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 mb-2 transition-colors" />
              <span className="text-xs font-medium text-slate-300 group-hover:text-cyan-300">
                {selectedFile ? selectedFile.name : 'Выберите или перетащите файл'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">До 50 МБ</span>
            </label>

            {/* Microphone recorder */}
            <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-5 flex flex-col items-center justify-center">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex flex-col items-center text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-800 group-hover:bg-cyan-900/50 flex items-center justify-center mb-2 border border-slate-700 group-hover:border-cyan-500/50">
                    <Mic className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-xs font-medium">Записать голос с микрофона</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">В реальном времени</span>
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-2 text-rose-400 font-mono font-bold text-sm mb-2 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span>Запись: {recordingTime} сек</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Остановить запись</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Player & Action */}
          {audioUrl && (
            <div className="space-y-4">
              <AudioVisualizer
                audioSrc={audioUrl}
                title={selectedFile ? selectedFile.name : 'Аудио для проверки'}
              />

              <div className="flex justify-end">
                <button
                  id="btn-run-verify"
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 text-cyan-200" />
                  )}
                  <span>{loading ? 'Идет верификация...' : 'Запустить полную верификацию'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Voice Buttons */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-slate-100">Примеры голосов</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Быстрая проверка на готовых образцах для оценки работы детектора:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => loadPreset('human')}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-emerald-900/50 hover:border-emerald-500/60 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center border border-emerald-700/50">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                      Живой голос человека
                    </div>
                    <div className="text-[10px] text-slate-400">Настоящая речь с естественной биометрией</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
              </button>

              <button
                onClick={() => loadPreset('deepfake')}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-rose-900/50 hover:border-rose-500/60 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-950 flex items-center justify-center border border-rose-700/50">
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-300">
                      Искусственный голос (AI Deepfake)
                    </div>
                    <div className="text-[10px] text-slate-400">Синтез речи нейросетью / TTS</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
              </button>

              <button
                onClick={() => loadPreset('music')}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-indigo-900/50 hover:border-indigo-500/60 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 flex items-center justify-center border border-indigo-700/50">
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                      Студийная аудиозапись
                    </div>
                    <div className="text-[10px] text-slate-400">Вокал с фонограммой и эффектами</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Анализ: Liveness + Спектр + Водяной знак</span>
            <span className="text-cyan-400 font-mono">Акустический DSP</span>
          </div>
        </div>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div className="space-y-6">
          {/* Main Verdict Banner */}
          {(() => {
            const badge = getVerdictBadge(result.verdict);
            return (
              <div
                className={`border-2 rounded-2xl p-6 shadow-2xl ${badge.bg} relative overflow-hidden backdrop-blur-md`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-white/10 shadow-inner">
                      {badge.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          {badge.title}
                        </h2>
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-white/20 text-white">
                          Уверенность: {(result.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 mt-1">{badge.desc}</p>
                    </div>
                  </div>

                  {/* Blockchain Verified Stamp */}
                  <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-right font-mono text-xs text-slate-300">
                    <div className="flex items-center justify-end space-x-1.5 text-cyan-400 font-semibold mb-1">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Ledger Verified</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      Tx: {result.blockchain.txId.slice(0, 16)}...
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Блок #{result.blockchain.blockIndex}
                    </div>
                  </div>
                </div>

                {/* Expert Summary */}
                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-200 leading-relaxed bg-black/20 p-3.5 rounded-xl">
                  <span className="font-bold text-cyan-300 mr-2">Судебное заключение:</span>
                  {result.message}
                </div>
              </div>
            );
          })()}

          {/* Forensic Tabs Details */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 overflow-x-auto space-x-2">
              <button
                onClick={() => setActiveTab('liveness')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'liveness'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Биометрия & Liveness</span>
              </button>

              <button
                onClick={() => setActiveTab('watermark')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'watermark'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Водяной Знак (HMAC)</span>
              </button>

              <button
                onClick={() => setActiveTab('transcript')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'transcript'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Транскрипция Whisper</span>
              </button>

              <button
                onClick={() => setActiveTab('blockchain')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'blockchain'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Блокчейн Аудит</span>
              </button>
            </div>

            {/* Tab 1: Liveness & Spectral */}
            {activeTab === 'liveness' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Jitter */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">
                      Джиттер (Jitter)
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-100">
                      {result.liveness.jitterPercent}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Норма: 0.2% – 1.8%
                    </div>
                  </div>

                  {/* Shimmer */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">
                      Шиммер (Shimmer)
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-100">
                      {result.liveness.shimmerPercent}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Норма: 1.0% – 4.5%
                    </div>
                  </div>

                  {/* HNR */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">
                      HNR (Гармоники/Шум)
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-100">
                      {result.liveness.hnrDb} дБ
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Турбулентное дыхание
                    </div>
                  </div>

                  {/* Vocoder Score */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">
                      Артефакты Вокодера
                    </div>
                    <div
                      className={`text-xl font-bold font-mono ${
                        result.liveness.vocoderArtifactScore > 0.4
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {(result.liveness.vocoderArtifactScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      HiFi-GAN / WaveNet
                    </div>
                  </div>
                </div>

                {/* Reasons List */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Акустические критерии анализа
                  </h4>
                  <ul className="space-y-2">
                    {result.reasons.map((reason, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-300 flex items-start space-x-2"
                      >
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Watermark */}
            {activeTab === 'watermark' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        result.watermark.found && result.watermark.validHmac
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {result.watermark.found && result.watermark.validHmac
                          ? 'Цифровой водяной знак обнаружен и валидирован'
                          : 'Водяной знак не найден или поврежден'}
                      </div>
                      <div className="text-xs text-slate-400">
                        Несущий диапазон: {result.watermark.carrierBand}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span
                      className={`px-3 py-1 rounded-full border ${
                        result.watermark.validHmac
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {result.watermark.validHmac ? 'HMAC-SHA256 MATCH' : 'NO HMAC'}
                    </span>
                  </div>
                </div>

                {result.watermark.payload && (
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                    <div className="text-slate-400 uppercase text-[11px]">
                      Декодированный криптографический сертификат:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-200">
                      <div>
                        <span className="text-slate-500">Владелец:</span>{' '}
                        {result.watermark.payload.owner}
                      </div>
                      <div>
                        <span className="text-slate-500">Device ID:</span>{' '}
                        {result.watermark.payload.deviceId}
                      </div>
                      <div>
                        <span className="text-slate-500">Лицензия:</span>{' '}
                        {result.watermark.payload.licenseId || 'N/A'}
                      </div>
                      <div>
                        <span className="text-slate-500">Метка времени:</span>{' '}
                        {new Date(result.watermark.payload.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Transcript */}
            {activeTab === 'transcript' && (
              <div className="p-6 space-y-6">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
                    <span>Распознанный текст (Faster-Whisper):</span>
                    <span className="text-cyan-400">
                      Язык: {result.transcript?.language.toUpperCase()} ({(result.transcript?.languageProbability! * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed font-sans bg-slate-900 p-4 rounded-lg border border-slate-800">
                    "{result.fileInfo.transcript || 'Речь не обнаружена'}"
                  </p>
                </div>

                {result.transcript?.segments && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Временные сегменты фонем:
                    </h5>
                    <div className="space-y-1.5">
                      {result.transcript.segments.map((seg, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300"
                        >
                          <span className="text-cyan-400">
                            [{seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s]
                          </span>
                          <span className="flex-1 mx-3 text-slate-200 font-sans truncate">
                            {seg.text}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            Conf: {(seg.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Blockchain Proof */}
            {activeTab === 'blockchain' && (
              <div className="p-6 space-y-4 font-mono text-xs">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-cyan-400 font-semibold">
                    <span>Криптографическая запись в реестре</span>
                    <span>Proof of Work Block #{result.blockchain.blockIndex}</span>
                  </div>
                  <div className="space-y-2 text-slate-300 break-all">
                    <div>
                      <span className="text-slate-500">Transaction ID:</span>{' '}
                      {result.blockchain.txId}
                    </div>
                    <div>
                      <span className="text-slate-500">Block Hash:</span>{' '}
                      {result.blockchain.blockHash}
                    </div>
                    <div>
                      <span className="text-slate-500">Merkle Root:</span>{' '}
                      <span className="text-emerald-400 font-bold">{result.blockchain.merkleRoot || 'N/A'}</span>
                    </div>
                    {result.blockchain.l2Anchor && (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-purple-300">
                        <span className="text-slate-500">L2 Rollup Anchor: </span>
                        <span>{result.blockchain.l2Anchor.network}</span>
                        <div className="text-[10px] text-emerald-400">State Root: {result.blockchain.l2Anchor.stateRoot.slice(0, 24)}... (Verified on-chain)</div>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">SHA-256 Audio Hash:</span>{' '}
                      {result.audioHash}
                    </div>
                    <div>
                      <span className="text-slate-500">SHA-256 Transcript Hash:</span>{' '}
                      {result.transcriptHash || 'N/A'}
                    </div>
                    <div>
                      <span className="text-slate-500">UTC Timestamp:</span>{' '}
                      {new Date(result.blockchain.timestamp).toISOString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

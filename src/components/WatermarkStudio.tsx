import React, { useState, useRef } from 'react';
import {
  Lock,
  Download,
  CheckCircle2,
  FileCheck,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  UploadCloud,
  X
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface WatermarkStudioProps {
  onTestInVerifier?: (audioBase64: string, filename: string) => void;
}

export const WatermarkStudio: React.FC<WatermarkStudioProps> = ({ onTestInVerifier }) => {
  const [owner, setOwner] = useState('Аудиостудия "Резонанс"');
  const [deviceId, setDeviceId] = useState('DEV-ECHOSIGN-HS-809');
  const [licenseId, setLicenseId] = useState('LIC-COPYRIGHT-2026-RU');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [watermarkedResult, setWatermarkedResult] = useState<any | null>(null);
  const [abMode, setAbMode] = useState<'original' | 'watermarked'>('watermarked');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setWatermarkedResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setWatermarkedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmbedWatermark = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('owner', owner);
      formData.append('deviceId', deviceId);
      formData.append('licenseId', licenseId);

      const response = await fetch('/api/v1/register', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Embedding failed');
      }

      const data = await response.json();
      setWatermarkedResult(data);
    } catch (err: any) {
      console.error(err);
      alert(`Ошибка внедрения знака: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    if (!watermarkedResult) return;
    const cert = {
      protocol: 'EchoSign Trust Protocol v4.0.0',
      type: 'Cryptographic Audio Watermark Certificate',
      verificationId: watermarkedResult.verificationId,
      audioHashSha256: watermarkedResult.audioHash,
      snrDb: watermarkedResult.snrDb,
      payload: watermarkedResult.payload,
      blockchain: watermarkedResult.blockchain,
      issuedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EchoSign_Certificate_${watermarkedResult.verificationId}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 flex items-center justify-center border border-cyan-700/60">
            <Lock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Внедрение Криптографического Водяного Знака (DCT + DSSS + HMAC)
            </h2>
            <p className="text-xs text-slate-400">
              Встраивает незаметный на слух цифровой идентификатор с криптографической подписью HMAC-SHA256
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Владелец / Автор
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              ID Устройства / Микрофона
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Номер Лицензии / Копирайт
            </label>
            <input
              type="text"
              value={licenseId}
              onChange={(e) => setLicenseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* File Select & Embed Action */}
        <div 
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500/50'
              : 'border-slate-800 bg-slate-950/60'
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-3 cursor-pointer text-xs text-slate-300 hover:text-cyan-300 transition-colors w-full sm:w-auto"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.m4a,.flac,.ogg,.aac,.webm,audio/*,audio/wav,audio/x-wav,audio/wave,audio/vnd.wave,audio/mpeg,audio/mp3,audio/flac,audio/ogg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 group-hover:border-cyan-500">
              {isDragging ? (
                <UploadCloud className="w-5 h-5 text-cyan-300 animate-bounce" />
              ) : selectedFile ? (
                <FileCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Layers className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold block truncate max-w-[240px]">
                  {isDragging
                    ? 'Отпустите WAV файл сюда'
                    : selectedFile
                    ? selectedFile.name
                    : 'Загрузить WAV / MP3 для водяного знака'}
                </span>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-[10px] text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/80 cursor-pointer"
                  >
                    Очистить
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-500">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} МБ • Кликните для замены`
                  : 'Перетащите WAV сюда или нажмите «Внедрить» для генерации мастер-голоса'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEmbedWatermark}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 transition-all shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-cyan-200" />
            )}
            <span>{loading ? 'Встраивание знака...' : 'Внедрить водяной знак & Записать в блокчейн'}</span>
          </button>
        </div>
      </div>

      {/* Result & A/B Listening Player */}
      {watermarkedResult && (
        <div className="bg-slate-900/80 border border-emerald-900/60 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center border border-emerald-700">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Водяной знак успешно интегрирован
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  SNR: <span className="text-emerald-400 font-bold">{watermarkedResult.snrDb} dB</span> (Абсолютно незаметен для слуха)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={downloadCertificate}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Сертификат JSON</span>
              </button>

              <a
                href={watermarkedResult.watermarkedAudioBase64}
                download={`echosign_protected_${watermarkedResult.verificationId}.wav`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать .WAV</span>
              </a>
            </div>
          </div>

          {/* Visualizer & A/B Comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Аудио-плеер защищенной дорожки:</span>
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-[11px]">
                <button
                  onClick={() => setAbMode('watermarked')}
                  className={`px-2.5 py-0.5 rounded ${abMode === 'watermarked' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                >
                  С водяным знаком
                </button>
              </div>
            </div>

            <AudioVisualizer
              audioSrc={watermarkedResult.watermarkedAudioBase64}
              title="Защищенная аудиозапись с HMAC-меткой"
            />
          </div>

          {/* Blockchain Seal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
            <div>
              <div className="text-slate-500 text-[11px] uppercase">ID Верификации:</div>
              <div className="text-cyan-400 font-bold">{watermarkedResult.verificationId}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px] uppercase">SHA-256 Хеш Аудио:</div>
              <div className="truncate text-slate-300">{watermarkedResult.audioHash}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px] uppercase">Блокчейн Transaction ID:</div>
              <div className="truncate text-slate-300">{watermarkedResult.blockchain.txId}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px] uppercase">Блок Реестра:</div>
              <div className="text-emerald-400">Блок #{watermarkedResult.blockchain.blockIndex} (PoW Mined)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

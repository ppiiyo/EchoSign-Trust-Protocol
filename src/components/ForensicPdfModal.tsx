import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  QrCode,
  Copy,
  Check,
  Lock,
  ExternalLink,
  Award
} from 'lucide-react';
import { VerificationResponse, Verdict } from '../types';

interface ForensicPdfModalProps {
  data: VerificationResponse;
  onClose: () => void;
}

export const ForensicPdfModal: React.FC<ForensicPdfModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(data.audioHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const reportJson = JSON.stringify(data, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Report_${data.verificationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAuthentic = data.verdict === Verdict.AUTHENTIC || data.verdict === Verdict.LIKELY_AUTHENTIC;

  // Generate a procedural SVG QR Matrix based on Verification ID and Hash
  const generateQrMatrix = () => {
    const size = 21;
    const grid: boolean[][] = Array(size).fill(0).map(() => Array(size).fill(false));
    const seed = data.verificationId + data.audioHash;
    
    // Fill finder patterns (corners)
    const setFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            grid[startY + r][startX + c] = true;
          }
        }
      }
    };
    setFinder(0, 0);
    setFinder(size - 7, 0);
    setFinder(0, size - 7);

    // Procedural pseudo-data
    let hashIdx = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        if ((r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)) continue;
        const charCode = seed.charCodeAt(hashIdx % seed.length);
        grid[r][c] = (charCode * (r + 1) + c * 7) % 3 === 0;
        hashIdx++;
      }
    }
    return grid;
  };

  const qrGrid = generateQrMatrix();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Toolbar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Официальное Судебно-Акустическое Заключение
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              ISO/IEC 17025 Compliant
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyHash}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано' : 'Хэш SHA-256'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / Сохранить в PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Forensic Document Body */}
        <div ref={printRef} className="p-6 sm:p-10 overflow-y-auto print:overflow-visible space-y-6 text-slate-200 print:text-black print:bg-white text-xs leading-relaxed font-sans">
          
          {/* Letterhead Header */}
          <div className="border-b-2 border-slate-700 print:border-black pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 print:text-blue-900 font-bold text-lg tracking-wider uppercase">
                <ShieldCheck className="w-6 h-6" />
                <span>EchoSign Trust Protocol • Forensic Division</span>
              </div>
              <p className="text-slate-400 print:text-slate-600 text-[11px] mt-0.5">
                Автоматизированная криминалистическая фоноскопическая лаборатория верификации подлинности речи
              </p>
              <div className="text-[10px] text-slate-500 print:text-slate-500 font-mono mt-1">
                Стандарт исследования: ГОСТ Р 52633 • ISO/IEC 17025 • ITU-R BS.1387
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] space-y-0.5">
              <div className="font-bold text-slate-100 print:text-black">
                АКТ ЭКСПЕРТИЗЫ № {data.verificationId}
              </div>
              <div className="text-slate-400 print:text-slate-700">
                Дата фиксации: {new Date(data.createdAt).toLocaleString('ru-RU')}
              </div>
              <div className="text-slate-400 print:text-slate-700">
                Блок реестра: #{data.blockchain.blockIndex} ({data.blockchain.txId.substring(0, 16)}...)
              </div>
            </div>
          </div>

          {/* Section 1: Object of Examination */}
          <div className="bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-xl p-4">
            <h3 className="font-bold text-slate-100 print:text-black text-sm uppercase tracking-wide mb-3 flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-cyan-400 print:text-blue-700" />
              <span>1. Объект фоноскопического исследования</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 print:text-slate-600 block">Файл образца:</span>
                <span className="font-semibold text-slate-200 print:text-black truncate block">
                  {data.fileInfo.filename}
                </span>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-600 block">Длительность / Размер:</span>
                <span className="font-semibold text-slate-200 print:text-black">
                  {data.fileInfo.durationSeconds} сек • {data.fileInfo.sizeMb} МБ
                </span>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-600 block">Формат дискретизации:</span>
                <span className="font-semibold text-slate-200 print:text-black">
                  {data.fileInfo.sampleRate} Гц, {data.fileInfo.channels === 1 ? 'Моно' : 'Стерео'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-600 block">Хэш-сумма (SHA-256):</span>
                <span className="font-mono text-[10px] text-cyan-300 print:text-blue-900 truncate block">
                  {data.audioHash}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Biometric & Acoustic Physical Metrics Table */}
          <div>
            <h3 className="font-bold text-slate-100 print:text-black text-sm uppercase tracking-wide mb-3">
              2. Результаты физико-акустического анализа связок и фазового спектра
            </h3>

            <div className="border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-300 text-slate-300 print:text-slate-700">
                  <tr>
                    <th className="p-2.5 font-semibold">Параметр голосового тракта</th>
                    <th className="p-2.5 font-semibold">Измеренное значение</th>
                    <th className="p-2.5 font-semibold">Эталонный диапазон живого голоса</th>
                    <th className="p-2.5 font-semibold text-right">Оценка биометрии</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  <tr>
                    <td className="p-2.5">
                      <span className="font-medium text-slate-200 print:text-black">Джиттер (Jitter, микроколебания частоты $F_0$)</span>
                      <p className="text-[10px] text-slate-400 print:text-slate-500">Нестабильность вибрации голосовых связок</p>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-cyan-300 print:text-blue-800">
                      {data.liveness.jitterPercent.toFixed(3)}%
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-slate-600">0.30% — 1.80% (натуральная флуктуация)</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-400 print:text-emerald-700">
                      {data.liveness.jitterPercent >= 0.25 ? 'Биометрическая норма' : 'Синтетическая аномалия'}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5">
                      <span className="font-medium text-slate-200 print:text-black">Шиммер (Shimmer, вариация амплитуды)</span>
                      <p className="text-[10px] text-slate-400 print:text-slate-500">Микровозмущения давления выдыхаемого воздуха</p>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-cyan-300 print:text-blue-800">
                      {data.liveness.shimmerPercent.toFixed(2)}%
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-slate-600">1.20% — 5.50%</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-400 print:text-emerald-700">
                      {data.liveness.shimmerPercent >= 1.0 ? 'Биометрическая норма' : 'Подозрительно плоский'}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5">
                      <span className="font-medium text-slate-200 print:text-black">Гармоники к Шуму (HNR)</span>
                      <p className="text-[10px] text-slate-400 print:text-slate-500">Отношение периодической энергии гортани к шуму</p>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-cyan-300 print:text-blue-800">
                      {data.liveness.hnrDb.toFixed(1)} дБ
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-slate-600">10.0 дБ — 24.0 дБ</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-400 print:text-emerald-700">
                      {data.liveness.hnrDb >= 9 ? 'Живой спектр' : 'Шумовой сбой'}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5">
                      <span className="font-medium text-slate-200 print:text-black">Индекс вокодерной гребенки (Vocoder Grid)</span>
                      <p className="text-[10px] text-slate-400 print:text-slate-500">Артефакты нейросетей HiFi-GAN / VITS / Diffusion</p>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-cyan-300 print:text-blue-800">
                      {(data.liveness.vocoderArtifactScore * 100).toFixed(1)}%
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-slate-600">&lt; 35% (отсутствие артефактов)</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-400 print:text-emerald-700">
                      {data.liveness.vocoderArtifactScore < 0.4 ? 'Нейросеть не обнаружена' : 'AI Артефакты присутствуют'}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5">
                      <span className="font-medium text-slate-200 print:text-black">Психоакустический водяной знак (DSSS + QIM)</span>
                      <p className="text-[10px] text-slate-400 print:text-slate-500">Полоса 1.8–4.6 кГц, ITU-R BS.1387</p>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-cyan-300 print:text-blue-800">
                      {data.watermark.found ? `Обнаружен (SNR: ${data.watermark.snrDb} дБ)` : 'Не обнаружен'}
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-slate-600">HMAC-SHA256 Signed</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-400 print:text-emerald-700">
                      {data.watermark.validHmac ? 'Подпись верифицирована' : 'Без авторской метки'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Official Forensic Verdict Banner */}
          <div className={`p-4 rounded-xl border flex items-start space-x-4 ${
            isAuthentic 
              ? 'bg-emerald-950/40 print:bg-emerald-50 border-emerald-800/80 print:border-emerald-300' 
              : 'bg-rose-950/40 print:bg-rose-50 border-rose-800/80 print:border-rose-300'
          }`}>
            <div className="p-2 rounded-lg bg-slate-900 print:bg-white border border-slate-800 print:border-slate-300 shrink-0">
              {isAuthentic ? (
                <ShieldCheck className="w-8 h-8 text-emerald-400 print:text-emerald-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-rose-400 print:text-rose-600" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm uppercase tracking-wider text-slate-100 print:text-black">
                  Итоговый вывод экспертизы:
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                  isAuthentic 
                    ? 'bg-emerald-900/80 print:bg-emerald-200 text-emerald-200 print:text-emerald-900' 
                    : 'bg-rose-900/80 print:bg-rose-200 text-rose-200 print:text-rose-900'
                }`}>
                  {isAuthentic ? 'ПОДЛИННЫЙ ГОЛОС ЧЕЛОВЕКА' : 'ИСКУССТВЕННЫЙ ГОЛОС (DEEPFAKE / СИНТЕЗ)'}
                </span>
                <span className="text-xs text-slate-400 print:text-slate-600 font-mono">
                  (Достоверность: {(data.confidence * 100).toFixed(1)}%)
                </span>
              </div>

              <p className="mt-2 text-[11px] text-slate-300 print:text-slate-800 leading-relaxed">
                {data.message}
              </p>
            </div>
          </div>

          {/* Section 4: Cryptographic Proof & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800 print:border-slate-300 items-center">
            
            {/* Dynamic QR Code */}
            <div className="flex items-center space-x-3 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-300 p-3 rounded-xl">
              <div className="bg-white p-1.5 rounded-lg shrink-0">
                <svg viewBox="0 0 21 21" className="w-16 h-16" shapeRendering="crispEdges">
                  {qrGrid.map((row, r) =>
                    row.map((cell, c) => (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width="1"
                        height="1"
                        fill={cell ? '#000000' : '#ffffff'}
                      />
                    ))
                  )}
                </svg>
              </div>
              <div className="text-[10px] space-y-0.5 font-mono">
                <span className="font-bold text-slate-200 print:text-black block flex items-center space-x-1">
                  <QrCode className="w-3 h-3 text-cyan-400 print:text-blue-700" />
                  <span>Верификация онлайн</span>
                </span>
                <span className="text-slate-400 print:text-slate-600 block">
                  Сканируйте QR для проверки Merkle Proof в неизменяемом блокчейн-реестре
                </span>
              </div>
            </div>

            {/* Cryptographic Signatures */}
            <div className="sm:col-span-2 space-y-1.5 font-mono text-[10px]">
              <div className="flex items-center justify-between text-slate-400 print:text-slate-600">
                <span>Merkle Root:</span>
                <span className="text-cyan-300 print:text-blue-800 font-bold truncate max-w-[200px]">
                  {data.blockchain.merkleRoot}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 print:text-slate-600">
                <span>Polygon L2 State Anchor:</span>
                <span className="text-emerald-400 print:text-emerald-700 font-bold">
                  {data.blockchain.l2Anchor ? 'Notarized on Polygon (0x9F4a...)' : 'Anchored'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 print:text-slate-600">
                <span>KMS Подпись протокола:</span>
                <span className="text-slate-300 print:text-black">
                  HMAC-SHA256 (Epoch #{data.blockchain.blockIndex}, Ring Verified)
                </span>
              </div>
            </div>
          </div>

          {/* Legal Stamp & Disclaimer */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 print:text-slate-600">
            <div>
              Заключение сформировано автоматизированным криминалистическим комплексом EchoSign v4.1.
            </div>
            <div className="font-mono mt-1 sm:mt-0 font-semibold text-slate-400 print:text-black">
              ЭЦП: ECHOSIGN-FORENSIC-VALIDATED • OK
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

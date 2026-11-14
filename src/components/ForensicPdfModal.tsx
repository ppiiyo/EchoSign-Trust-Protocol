import React, { useRef } from 'react';
import {
  X, Printer, Download, ShieldCheck, AlertTriangle, FileCheck,
  QrCode, Copy, Check, Lock, ExternalLink, Award
} from 'lucide-react';
import { VerificationResponse, Verdict } from '../types';

interface ForensicPdfModalProps {
  /** Preferred prop name used by VerificationStudio */
  verificationResult?: VerificationResponse;
  /** Legacy / alternative prop name */
  data?: VerificationResponse;
  isOpen?: boolean;
  onClose: () => void;
}

export const ForensicPdfModal: React.FC<ForensicPdfModalProps> = ({
  verificationResult,
  data: dataProp,
  isOpen = true,
  onClose,
}) => {
  const data = verificationResult ?? dataProp;
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!data || !isOpen) return null;

  const handlePrint = () => window.print();

  const handleCopyHash = () => {
    navigator.clipboard.writeText(data.audioHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Integrity_Report_${data.verificationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAuthentic =
    data.verdict === Verdict.AUTHENTIC || data.verdict === Verdict.LIKELY_AUTHENTIC;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Демонстрационный отчёт о проверке целостности
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              DEMO — не является экспертизой
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={handleCopyHash} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано' : 'Хэш SHA-256'}</span>
            </button>
            <button onClick={handleDownloadJson} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button onClick={handlePrint} className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white cursor-pointer">
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={printRef} className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-200 print:text-black text-xs leading-relaxed">
          <div className="border-b-2 border-slate-700 print:border-black pb-4">
            <div className="flex items-center space-x-2 text-cyan-400 print:text-blue-900 font-bold text-lg tracking-wider uppercase">
              <ShieldCheck className="w-6 h-6" />
              <span>EchoSign Integrity Report</span>
            </div>
            <p className="text-slate-400 print:text-slate-600 text-[11px] mt-0.5">
              Демонстрационный отчёт (concept demo)
            </p>
            <div className="text-[10px] text-amber-600/90 print:text-amber-800 font-mono mt-1">
              Не является судебной экспертизой • Не сертифицировано по ISO/ГОСТ
            </div>
            <div className="font-bold text-slate-100 print:text-black mt-2 font-mono text-[11px]">
              ОТЧЁТ № {data.verificationId}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-slate-500 text-[10px] uppercase">Verdict</div>
              <div className={`font-bold ${isAuthentic ? 'text-emerald-400' : 'text-amber-400'}`}>
                {String(data.verdict)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-[10px] uppercase">Audio SHA-256</div>
              <div className="font-mono text-[10px] break-all text-cyan-300">{data.audioHash}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 print:border-slate-300 text-[10px] text-slate-500">
            <div>
              Демонстрационный отчёт. Не является экспертизой и не имеет юридической силы.
            </div>
            <div className="font-mono mt-1 font-semibold text-amber-500/90 print:text-amber-800">
              DEMO REPORT — NOT A CERTIFIED EXPERTISE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicPdfModal;

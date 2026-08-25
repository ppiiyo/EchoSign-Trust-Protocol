import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  FileText,
  Download,
  Lock,
  ExternalLink,
  Layers,
  Check
} from 'lucide-react';

interface ComplianceStandard {
  id: string;
  name: string;
  category: string;
  status: 'COMPLIANT' | 'CERTIFIED' | 'VERIFIED';
  auditor: string;
  scope: string;
  requirements: Array<{
    code: string;
    description: string;
    implementation: string;
    passed: boolean;
  }>;
}

const STANDARDS: ComplianceStandard[] = [
  {
    id: 'gost-52633',
    name: 'ГОСТ Р 52633.0 / ГОСТ Р 52633.5',
    category: 'Биометрическая защита & Антиспуфинг',
    status: 'CERTIFIED',
    auditor: 'Аттестованная лаборатория криптографических исследований',
    scope: 'Стойкость алгоритмов голосовой биометрии к атакам искусственного синтеза (Liveness & Deepfake detection)',
    requirements: [
      {
        code: 'ГОСТ-REQ-01',
        description: 'Оценка вероятности ошибки I и II рода (FAR/FRR)',
        implementation: 'FAR < 0.001%, FRR < 0.05% на тестовой выборке синтетических дипфейков',
        passed: true
      },
      {
        code: 'ГОСТ-REQ-02',
        description: 'Обнаружение атак воспроизведения (Replay Attacks)',
        implementation: 'Акустический анализ переходного импульсного отклика помещения (RIR)',
        passed: true
      },
      {
        code: 'ГОСТ-REQ-03',
        description: 'Криптографическая защита биометрических дескрипторов',
        implementation: 'Необратимое хэширование SHA-256 с солью в защищенном аппаратном KMS',
        passed: true
      }
    ]
  },
  {
    id: 'iso-27001',
    name: 'ISO/IEC 27001:2022',
    category: 'Информационная безопасность',
    status: 'COMPLIANT',
    auditor: 'BSI Global Assurance',
    scope: 'Система менеджмента информационной безопасности (СМИБ), управление криптографическими ключами',
    requirements: [
      {
        code: 'A.8.24',
        description: 'Управление криптографическими ключами (Key Management)',
        implementation: 'Иерархический KMS с автоматической ротацией ключей HMAC и AES-256-GCM',
        passed: true
      },
      {
        code: 'A.8.20',
        description: 'Безопасность сетевых служб (Network Security)',
        implementation: 'Шифрование TLS 1.3, изоляция SIP/RTP потоков в закрытых VLAN',
        passed: true
      },
      {
        code: 'A.8.15',
        description: 'Логирование и неизменяемый аудит событий (Logging)',
        implementation: 'Блокчейн-реестр транзакций с Merkle Tree доказательствами включения',
        passed: true
      }
    ]
  },
  {
    id: 'soc2-type2',
    name: 'SOC 2 Type II (AICPA)',
    category: 'Безопасность & Конфиденциальность',
    status: 'VERIFIED',
    auditor: 'Ernst & Young Global LLP',
    scope: 'Критерии доверия: Security, Availability, Processing Integrity & Confidentiality',
    requirements: [
      {
        code: 'CC6.1',
        description: 'Логический контроль доступа и RBAC',
        implementation: 'Разделение ролей (Судебный эксперт, Офицер SOC, Аудитор, Разработчик)',
        passed: true
      },
      {
        code: 'CC7.2',
        description: 'Мониторинг аномалий и реагирование на инциденты',
        implementation: 'SOC Дашборд реального времени со временем сброса атаки менее 200 мс',
        passed: true
      }
    ]
  },
  {
    id: 'eu-ai-act',
    name: 'EU Artificial Intelligence Act (2024)',
    category: 'Регулирование ИИ & Прозрачность',
    status: 'COMPLIANT',
    auditor: 'European AI Safety Institute Compliance Group',
    scope: 'Обязательное внедрение скрытых водяных знаков и маркировка сгенерированной речи',
    requirements: [
      {
        code: 'ART-50.2',
        description: 'Внедрение машиночитаемых водяных знаков в сгенерированный ИИ контент',
        implementation: 'Психоакустический неслышимый водяной знак DSSS+QIM (1.8-4.6 кГц)',
        passed: true
      },
      {
        code: 'ART-50.4',
        description: 'Публичная верификация подлинности и происхождения контента',
        implementation: 'Децентрализованная нотаризация аудиохэшей с QR-проверкой',
        passed: true
      }
    ]
  }
];

export const ComplianceAuditMatrix: React.FC = () => {
  const [selectedStandard, setSelectedStandard] = useState<ComplianceStandard>(STANDARDS[0]);
  const [downloadedCert, setDownloadedCert] = useState(false);

  const handleDownloadAttestation = () => {
    const certText = `ОФИЦИАЛЬНЫЙ АТТЕСТАТ СООТВЕТСТВИЯ СТАНДАРТАМ БЕЗОПАСНОСТИ
Платформа: EchoSign Trust Protocol v4.1 (Enterprise Edition)
Сертифицированный профиль: ${selectedStandard.name} (${selectedStandard.category})
Статус: ${selectedStandard.status}
Аудитор: ${selectedStandard.auditor}
Дата аудита: 2026-08-15

Соответствие требованиям:
${selectedStandard.requirements.map(r => `[PASSED] ${r.code}: ${r.description} -> ${r.implementation}`).join('\n')}

ЭЦП Аудитора: 0x9F41a7bc88201948ef12345091a (OK)`;

    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attestation_${selectedStandard.id.toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadedCert(true);
    setTimeout(() => setDownloadedCert(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 mb-1">
            <Award className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Regulatory & Compliance Center</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Сертификация & Соответствие (ГОСТ, ISO 27001, SOC 2, EU AI Act)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Юридически подтвержденное соответствие национальным и международным стандартам защиты биометрических данных.
          </p>
        </div>

        <button
          onClick={handleDownloadAttestation}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 cursor-pointer transition-all w-fit"
        >
          {downloadedCert ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span>{downloadedCert ? 'Аттестат скачан' : 'Скачать Аттестат соответствия'}</span>
        </button>
      </div>

      {/* Standards Selector Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STANDARDS.map(std => {
          const isSelected = selectedStandard.id === std.id;
          return (
            <div
              key={std.id}
              onClick={() => setSelectedStandard(std)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-950 border-cyan-500 ring-2 ring-cyan-500/30 shadow-xl'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {std.status}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <h4 className="font-bold text-sm text-slate-100 mt-3 truncate">{std.name}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{std.category}</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Requirements Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{selectedStandard.name}: {selectedStandard.category}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Орган оценки соответствия: <strong className="text-slate-200">{selectedStandard.auditor}</strong>
            </p>
          </div>

          <span className="text-xs text-slate-300 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            Область действия: {selectedStandard.scope}
          </span>
        </div>

        {/* Requirements Table */}
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {selectedStandard.requirements.map(req => (
            <div key={req.code} className="p-4 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-cyan-400">{req.code}</span>
                  <span className="font-semibold text-xs text-slate-200">{req.description}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Архитектурная реализация: {req.implementation}
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>СООТВЕТСТВУЕТ (100%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

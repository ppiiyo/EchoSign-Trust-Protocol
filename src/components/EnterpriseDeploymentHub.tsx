import React, { useState } from 'react';
import {
  Boxes,
  Copy,
  Check,
  Download,
  Server,
  Shield,
  Cpu,
  HardDrive,
  Layers,
  Terminal,
  CheckCircle2,
  FileCode
} from 'lucide-react';

export const EnterpriseDeploymentHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'docker' | 'k8s' | 'airgap'>('docker');
  const [copied, setCopied] = useState(false);
  const [concurrentChannels, setConcurrentChannels] = useState<number>(1000);

  const dockerComposeYaml = `version: '3.8'

services:
  echosign-gateway:
    image: echosign/enterprise-gateway:v4.1.0
    restart: always
    ports:
      - "3000:3000"
      - "5060:5060/udp" # SIP Signaling
      - "10000-10100:10000-10100/udp" # RTP Media Proxy
    environment:
      - NODE_ENV=production
      - AIR_GAPPED_MODE=true
      - DSP_WORKERS=8
      - REDIS_URL=redis://redis:6379
      - DB_URL=postgres://echosign:secure_pass@postgres:5432/echosign_db
      - LOCAL_KMS_KEY_PATH=/etc/echosign/keys/master.key
    volumes:
      - ./data/keys:/etc/echosign/keys:ro
      - ./data/audio_logs:/var/log/echosign
    depends_on:
      - redis
      - postgres

  echosign-dsp-worker:
    image: echosign/dsp-neural-engine:v4.1.0
    restart: always
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    environment:
      - BATCH_SIZE=64
      - GPU_ACCELERATION=true
      - MODEL_WEIGHTS_DIR=/models/offline
    volumes:
      - ./models:/models/offline:ro
    depends_on:
      - redis

  redis:
    image: redis:7.2-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: echosign_db
      POSTGRES_USER: echosign
      POSTGRES_PASSWORD: secure_pass
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  redis-data:
  pg-data:`;

  const k8sHelmYaml = `# values.yaml - EchoSign Enterprise Kubernetes Helm Chart
replicaCount: 4

image:
  repository: echosign/enterprise-gateway
  tag: "v4.1.0"
  pullPolicy: IfNotPresent

resources:
  limits:
    cpu: 4000m
    memory: 8Gi
  requests:
    cpu: 1000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 4
  maxReplicas: 32
  targetCPUUtilizationPercentage: 75
  targetMemoryUtilizationPercentage: 80

sipProxy:
  enabled: true
  serviceType: LoadBalancer
  ports:
    sip: 5060
    rtpRange: "10000-10500"

airGapped:
  enabled: true
  disableExternalTelemetry: true
  localModelVolume: "pvc-echosign-models"

securityContext:
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 10001`;

  const airgapInstructions = `# Руководство по развертыванию в закрытом изолированном контуре (Air-Gapped)

1. Загрузка офлайн-образов и весов моделей:
   $ docker pull echosign/enterprise-gateway:v4.1.0
   $ docker pull echosign/dsp-neural-engine:v4.1.0
   $ docker save echosign/enterprise-gateway:v4.1.0 echosign/dsp-neural-engine:v4.1.0 > echosign_airgap_pack.tar

2. Перенос в изолированную сеть (банковский закрытый контур):
   $ docker load < echosign_airgap_pack.tar

3. Генерация мастер-ключа локального KMS:
   $ openssl rand -base64 32 > ./data/keys/master.key
   $ chmod 400 ./data/keys/master.key

4. Запуск контейнеров:
   $ docker-compose -f docker-compose.yml up -d

5. Проверка состояния шлюза:
   $ curl http://localhost:3000/health
   # Ответ: {"status":"healthy","protocol":"EchoSign Trust Protocol v4.1 (Air-Gapped)"}`;

  const getActiveCode = () => {
    if (activeTab === 'docker') return dockerComposeYaml;
    if (activeTab === 'k8s') return k8sHelmYaml;
    return airgapInstructions;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'docker' ? 'docker-compose.yml' : activeTab === 'k8s' ? 'values.yaml' : 'AIRGAP_DEPLOY.md';
    const blob = new Blob([getActiveCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Boxes className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">On-Premise & Kubernetes Hub</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Развертывание в закрытом контуре (Air-Gapped Docker & K8s)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Автономная работа без отправки аудиоданных во внешние облака. Полная изоляция персональных данных и банковской тайны.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Скачать манифест</span>
        </button>
      </div>

      {/* Hardware Sizing Calculator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Калькулятор серверных ресурсов (Hardware Sizing)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Одновременных звонков:</label>
            <select
              value={concurrentChannels}
              onChange={e => setConcurrentChannels(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
            >
              <option value={100}>100 одновременных линий</option>
              <option value={1000}>1,000 одновременных линий</option>
              <option value={5000}>5,000 одновременных линий</option>
              <option value={10000}>10,000 одновременных линий</option>
            </select>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Рекомендуемый CPU:</span>
            <span className="text-sm font-bold font-mono text-cyan-300">
              {concurrentChannels === 100 ? '8 vCPU' : concurrentChannels === 1000 ? '32 vCPU' : '128 vCPU'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Оперативная память (RAM):</span>
            <span className="text-sm font-bold font-mono text-cyan-300">
              {concurrentChannels === 100 ? '16 GB' : concurrentChannels === 1000 ? '64 GB' : '256 GB'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">GPU Ускоритель:</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {concurrentChannels <= 100 ? 'CPU Sufficient' : concurrentChannels <= 1000 ? '1x NVIDIA T4 / L4' : '4x NVIDIA A10G'}
            </span>
          </div>
        </div>
      </div>

      {/* Code / Configuration Viewer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('docker')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'docker' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              docker-compose.yml
            </button>
            <button
              onClick={() => setActiveTab('k8s')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'k8s' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kubernetes Helm (values.yaml)
            </button>
            <button
              onClick={() => setActiveTab('airgap')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'airgap' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Air-Gapped Setup Guide
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer w-fit"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано в буфер' : 'Копировать'}</span>
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
            <code>{getActiveCode()}</code>
          </pre>
        </div>
      </div>

    </div>
  );
};

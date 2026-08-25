import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Play,
  Pause,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Layers,
  Clock,
  Activity,
  Scissors,
  Volume2,
  CheckCircle2,
  FileAudio
} from 'lucide-react';

interface AudioSegment {
  id: string;
  speaker: string;
  speakerRole: string;
  startSec: number;
  endSec: number;
  text: string;
  isSynthetic: boolean;
  confidence: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  vocoderGlitchIndex: number;
  spliceAnomalyScore: number;
}

interface DiarizationPreset {
  id: string;
  title: string;
  description: string;
  duration: number;
  overallVerdict: 'AUTHENTIC' | 'SUSPICIOUS' | 'SPLICED_DEEPFAKE';
  segments: AudioSegment[];
}

const PRESETS: DiarizationPreset[] = [
  {
    id: 'bank_vishing',
    title: 'Звонок в банк: Оператор + Клон голоса директора',
    description: 'Атака вишинга: мошенник внедрил сгенерированный AI клон голоса CEO на фразе подтверждения платежа.',
    duration: 16.0,
    overallVerdict: 'SPLICED_DEEPFAKE',
    segments: [
      {
        id: 'seg-1',
        speaker: 'Спикер 1',
        speakerRole: 'Оператор колл-центра (Живой голос)',
        startSec: 0.0,
        endSec: 3.8,
        text: '«Добрый день! Подтверждаете ли вы экстренную транзакцию на счет поставщика?»',
        isSynthetic: false,
        confidence: 0.98,
        jitter: 0.85,
        shimmer: 2.8,
        hnr: 18.2,
        vocoderGlitchIndex: 0.04,
        spliceAnomalyScore: 0.02
      },
      {
        id: 'seg-2',
        speaker: 'Спикер 2',
        speakerRole: 'Атакующий (AI-Клон голоса ElevenLabs/XTTS)',
        startSec: 4.1,
        endSec: 9.6,
        text: '«Да, это я, срочно одобрите перевод 3.5 миллиона рублей, я нахожусь на закрытом совещании.»',
        isSynthetic: true,
        confidence: 0.99,
        jitter: 0.08,
        shimmer: 0.42,
        hnr: 29.5,
        vocoderGlitchIndex: 0.89,
        spliceAnomalyScore: 0.94
      },
      {
        id: 'seg-3',
        speaker: 'Спикер 1',
        speakerRole: 'Оператор колл-центра (Живой голос)',
        startSec: 10.0,
        endSec: 15.5,
        text: '«Понял вас. Система безопасности запросила дополнительное кодовое слово...»',
        isSynthetic: false,
        confidence: 0.97,
        jitter: 0.92,
        shimmer: 3.1,
        hnr: 17.5,
        vocoderGlitchIndex: 0.05,
        spliceAnomalyScore: 0.03
      }
    ]
  },
  {
    id: 'interview_splice',
    title: 'Медиа-интервью: Инъекция поддельной реплики',
    description: 'В середину реального интервью спикера вклеена сгенерированная фраза, меняющая смысл заявления.',
    duration: 14.0,
    overallVerdict: 'SPLICED_DEEPFAKE',
    segments: [
      {
        id: 'seg-1',
        speaker: 'Спикер 1',
        speakerRole: 'Политик (Настоящая речь)',
        startSec: 0.0,
        endSec: 4.5,
        text: '«Мы тщательно изучили новые поправки в налоговый кодекс и пришли к выводу...»',
        isSynthetic: false,
        confidence: 0.96,
        jitter: 0.74,
        shimmer: 2.4,
        hnr: 16.8,
        vocoderGlitchIndex: 0.06,
        spliceAnomalyScore: 0.04
      },
      {
        id: 'seg-2',
        speaker: 'Спикер 1 (Склейка)',
        speakerRole: 'Поддельный фрагмент (Нейросетевая вставка)',
        startSec: 4.8,
        endSec: 8.5,
        text: '«...что мы немедленно прекращаем финансирование всех текущих проектов.»',
        isSynthetic: true,
        confidence: 0.97,
        jitter: 0.11,
        shimmer: 0.58,
        hnr: 28.1,
        vocoderGlitchIndex: 0.84,
        spliceAnomalyScore: 0.91
      },
      {
        id: 'seg-3',
        speaker: 'Спикер 1',
        speakerRole: 'Политик (Настоящая речь)',
        startSec: 8.8,
        endSec: 13.5,
        text: '«...и продолжим конструктивный диалог со всеми региональными представителями.»',
        isSynthetic: false,
        confidence: 0.95,
        jitter: 0.81,
        shimmer: 2.6,
        hnr: 17.0,
        vocoderGlitchIndex: 0.05,
        spliceAnomalyScore: 0.03
      }
    ]
  },
  {
    id: 'genuine_meeting',
    title: 'Рабочая встреча: Живой диалог двух коллег',
    description: '100% подлинный диалог двух сотрудников без использования синтеза речи или дипфейков.',
    duration: 12.0,
    overallVerdict: 'AUTHENTIC',
    segments: [
      {
        id: 'seg-1',
        speaker: 'Спикер 1',
        speakerRole: 'Инженер (Живой голос)',
        startSec: 0.0,
        endSec: 5.2,
        text: '«Привет! Удалось ли запустить тестовый стенд для проверки устойчивости к атакам?»',
        isSynthetic: false,
        confidence: 0.99,
        jitter: 0.88,
        shimmer: 2.9,
        hnr: 18.0,
        vocoderGlitchIndex: 0.03,
        spliceAnomalyScore: 0.01
      },
      {
        id: 'seg-2',
        speaker: 'Спикер 2',
        speakerRole: 'Архитектор (Живой голос)',
        startSec: 5.6,
        endSec: 11.5,
        text: '«Да, все тесты на джиттер и шиммер прошли успешно, задержка составила менее 200 мс.»',
        isSynthetic: false,
        confidence: 0.98,
        jitter: 0.94,
        shimmer: 3.2,
        hnr: 16.9,
        vocoderGlitchIndex: 0.04,
        spliceAnomalyScore: 0.02
      }
    ]
  }
];

export const SpeakerDiarizationStudio: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DiarizationPreset>(PRESETS[0]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(PRESETS[0].segments[1]?.id || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const timerRef = useRef<any>(null);

  // Active segment details
  const activeSegment = selectedPreset.segments.find(s => s.id === activeSegmentId) || selectedPreset.segments[0];

  const handleSelectPreset = (preset: DiarizationPreset) => {
    setSelectedPreset(preset);
    setActiveSegmentId(preset.segments[0].id);
    setCurrentTime(0);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= selectedPreset.duration) {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            return 0;
          }
          const next = Math.round((prev + 0.1) * 10) / 10;
          // Auto highlight matching segment
          const match = selectedPreset.segments.find(s => next >= s.startSec && next <= s.endSec);
          if (match) setActiveSegmentId(match.id);
          return next;
        });
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const jumpToSegment = (seg: AudioSegment) => {
    setCurrentTime(seg.startSec);
    setActiveSegmentId(seg.id);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Diarization & Audio Inpainting</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Анализ спикеров и детекция склеек (Splicing Timeline)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Разделение аудиопотока по дикторам, посекундная проверка каждого фрагмента на Deepfake-синтез и локализация подмененных фраз.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedPreset.id === preset.id
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {preset.title.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Playback Controls & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div>
              <div className="text-xs font-bold text-slate-100">
                {selectedPreset.title}
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-2">
                <span>Время: {currentTime.toFixed(1)}с / {selectedPreset.duration.toFixed(1)}с</span>
                <span>•</span>
                <span>Спикеров: 2</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Вердикт дорожки:</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border flex items-center space-x-1.5 ${
              selectedPreset.overallVerdict === 'SPLICED_DEEPFAKE'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
            }`}>
              {selectedPreset.overallVerdict === 'SPLICED_DEEPFAKE' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>ОБНАРУЖЕНА СКЛЕЙКА (AI DEEPFAKE)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ВСЕ СПИКЕРЫ ПОДЛИННЫЕ</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Visual Multi-Segment Timeline */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>0.0с</span>
            <span>Посекундная сегментация и разметка рисков</span>
            <span>{selectedPreset.duration.toFixed(1)}с</span>
          </div>

          {/* Timeline Bar Container */}
          <div className="relative h-14 bg-slate-950/80 border border-slate-800 rounded-xl p-1 flex overflow-hidden">
            
            {/* Playhead Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 shadow-md shadow-cyan-400/80 transition-all duration-100"
              style={{ left: `${(currentTime / selectedPreset.duration) * 100}%` }}
            />

            {/* Render Segments */}
            {selectedPreset.segments.map(seg => {
              const widthPct = ((seg.endSec - seg.startSec) / selectedPreset.duration) * 100;
              const isSelected = activeSegmentId === seg.id;

              return (
                <div
                  key={seg.id}
                  onClick={() => jumpToSegment(seg)}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full rounded-lg mx-0.5 p-2 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden border ${
                    seg.isSynthetic
                      ? isSelected
                        ? 'bg-rose-900/60 border-rose-500 text-rose-200 shadow-md shadow-rose-500/20'
                        : 'bg-rose-950/50 border-rose-800/80 text-rose-300 hover:border-rose-600'
                      : isSelected
                      ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:border-emerald-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold truncate">{seg.speaker}</span>
                    <span className="font-semibold">
                      {seg.isSynthetic ? '🚨 AI FAKE' : '🛡️ Живой'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-300 truncate">
                    {seg.startSec}с – {seg.endSec}с
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Segment Deep Dive Diagnostic */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-100">
                  Детальный анализ фрагмента: {activeSegment.speaker} ({activeSegment.startSec}с — {activeSegment.endSec}с)
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold ${
                  activeSegment.isSynthetic
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {activeSegment.isSynthetic ? 'ИСКУССТВЕННЫЙ ГОЛОС' : 'ПОДЛИННЫЙ ГОЛОС'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeSegment.speakerRole}
              </p>
            </div>

            <button
              onClick={() => jumpToSegment(activeSegment)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 transition-colors cursor-pointer w-fit"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Прослушать фрагмент</span>
            </button>
          </div>

          {/* Transcript Quote */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs italic text-slate-200">
            {activeSegment.text}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Джиттер (Jitter):</span>
              <span className={`text-sm font-mono font-bold ${activeSegment.jitter >= 0.3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeSegment.jitter.toFixed(2)}%
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                {activeSegment.jitter >= 0.3 ? 'Норма связок' : 'Нейросетевая плоскость'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Шиммер (Shimmer):</span>
              <span className={`text-sm font-mono font-bold ${activeSegment.shimmer >= 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeSegment.shimmer.toFixed(2)}%
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                {activeSegment.shimmer >= 1.0 ? 'Натуральное дыхание' : 'Фиксированная амплитуда'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Вокодерный сбой (Vocoder):</span>
              <span className={`text-sm font-mono font-bold ${activeSegment.vocoderGlitchIndex < 0.3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(activeSegment.vocoderGlitchIndex * 100).toFixed(0)}%
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                {activeSegment.vocoderGlitchIndex < 0.3 ? 'Чистый аналог' : 'Следы вокодера'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Аномалия границы склейки:</span>
              <span className={`text-sm font-mono font-bold ${activeSegment.spliceAnomalyScore < 0.3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(activeSegment.spliceAnomalyScore * 100).toFixed(0)}%
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                {activeSegment.spliceAnomalyScore < 0.3 ? 'Бесшовно' : 'Фазовый разрыв склейки'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

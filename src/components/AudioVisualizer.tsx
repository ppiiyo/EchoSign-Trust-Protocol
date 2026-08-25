import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface AudioVisualizerProps {
  audioSrc?: string | null;
  audioBlob?: Blob | null;
  title?: string;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioSrc,
  audioBlob,
  title = 'Аудио дорожка',
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const currentSrc = audioBlob ? URL.createObjectURL(audioBlob) : audioSrc;

  useEffect(() => {
    return () => {
      if (audioBlob && currentSrc) {
        URL.revokeObjectURL(currentSrc);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [audioBlob, currentSrc]);

  const initAudioEngine = () => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);

        // Draw frequency bars
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (height * 0.85);

          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#06b6d4'); // cyan
          gradient.addColorStop(0.5, '#3b82f6'); // blue
          gradient.addColorStop(1, '#8b5cf6'); // purple

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
        }
      } else {
        // Idle waveform presentation
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        const sliceWidth = width / 64;
        let x = 0;
        for (let i = 0; i < 64; i++) {
          const v = Math.sin(i * 0.2) * 8 + (height / 2);
          if (i === 0) ctx.moveTo(x, v);
          else ctx.lineTo(x, v);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    };

    render();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    initAudioEngine();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        drawVisualizer();
      }).catch(err => console.warn('Audio play err:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg ${className}`}>
      {currentSrc && (
        <audio
          ref={audioRef}
          src={currentSrc}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
        />
      )}

      {/* Visualizer Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">{title}</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Spectrogram Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] mb-3">
        <canvas
          ref={canvasRef}
          width={400}
          height={64}
          className="w-full h-16 block"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              setCurrentTime(0);
            }
          }}
          className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
          title="Сначала"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Progress seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        {/* Volume */}
        <div className="hidden sm:flex items-center space-x-1.5 text-slate-400">
          <Volume2 className="w-4 h-4" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              if (audioRef.current) audioRef.current.volume = val;
            }}
            className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};

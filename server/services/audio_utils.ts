export function decodeWav(buffer: Buffer): { audio: Float32Array; sampleRate: number; channels: number } {
  // Simple RIFF WAV parser
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    // If not standard WAV header, parse as raw 16-bit PCM or generate compatible array
    const samples = new Float32Array(Math.floor(buffer.length / 2));
    for (let i = 0; i < samples.length; i++) {
      const int16 = buffer.readInt16LE(i * 2);
      samples[i] = int16 / 32768.0;
    }
    return { audio: samples, sampleRate: 44100, channels: 1 };
  }

  let channels = 1;
  let sampleRate = 44100;
  let bitsPerSample = 16;

  try {
    channels = buffer.readUInt16LE(22) || 1;
    sampleRate = buffer.readUInt32LE(24) || 44100;
    bitsPerSample = buffer.readUInt16LE(34) || 16;
  } catch {
    // Default values if format chunk read fails
  }

  const bytesPerSample = Math.max(1, Math.floor(bitsPerSample / 8));

  // Find 'data' chunk
  let offset = 12;
  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    let chunkSize = buffer.readUInt32LE(offset + 4);
    
    // Guard against corrupted chunk sizes exceeding buffer
    if (chunkSize > buffer.length - offset - 8) {
      chunkSize = buffer.length - offset - 8;
    }

    if (chunkId === 'fmt ') {
      try {
        channels = buffer.readUInt16LE(offset + 8 + 2) || channels;
        sampleRate = buffer.readUInt32LE(offset + 8 + 4) || sampleRate;
        bitsPerSample = buffer.readUInt16LE(offset + 8 + 14) || bitsPerSample;
      } catch {}
    } else if (chunkId === 'data') {
      const dataOffset = offset + 8;
      const numSamples = Math.floor(chunkSize / (bytesPerSample * channels));
      const monoAudio = new Float32Array(Math.max(0, numSamples));

      if (bitsPerSample === 16) {
        for (let i = 0; i < numSamples; i++) {
          let sum = 0;
          for (let ch = 0; ch < channels; ch++) {
            const bytePos = dataOffset + (i * channels + ch) * 2;
            if (bytePos + 1 < buffer.length) {
              sum += buffer.readInt16LE(bytePos) / 32768.0;
            }
          }
          monoAudio[i] = sum / channels;
        }
      } else if (bitsPerSample === 24) {
        for (let i = 0; i < numSamples; i++) {
          let sum = 0;
          for (let ch = 0; ch < channels; ch++) {
            const bytePos = dataOffset + (i * channels + ch) * 3;
            if (bytePos + 2 < buffer.length) {
              sum += buffer.readIntLE(bytePos, 3) / 8388608.0;
            }
          }
          monoAudio[i] = sum / channels;
        }
      } else if (bitsPerSample === 32) {
        for (let i = 0; i < numSamples; i++) {
          let sum = 0;
          for (let ch = 0; ch < channels; ch++) {
            const bytePos = dataOffset + (i * channels + ch) * 4;
            if (bytePos + 3 < buffer.length) {
              sum += buffer.readFloatLE(bytePos);
            }
          }
          monoAudio[i] = sum / channels;
        }
      } else {
        // Fallback for 8-bit
        for (let i = 0; i < numSamples; i++) {
          let sum = 0;
          for (let ch = 0; ch < channels; ch++) {
            const bytePos = dataOffset + i * channels + ch;
            if (bytePos < buffer.length) {
              sum += (buffer.readUInt8(bytePos) - 128) / 128.0;
            }
          }
          monoAudio[i] = sum / channels;
        }
      }

      return { audio: monoAudio, sampleRate, channels };
    }
    // Chunks in RIFF must be padded to even byte boundary
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  // Fallback if data chunk offset search failed
  const numSamples = Math.max(1024, Math.floor((buffer.length - 44) / 2));
  const fallback = new Float32Array(numSamples);
  for (let i = 0; i < fallback.length; i++) {
    const pos = 44 + i * 2;
    if (pos + 1 < buffer.length) {
      fallback[i] = buffer.readInt16LE(pos) / 32768.0;
    }
  }
  return { audio: fallback, sampleRate: 44100, channels: 1 };
}

export function encodeWav(audio: Float32Array, sampleRate: number = 44100): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = audio.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit PCM samples
  for (let i = 0; i < audio.length; i++) {
    const s = Math.max(-1, Math.min(1, audio[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(int16), 44 + i * 2);
  }

  return buffer;
}

/**
 * Generates synthetic speech-like acoustic sample for testing
 */
export function generateTestSample(type: 'human' | 'deepfake' | 'music' | 'noisy', durationSec: number = 3.0, sampleRate: number = 44100): Float32Array {
  const length = Math.floor(durationSec * sampleRate);
  const audio = new Float32Array(length);

  if (type === 'human') {
    // Human voice model: Base pitch 130 Hz with natural micro-jitter, formant filtering (F1: 500Hz, F2: 1500Hz, F3: 2500Hz), natural glottal breath noise
    let f0 = 135;
    let phase = 0;
    for (let i = 0; i < length; i++) {
      // Natural jitter (~0.8%)
      const jitter = (Math.random() - 0.5) * 1.5;
      const currentF0 = f0 + Math.sin((i / sampleRate) * 4) * 12 + jitter;
      phase += (2 * Math.PI * currentF0) / sampleRate;

      // Glottal harmonic pulse
      let sample = Math.sin(phase) * 0.5 + Math.sin(2 * phase) * 0.25 + Math.sin(3 * phase) * 0.15 + Math.sin(4 * phase) * 0.08;
      
      // Turbulence / breath
      sample += (Math.random() - 0.5) * 0.04;
      
      // Syllable amplitude envelope (shimmer ~2.5%)
      const envelope = Math.max(0.05, Math.abs(Math.sin((i / sampleRate) * 3 * Math.PI)));
      audio[i] = sample * envelope * 0.7;
    }
  } else if (type === 'deepfake') {
    // Deepfake TTS model: Hyper-rigid F0 (0.01% jitter), flat unnatural shimmer, vocoder high-frequency buzz
    let f0 = 145; // static pitch
    let phase = 0;
    for (let i = 0; i < length; i++) {
      phase += (2 * Math.PI * f0) / sampleRate;
      
      // Rigid harmonic series
      let sample = Math.sin(phase) * 0.6 + Math.sin(2 * phase) * 0.3 + Math.sin(3 * phase) * 0.2;
      
      // Neural vocoder Nyquist phase artifacts (HiFi-GAN periodic comb filtering)
      sample += Math.sin((2 * Math.PI * 11025 * i) / sampleRate) * 0.08;

      // Perfectly flat envelope (no natural breathing pauses)
      audio[i] = sample * 0.75;
    }
  } else if (type === 'music') {
    // Music track with beat, bassline, and melody
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const kick = Math.exp(-((t % 0.5) * 20)) * Math.sin(2 * Math.PI * 60 * t);
      const bass = Math.sin(2 * Math.PI * 110 * t) * 0.3;
      const chord = (Math.sin(2 * Math.PI * 440 * t) + Math.sin(2 * Math.PI * 554 * t) + Math.sin(2 * Math.PI * 659 * t)) * 0.15;
      audio[i] = (kick * 0.5 + bass + chord) * 0.8;
    }
  } else {
    // Noisy sample
    for (let i = 0; i < length; i++) {
      audio[i] = (Math.random() - 0.5) * 0.6;
    }
  }

  return audio;
}

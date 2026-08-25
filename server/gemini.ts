import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Gemini API failed to initialize:', e);
      return null;
    }
  }
  return aiClient;
}

export async function generateAIForensicAnalysis(data: {
  filename: string;
  verdict: string;
  confidence: number;
  isHuman: boolean;
  jitter: number;
  shimmer: number;
  hnr: number;
  watermarkFound: boolean;
  transcript?: string | null;
  reasons: string[];
}): Promise<string> {
  const ai = getGemini();
  if (!ai) {
    return `Комплексный акустический аудит EchoSign Trust Protocol: образец классифицирован как [${data.verdict}] с уверенностью ${(data.confidence * 100).toFixed(0)}%. ${data.reasons.join('. ')}.`;
  }

  try {
    const prompt = `Вы — старший судебный эксперт по биометрии и аутентичности аудио EchoSign Trust Protocol v4.0.
Проанализируйте следующие физические и криптографические метрики аудиозаписи:
- Имя файла: ${data.filename}
- Вердикт системы: ${data.verdict}
- Уверенность: ${(data.confidence * 100).toFixed(1)}%
- Живой голос: ${data.isHuman ? 'Да' : 'Нет (Синтез / TTS)'}
- Джиттер (вариативность высоты тона): ${data.jitter}% (норма человека: 0.2 - 1.8%)
- Шиммер (вариативность амплитуды): ${data.shimmer}% (норма человека: 1.0 - 4.5%)
- Отношение гармоник к шуму (HNR): ${data.hnr} дБ
- Криптографический водяной знак (HMAC): ${data.watermarkFound ? 'ОБНАРУЖЕН И ПОДТВЕРЖДЕН' : 'ОТСУТСТВУЕТ'}
- Текст транскрипции Whisper: "${data.transcript || 'Речь отсутствует'}"
- Обнаруженные аномалии: ${data.reasons.join(', ')}

Дайте краткое, строгое профессиональное заключение (3-4 предложения на русском языке) с физическим обоснованием (голосовые связки, фазовый шум, нейросетевые артефакты диффузии или вокодера) и юридической рекомендацией по доверию к файлу.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 300,
        temperature: 0.3
      }
    });

    return response.text || 'Анализ завершен.';
  } catch (err) {
    console.warn('Gemini forensic generation fallback:', err);
    return `Комплексный акустический аудит EchoSign Trust Protocol: образец классифицирован как [${data.verdict}] с уверенностью ${(data.confidence * 100).toFixed(0)}%. ${data.reasons.join('. ')}.`;
  }
}

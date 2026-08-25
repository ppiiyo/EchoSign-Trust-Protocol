import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Gemini API initialization notice:', e);
      return null;
    }
  }
  return aiClient;
}

const CANDIDATE_MODELS = ['gemini-3.7-flash', 'gemini-3.6-flash'];

function generateDeterministicForensicReport(data: {
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
}): string {
  const percent = (data.confidence * 100).toFixed(0);
  const vocalTract = data.isHuman
    ? `Акустический анализ зафиксировал естественные микрофлуктуации голосового тракта человека: джиттер ${data.jitter.toFixed(2)}%, шиммер ${data.shimmer.toFixed(2)}% при HNR ${data.hnr.toFixed(1)} дБ.`
    : `Акустический спектр демонстрирует характерные аномалии нейросетевых вокодеров (сверхстабильные гармоники и подавленный фазовый шум: джиттер ${data.jitter.toFixed(2)}%, HNR ${data.hnr.toFixed(1)} дБ).`;
  
  const watermarkNote = data.watermarkFound
    ? `Криптографический стеганографический водяной знак (DSSS/QIM) подтвержден с валидной цифровой подписью HMAC.`
    : `Криптографический водяной знак протокола в аудиосигнале отсутствует.`;

  const trustRecommendation = data.isHuman
    ? `Рекомендация: файл рекомендован к верификации с уровнем доверия ${percent}%.`
    : `Рекомендация: аудиоматериал содержит признаки синтетической генерации (TTS/Deepfake); не рекомендуется к безоговорочному юридическому признанию без дополнительного инструментального контроля.`;

  return `Заключение судебной экспертизы EchoSign Protocol: Образец классифицирован как [${data.verdict}] с достоверностью ${percent}%. ${vocalTract} ${watermarkNote} ${trustRecommendation}`;
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
    return generateDeterministicForensicReport(data);
  }

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

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            maxOutputTokens: 300,
            temperature: 0.3
          }
        });

        if (response.text && response.text.trim().length > 0) {
          return response.text.trim();
        }
      } catch (err: any) {
        const status = err?.status || err?.code || (err?.message?.includes('503') ? 503 : (err?.message?.includes('429') ? 429 : 0));
        // If high demand spike or rate limit, wait briefly before retry or next model
        if ((status === 503 || status === 429 || status === 'UNAVAILABLE') && attempt === 1) {
          await new Promise(r => setTimeout(r, 600));
          continue;
        }
        // Try next model if this one is unavailable/deprecated
        break;
      }
    }
  }

  // Fallback to high-precision deterministic forensic report
  return generateDeterministicForensicReport(data);
}


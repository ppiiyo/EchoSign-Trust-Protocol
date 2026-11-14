import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { Verdict, VerificationResponse } from './server/types';
import { blockchainService } from './server/services/blockchain';
import { watermarkService } from './server/services/watermark';
import { livenessDetector } from './server/services/liveness';
import { transcriberService } from './server/services/transcriber';
import { hasher } from './server/services/hashing';
import { decodeWav, encodeWav, generateTestSample } from './server/services/audio_utils';
import { technicalAuditor } from './server/services/audit';
import { generateAIForensicAnalysis } from './server/gemini';
import { jobQueue } from './server/services/job_queue';
import { attestStatus } from './server/services/attest';
import { registerMvpRoutes } from './server/mvp-routes';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const verificationHistory: VerificationResponse[] = [];

async function performVerificationPipeline(
  audioBuffer: Buffer,
  filename: string,
  progressCb?: (p: number) => void
): Promise<VerificationResponse> {
  const { audio, sampleRate, channels } = decodeWav(audioBuffer);
  if (progressCb) progressCb(25);
  const livenessResult = livenessDetector.analyze(audio, sampleRate);
  if (progressCb) progressCb(50);
  const watermarkResult = watermarkService.extract(audio, sampleRate);
  if (progressCb) progressCb(70);
  const transcriptResult = await transcriberService.transcribe(audio, sampleRate, filename);
  if (progressCb) progressCb(85);
  const audioHash = hasher.sha256(audioBuffer);
  const transcriptHash = transcriptResult ? hasher.sha256(transcriptResult.text) : null;

  let verdict: Verdict;
  const reasons = [...livenessResult.reasons];
  if (livenessResult.isHuman && watermarkResult.found && watermarkResult.validHmac) {
    verdict = Verdict.AUTHENTIC;
    reasons.unshift('Heuristic liveness + watermark HMAC present (demo heuristics)');
  } else if (livenessResult.isHuman) {
    verdict = Verdict.LIKELY_AUTHENTIC;
    reasons.unshift('Heuristic acoustic markers consistent with live speech (not calibrated)');
  } else if (watermarkResult.found && watermarkResult.validHmac) {
    verdict = Verdict.SUSPICIOUS;
    reasons.unshift('Watermark present but acoustic heuristics flag anomalies');
  } else {
    verdict = Verdict.FAKE;
    reasons.unshift('Heuristic synthesis indicators (demo DSP — not a certified detector)');
  }

  const verificationId = `VER-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const { txId, block, merkleProof, l2Anchor } = blockchainService.addTransaction({
    verificationId, audioHash, verdict, timestamp: Date.now(),
    payload: { filename, confidence: livenessResult.confidence, isHuman: livenessResult.isHuman, watermarkFound: watermarkResult.found },
  });

  const messages: Record<Verdict, string> = {
    [Verdict.AUTHENTIC]: 'Demo heuristic: live-speech markers + watermark. Not a legal determination.',
    [Verdict.LIKELY_AUTHENTIC]: 'Demo heuristic: acoustic markers look consistent with live speech.',
    [Verdict.SUSPICIOUS]: 'Demo heuristic: inconsistencies detected. Review manually.',
    [Verdict.FAKE]: 'Demo heuristic: synthesis-like indicators. Not a certified deepfake detector.',
  };

  const aiSummary = await generateAIForensicAnalysis({
    filename, verdict, confidence: livenessResult.confidence, isHuman: livenessResult.isHuman,
    jitter: livenessResult.jitterPercent, shimmer: livenessResult.shimmerPercent, hnr: livenessResult.hnrDb,
    watermarkFound: watermarkResult.found, transcript: transcriptResult.text, reasons,
  });

  const responseData: VerificationResponse = {
    verificationId, verdict, confidence: livenessResult.confidence, isHuman: livenessResult.isHuman,
    watermarkFound: watermarkResult.found, watermarkPayload: watermarkResult.payload, reasons,
    audioHash, transcriptHash,
    fileInfo: {
      filename, sampleRate, channels,
      durationSeconds: Math.round((audio.length / sampleRate) * 100) / 100,
      sizeMb: Math.round((audioBuffer.length / (1024 * 1024)) * 100) / 100,
      transcript: transcriptResult.text, blockchainTx: txId,
    },
    liveness: livenessResult, watermark: watermarkResult, transcript: transcriptResult,
    blockchain: {
      txId, blockIndex: block.index, blockHash: block.hash, merkleRoot: block.merkleRoot,
      timestamp: block.timestamp, isChainValid: blockchainService.verifyChain().isValid,
      merkleProof: merkleProof || undefined, l2Anchor,
    },
    createdAt: new Date().toISOString(),
    message: `${messages[verdict]} ${aiSummary}`,
  };
  verificationHistory.unshift(responseData);
  if (verificationHistory.length > 50) verificationHistory.pop();
  if (progressCb) progressCb(100);
  return responseData;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.get('/health', (_req, res) => {
    const attest = attestStatus();
    res.json({
      status: 'ok',
      product: 'echosign-demo',
      version: '0.3.0',
      mode: attest.demoMode ? 'demo' : 'persistent-keys',
      timestamp: new Date().toISOString(),
      attest: { ready: attest.ready, algorithm: attest.algorithm, keyFingerprint: attest.keyFingerprint },
      simulatedLedgerBlocks: blockchainService.chain.length,
    });
  });

  // Full Attest MVP: keys, devices, packages, sign/verify/jwks
  registerMvpRoutes(app);

  app.post('/api/v1/verify', upload.single('file'), async (req, res) => {
    try {
      let audioBuffer: Buffer;
      let filename = 'audio_sample.wav';
      if (req.file) { audioBuffer = req.file.buffer; filename = req.file.originalname || filename; }
      else if (req.body.audioBase64) {
        audioBuffer = Buffer.from(req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
        filename = req.body.filename || filename;
      } else if (req.body.presetType) {
        const sampleType = req.body.presetType as 'human' | 'deepfake' | 'music' | 'noisy';
        audioBuffer = encodeWav(generateTestSample(sampleType, 3.0, 44100), 44100);
        filename = `${sampleType}_preset.wav`;
      } else return res.status(400).json({ error: 'No audio file or preset provided' });
      res.json(await performVerificationPipeline(audioBuffer, filename));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Verification failed' });
    }
  });

  app.post('/api/v1/jobs/submit', upload.single('file'), async (req, res) => {
    try {
      let audioBuffer: Buffer;
      let filename = 'async_sample.wav';
      if (req.file) { audioBuffer = req.file.buffer; filename = req.file.originalname || filename; }
      else if (req.body.audioBase64) {
        audioBuffer = Buffer.from(req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
      } else if (req.body.presetType) {
        audioBuffer = encodeWav(generateTestSample(req.body.presetType, 3.0, 44100), 44100);
      } else return res.status(400).json({ error: 'No audio' });
      res.status(202).json(jobQueue.submitJob(filename, (cb) => performVerificationPipeline(audioBuffer, filename, cb)));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/jobs/:jobId', (req, res) => {
    const job = jobQueue.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  });
  app.get('/api/v1/jobs', (_req, res) => res.json({ stats: jobQueue.getQueueStats(), jobs: jobQueue.listJobs(15) }));

  app.get('/api/v1/blockchain/stats', (_req, res) => res.json(blockchainService.getStats()));
  app.get('/api/v1/blockchain/blocks', (_req, res) =>
    res.json({ chain: blockchainService.chain, pending: blockchainService.pendingTransactions, stats: blockchainService.getStats() }));
  app.get('/api/v1/blockchain/verify', (_req, res) => res.json(blockchainService.verifyChain()));
  app.get('/api/v1/kms/status', (_req, res) => res.json({ status: 'active', keyRing: hasher.getKeyRingStatus() }));
  app.post('/api/v1/audit/run', async (_req, res) => {
    try { res.json(await technicalAuditor.runFullSuite()); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });
  app.get('/api/v1/test-samples/:type', (req, res) => {
    const wav = encodeWav(generateTestSample(req.params.type as any, 3.0, 44100), 44100);
    res.setHeader('Content-Type', 'audio/wav');
    res.send(wav);
  });
  app.get('/api/v1/verifications', (_req, res) => res.json({ total: verificationHistory.length, history: verificationHistory }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoSign MVP v0.3 on http://0.0.0.0:${PORT}`);
    console.log('  POST /api/v1/keys | /api/v1/attest/sign | GET /verify/');
  });
}

startServer().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});

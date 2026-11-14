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
import {
  attestSignAudio,
  attestVerify,
  attestJwks,
  attestStatus,
} from './server/services/attest';

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
    verificationId,
    audioHash,
    verdict,
    timestamp: Date.now(),
    payload: {
      filename,
      confidence: livenessResult.confidence,
      isHuman: livenessResult.isHuman,
      watermarkFound: watermarkResult.found,
      watermarkOwner: watermarkResult.payload?.owner || null
    }
  });

  const messages: Record<Verdict, string> = {
    [Verdict.AUTHENTIC]: 'Demo heuristic: live-speech markers + watermark. Not a legal determination.',
    [Verdict.LIKELY_AUTHENTIC]: 'Demo heuristic: acoustic markers look consistent with live speech.',
    [Verdict.SUSPICIOUS]: 'Demo heuristic: inconsistencies detected. Review manually.',
    [Verdict.FAKE]: 'Demo heuristic: synthesis-like indicators. Not a certified deepfake detector.'
  };

  const aiSummary = await generateAIForensicAnalysis({
    filename,
    verdict,
    confidence: livenessResult.confidence,
    isHuman: livenessResult.isHuman,
    jitter: livenessResult.jitterPercent,
    shimmer: livenessResult.shimmerPercent,
    hnr: livenessResult.hnrDb,
    watermarkFound: watermarkResult.found,
    transcript: transcriptResult.text,
    reasons
  });

  const responseData: VerificationResponse = {
    verificationId,
    verdict,
    confidence: livenessResult.confidence,
    isHuman: livenessResult.isHuman,
    watermarkFound: watermarkResult.found,
    watermarkPayload: watermarkResult.payload,
    reasons,
    audioHash,
    transcriptHash,
    fileInfo: {
      filename,
      sampleRate,
      channels,
      durationSeconds: Math.round((audio.length / sampleRate) * 100) / 100,
      sizeMb: Math.round((audioBuffer.length / (1024 * 1024)) * 100) / 100,
      transcript: transcriptResult.text,
      blockchainTx: txId
    },
    liveness: livenessResult,
    watermark: watermarkResult,
    transcript: transcriptResult,
    blockchain: {
      txId,
      blockIndex: block.index,
      blockHash: block.hash,
      merkleRoot: block.merkleRoot,
      timestamp: block.timestamp,
      isChainValid: blockchainService.verifyChain().isValid,
      merkleProof: merkleProof || undefined,
      l2Anchor
    },
    createdAt: new Date().toISOString(),
    message: `${messages[verdict]} ${aiSummary}`
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

  app.get('/health', (req, res) => {
    const attest = attestStatus();
    res.json({
      status: 'ok',
      product: 'echosign-demo',
      version: '0.2.0',
      mode: attest.demoMode ? 'demo' : 'persistent-keys',
      timestamp: new Date().toISOString(),
      attest: {
        ready: attest.ready,
        algorithm: attest.algorithm,
        keyFingerprint: attest.keyFingerprint,
      },
      simulatedLedgerBlocks: blockchainService.chain.length,
    });
  });

  app.post('/api/v1/attest/sign', upload.single('file'), async (req, res) => {
    try {
      if (!req.file?.buffer) {
        return res.status(400).json({ error: 'multipart field "file" (audio) is required' });
      }
      const result = attestSignAudio({
        audioBuffer: req.file.buffer,
        sampleRate: req.body.sampleRate ? Number(req.body.sampleRate) : undefined,
        channels: req.body.channels ? Number(req.body.channels) : undefined,
        deviceId: req.body.deviceId,
        orgId: req.body.orgId,
        captureStartedAt: req.body.captureStartedAt,
        captureEndedAt: req.body.captureEndedAt,
      });
      res.json({
        ...result,
        disclaimer:
          'Signature proves integrity of the audio bytes at signing time. It does not prove a human was speaking.',
      });
    } catch (err) {
      console.error('[attest/sign]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'sign failed' });
    }
  });

  app.post('/api/v1/attest/verify', (req, res) => {
    try {
      const { manifest, signatureB64u, publicKeyPem } = req.body || {};
      if (!manifest || !signatureB64u) {
        return res.status(400).json({ error: 'manifest and signatureB64u are required' });
      }
      const result = attestVerify({ manifest, signatureB64u, publicKeyPem });
      res.status(result.valid ? 200 : 400).json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'verify failed' });
    }
  });

  app.get('/api/v1/attest/jwks', (_req, res) => {
    res.json(attestJwks());
  });

  app.get('/api/v1/attest/status', (_req, res) => {
    res.json(attestStatus());
  });

  app.post('/api/v1/verify', upload.single('file'), async (req, res) => {
    try {
      let audioBuffer: Buffer;
      let filename = 'audio_sample.wav';

      if (req.file) {
        audioBuffer = req.file.buffer;
        filename = req.file.originalname || filename;
      } else if (req.body.audioBase64) {
        const base64Data = req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        audioBuffer = Buffer.from(base64Data, 'base64');
        filename = req.body.filename || filename;
      } else if (req.body.presetType) {
        const sampleType = req.body.presetType as 'human' | 'deepfake' | 'music' | 'noisy';
        const rawSamples = generateTestSample(sampleType, 3.0, 44100);
        audioBuffer = encodeWav(rawSamples, 44100);
        filename = `${sampleType}_preset.wav`;
      } else {
        return res.status(400).json({ error: 'No audio file or preset provided' });
      }

      const responseData = await performVerificationPipeline(audioBuffer, filename);
      res.json(responseData);
    } catch (err: any) {
      console.error('Verification error:', err);
      res.status(500).json({ error: err.message || 'Verification failed' });
    }
  });

  app.post('/api/v1/jobs/submit', upload.single('file'), async (req, res) => {
    try {
      let audioBuffer: Buffer;
      let filename = 'async_sample.wav';
      if (req.file) {
        audioBuffer = req.file.buffer;
        filename = req.file.originalname || filename;
      } else if (req.body.audioBase64) {
        const base64Data = req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        audioBuffer = Buffer.from(base64Data, 'base64');
        filename = req.body.filename || filename;
      } else if (req.body.presetType) {
        const sampleType = req.body.presetType as 'human' | 'deepfake' | 'music' | 'noisy';
        audioBuffer = encodeWav(generateTestSample(sampleType, 3.0, 44100), 44100);
        filename = `${sampleType}_preset.wav`;
      } else {
        return res.status(400).json({ error: 'No audio file or preset provided' });
      }
      const job = jobQueue.submitJob(filename, async (progressCb) =>
        performVerificationPipeline(audioBuffer, filename, progressCb)
      );
      res.status(202).json(job);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/jobs/:jobId', (req, res) => {
    const job = jobQueue.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  });

  app.get('/api/v1/jobs', (_req, res) => {
    res.json({ stats: jobQueue.getQueueStats(), jobs: jobQueue.listJobs(15) });
  });

  app.post('/api/v1/register', upload.single('file'), async (req, res) => {
    try {
      let audioBuffer: Buffer;
      let filename = 'registered_audio.wav';
      if (req.file) {
        audioBuffer = req.file.buffer;
        filename = req.file.originalname || filename;
      } else if (req.body.audioBase64) {
        audioBuffer = Buffer.from(req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
        filename = req.body.filename || filename;
      } else {
        audioBuffer = encodeWav(generateTestSample('human', 3.0, 44100), 44100);
      }
      const { audio, sampleRate } = decodeWav(audioBuffer);
      const payload = {
        owner: req.body.owner || 'Demo Owner',
        deviceId: req.body.deviceId || 'DEVICE-DEMO',
        licenseId: req.body.licenseId || `LIC-${Date.now()}`,
        timestamp: Date.now(),
      };
      const { watermarkedAudio, snrDb, bitsLength } = watermarkService.embed(audio, sampleRate, payload);
      const watermarkedBuffer = encodeWav(watermarkedAudio, sampleRate);
      const audioHash = hasher.sha256(watermarkedBuffer);
      const verificationId = `REG-${Date.now()}`;
      const { txId, block, merkleProof, l2Anchor } = blockchainService.addTransaction({
        verificationId,
        audioHash,
        verdict: Verdict.AUTHENTIC,
        timestamp: Date.now(),
        payload: { action: 'WATERMARK_REGISTERED', owner: payload.owner },
      });
      res.json({
        success: true,
        verificationId,
        audioHash,
        snrDb: Math.round(snrDb * 10) / 10,
        bitsEmbedded: bitsLength,
        watermarkedAudioBase64: `data:audio/wav;base64,${watermarkedBuffer.toString('base64')}`,
        payload,
        blockchain: { txId, blockIndex: block.index, blockHash: block.hash, merkleRoot: block.merkleRoot, merkleProof, l2Anchor },
        message: 'Demo watermark embed (experimental, not codec-robust).',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/v1/watermark/extract', upload.single('file'), async (req, res) => {
    try {
      let audioBuffer: Buffer;
      if (req.file) audioBuffer = req.file.buffer;
      else if (req.body.audioBase64)
        audioBuffer = Buffer.from(req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
      else return res.status(400).json({ error: 'No audio provided' });
      const { audio, sampleRate } = decodeWav(audioBuffer);
      res.json(watermarkService.extract(audio, sampleRate));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/blockchain/stats', (_req, res) => res.json(blockchainService.getStats()));
  app.get('/api/v1/blockchain/blocks', (_req, res) =>
    res.json({ chain: blockchainService.chain, pending: blockchainService.pendingTransactions, stats: blockchainService.getStats() })
  );
  app.get('/api/v1/blockchain/merkle-proof/:txId', (req, res) => {
    const proof = blockchainService.getMerkleProof(req.params.txId);
    if (!proof) return res.status(404).json({ error: 'Transaction not found' });
    res.json(proof);
  });
  app.get('/api/v1/blockchain/verify', (_req, res) => {
    const result = blockchainService.verifyChain();
    res.json(result);
  });
  app.post('/api/v1/blockchain/tamper', (req, res) => {
    res.json(blockchainService.tamperBlock(Number(req.body.blockIndex) || blockchainService.chain.length - 1, Verdict.AUTHENTIC));
  });
  app.post('/api/v1/blockchain/repair', (_req, res) => res.json(blockchainService.repairChain()));

  app.get('/api/v1/kms/status', (_req, res) => res.json({ status: 'active', keyRing: hasher.getKeyRingStatus() }));
  app.post('/api/v1/kms/rotate', (req, res) => {
    if (process.env.DEMO_MODE !== '1' && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'kms/rotate disabled in production without DEMO_MODE' });
    }
    res.json({ ...hasher.rotateKeys(req.body.reason || 'manual'), keyRing: hasher.getKeyRingStatus() });
  });

  app.post('/api/v1/audit/run', async (_req, res) => {
    try {
      res.json(await technicalAuditor.runFullSuite());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/test-samples/:type', (req, res) => {
    const type = req.params.type as 'human' | 'deepfake' | 'music' | 'noisy';
    const wavBuffer = encodeWav(generateTestSample(type, 3.0, 44100), 44100);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_sample.wav"`);
    res.send(wavBuffer);
  });

  app.get('/api/v1/verifications', (_req, res) => {
    res.json({ total: verificationHistory.length, history: verificationHistory });
  });

  // Dev / prod static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoSign demo listening on http://0.0.0.0:${PORT}`);
    console.log(`  Attest offline verifier: /verify/`);
    console.log(`  Attest API: POST /api/v1/attest/sign | GET /api/v1/attest/jwks`);
    console.log(`  Health: GET /health`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

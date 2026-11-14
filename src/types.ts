export enum Verdict {
  AUTHENTIC = 'AUTHENTIC',
  LIKELY_AUTHENTIC = 'LIKELY_AUTHENTIC',
  SUSPICIOUS = 'SUSPICIOUS',
  FAKE = 'FAKE'
}

export interface WatermarkPayload {
  owner: string;
  deviceId: string;
  licenseId?: string;
  timestamp: number;
  nonce?: string;
  customData?: Record<string, any>;
}

export interface WatermarkResult {
  found: boolean;
  validHmac: boolean;
  payload: WatermarkPayload | null;
  confidence: number;
  snrDb: number;
  bitErrorRate: number;
  rawBitsLength: number;
  carrierBand: string;
  psychoacousticMaskingApplied?: boolean;
}

export interface LivenessResult {
  isHuman: boolean;
  confidence: number;
  jitterPercent: number;
  shimmerPercent: number;
  hnrDb: number;
  spectralFlatness: number;
  vocoderArtifactScore: number;
  phaseContinuityScore: number;
  isStudioProcessed?: boolean;
  formantFluidityScore?: number;
  reasons: string[];
  features: {
    fundamentalFreqHz: number;
    spectralFlux: number;
    zeroCrossingRate: number;
    highFreqRolloffHz: number;
    pitchQuantizationCents?: number;
  };
}

export interface TranscriptResult {
  text: string;
  language: string;
  languageProbability: number;
  duration: number;
  segments: Array<{ start: number; end: number; text: string; confidence: number }>;
}

export interface BlockchainTransaction {
  txId: string;
  verificationId: string;
  audioHash: string;
  verdict: Verdict;
  timestamp: number;
  payload?: any;
}

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface MerkleInclusionProof {
  txId: string;
  leafHash: string;
  merkleRoot: string;
  proof: MerkleProofStep[];
}

export interface L2StateAnchor {
  root: string;
  blockHeight?: number;
  chainId?: string;
  txHash?: string;
  anchoredAt?: number;
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: BlockchainTransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
}

export interface ChainStats {
  totalBlocks: number;
  totalTransactions: number;
  difficulty: number;
  lastHash?: string;
  lastMerkleRoot?: string;
  activeL2Anchor?: L2StateAnchor;
  isValid?: boolean;
}

export interface KMSKeyInfo {
  keyId: string;
  epoch: number;
  purpose: 'WATERMARK_HMAC' | 'DATA_ENCRYPTION_GCM' | 'BLOCKCHAIN_SEALING' | 'JWT_AUTH';
  algorithm: string;
  createdAt: number;
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED';
}

export interface AsyncJobStatus {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: VerificationResponse;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationResponse {
  verificationId: string;
  verdict: Verdict;
  confidence: number;
  isHuman: boolean;
  watermarkFound: boolean;
  watermarkPayload?: WatermarkPayload | null;
  reasons: string[];
  audioHash: string;
  transcriptHash?: string | null;
  fileInfo: {
    filename: string;
    sampleRate: number;
    channels: number;
    durationSeconds: number;
    sizeMb: number;
    transcript?: string;
    blockchainTx?: string;
  };
  liveness: LivenessResult;
  watermark: WatermarkResult;
  transcript: TranscriptResult;
  blockchain: {
    txId: string;
    blockIndex: number;
    blockHash: string;
    merkleRoot: string;
    timestamp: number;
    isChainValid: boolean;
    merkleProof?: MerkleInclusionProof;
    l2Anchor?: L2StateAnchor;
  };
  createdAt: string;
  message: string;
}

export interface AuditFinding {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  detail: string;
}

export interface AuditSuiteResult {
  suiteId: string;
  passed: number;
  failed: number;
  findings: AuditFinding[];
}

export type AppTab =
  | 'verify'
  | 'attest'
  | 'diarization'
  | 'watermark'
  | 'developers'
  | 'webhooks'
  | 'extension'
  | 'soc'
  | 'telephony'
  | 'deployment'
  | 'compliance'
  | 'blockchain';

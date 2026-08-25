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
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
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
  isVerified: boolean;
}

export interface L2StateAnchor {
  network: string;
  blockNumber: number;
  stateRoot: string;
  merkleRoot: string;
  timestamp: number;
  sequencerSignature: string;
  rollupTxHash: string;
  verifiedOnChain: boolean;
}

export interface Block {
  index: number;
  timestamp: number;
  merkleRoot: string;
  data: {
    type?: string;
    transactions?: BlockchainTransaction[];
    transactionsCount?: number;
    l2Anchor?: L2StateAnchor;
    [key: string]: any;
  };
  previousHash: string;
  nonce: number;
  hash: string;
}

export interface ChainStats {
  totalBlocks: number;
  isValid: boolean;
  difficulty: number;
  totalTransactions: number;
  lastBlockHash: string;
  lastBlockTime: number;
  lastMerkleRoot: string;
  activeL2Anchor: L2StateAnchor | null;
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
  filename: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  createdAt: number;
  completedAt?: number;
  executionTimeMs?: number;
  result?: VerificationResponse;
  error?: string;
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
    transcript?: string | null;
    blockchainTx: string;
  };
  liveness: LivenessResult;
  watermark: WatermarkResult;
  transcript?: TranscriptResult | null;
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
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status: 'RESOLVED' | 'REMEDIATED' | 'OPEN';
  component: string;
  description: string;
  remediationSummary: string;
  verificationProof: string;
}

export interface AuditSuiteResult {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  executionTimeMs: number;
  categories: {
    watermarkRobustness: {
      score: number;
      tests: Array<{ name: string; status: 'PASSED' | 'FAILED' | 'WARNING'; metric: string; detail: string }>;
    };
    livenessDeepfakeDetection: {
      score: number;
      tests: Array<{ name: string; status: 'PASSED' | 'FAILED' | 'WARNING'; metric: string; detail: string }>;
    };
    cryptographicIntegrity: {
      score: number;
      tests: Array<{ name: string; status: 'PASSED' | 'FAILED' | 'WARNING'; metric: string; detail: string }>;
    };
    blockchainSecurity: {
      score: number;
      tests: Array<{ name: string; status: 'PASSED' | 'FAILED' | 'WARNING'; metric: string; detail: string }>;
    };
  };
  findings: AuditFinding[];
}

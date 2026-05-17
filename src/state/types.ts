export type AppPhase = 'VOID' | 'INVOCATION' | 'JOURNEY';

export interface ActivationSummary {
  layerIndex: number;
  tokenIndex: number;
  embeddingNorm: number;
  attentionMax: number[];      // per head
  attentionEntropy: number[];  // per head
  ffnEnergy: number;
  ffnTopK: number[];
  layerNormVariance: number;
  topLogits: { tokenId: number; prob: number }[];
}

export interface AppStateSnapshot {
  phase: AppPhase;
  prompt: string;
  isLoadingModel: boolean;
  modelReady: boolean;
  error: string | null;
  journeyProgress: number; // 0–1
}

export type StateListener = (snapshot: AppStateSnapshot) => void;

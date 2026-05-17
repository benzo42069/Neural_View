import type { ActivationSummary } from '../state/types';

export function extractSummary(
  layerIndex: number,
  tokenIndex: number,
  activations: Map<string, Float32Array>
): ActivationSummary {
  const embeddingNorm = magnitude(activations.get('embed') ?? new Float32Array(1));
  const attnWeights = activations.get('attn') ?? new Float32Array(1);
  const ffnOut = activations.get('ffn') ?? new Float32Array(1);
  const logits = activations.get('logits') ?? new Float32Array(1);

  const numHeads = 4;
  const headSize = attnWeights.length / numHeads;
  const attentionMax: number[] = [];
  const attentionEntropy: number[] = [];

  for (let h = 0; h < numHeads; h++) {
    const start = h * headSize;
    const end = start + headSize;
    const slice = attnWeights.slice(start, end);
    attentionMax.push(Math.max(...slice));
    attentionEntropy.push(computeEntropy(slice));
  }

  const ffnEnergy = meanPositive(ffnOut);
  const ffnTopK = topK(ffnOut, 5);
  const layerNormVariance = variance(activations.get('ln') ?? new Float32Array([1]));
  const topLogits = topKWithIndices(logits, 10);

  return {
    layerIndex,
    tokenIndex,
    embeddingNorm,
    attentionMax,
    attentionEntropy,
    ffnEnergy,
    ffnTopK,
    layerNormVariance,
    topLogits: topLogits.map(([idx, val]) => ({ tokenId: idx, prob: val })),
  };
}

function magnitude(arr: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
  return Math.sqrt(sum);
}

function computeEntropy(arr: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 0) sum -= arr[i] * Math.log(arr[i]);
  }
  return sum;
}

function meanPositive(arr: Float32Array): number {
  let sum = 0, count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 0) { sum += arr[i]; count++; }
  }
  return count > 0 ? sum / count : 0;
}

function topK(arr: Float32Array, k: number): number[] {
  const indexed = Array.from(arr).map((v, i) => [v, i] as [number, number]);
  indexed.sort((a, b) => b[0] - a[0]);
  return indexed.slice(0, k).map(([, i]) => i);
}

function topKWithIndices(arr: Float32Array, k: number): [number, number][] {
  const indexed = Array.from(arr).map((v, i) => [i, v] as [number, number]);
  indexed.sort((a, b) => b[1] - a[1]);
  return indexed.slice(0, k);
}

function variance(arr: Float32Array): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
}

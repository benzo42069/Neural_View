import * as ort from 'onnxruntime-web';
import { extractSummary } from './probes';
import type { ActivationSummary } from '../state/types';

type WorkerMessage =
  | { type: 'load'; buffer: ArrayBuffer }
  | { type: 'infer'; promptTokens: number[] };

let session: ort.InferenceSession | null = null;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data;

  if (type === 'load') {
    const { buffer } = e.data;
    try {
      session = await ort.InferenceSession.create(buffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      self.postMessage({ type: 'loaded' });
    } catch (err) {
      self.postMessage({ type: 'error', message: (err as Error).message });
    }
  }

  if (type === 'infer') {
    const { promptTokens } = e.data;
    if (!session) {
      self.postMessage({ type: 'error', message: 'Model not loaded' });
      return;
    }

    try {
      const generated: number[] = [];
      let inputIds = promptTokens;
      const maxTokens = 20;

      for (let step = 0; step < maxTokens; step++) {
        const tensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, inputIds.length]);
        const feeds: Record<string, ort.Tensor> = { input_ids: tensor };
        const results = await session.run(feeds);
        const logits = results.logits;
        const data = logits.data as Float32Array;
        const vocabSize = data.length / inputIds.length;
        const lastLogits = data.slice((inputIds.length - 1) * vocabSize, inputIds.length * vocabSize);

        let maxIdx = 0;
        for (let i = 1; i < lastLogits.length; i++) {
          if (lastLogits[i] > lastLogits[maxIdx]) maxIdx = i;
        }

        const activations = new Map<string, Float32Array>();
        for (const [name, tensor] of Object.entries(results)) {
          activations.set(name, tensor.data as Float32Array);
        }

        const summary = extractSummary(0, step, activations);
        self.postMessage({ type: 'summary', summary });

        generated.push(maxIdx);
        inputIds = [...inputIds, maxIdx];

        if (maxIdx === 50256) break;
      }

      self.postMessage({ type: 'complete', tokens: generated });
    } catch (err) {
      self.postMessage({ type: 'error', message: (err as Error).message });
    }
  }
};

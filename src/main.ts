import './style.css';
import { AppState } from './state/AppState';
import { PromptInput } from './ui/PromptInput';
import { IgniteButton } from './ui/IgniteButton';
import { LiveRegion } from './ui/LiveRegion';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { ErrorOverlay } from './ui/ErrorOverlay';

import { GalaxyScene } from './visualization/GalaxyScene';
import { ModelLoader } from './inference/ModelLoader';
import { SimpleTokenizer } from './inference/Tokenizer';
import type { ActivationSummary } from './state/types';

type WorkerResponse =
  | { type: 'loaded' }
  | { type: 'summary'; summary: ActivationSummary }
  | { type: 'complete'; tokens: number[] }
  | { type: 'error'; message: string };

let activeWorker: Worker | null = null;

async function init() {
  const canvas = document.getElementById('galaxy-canvas') as HTMLCanvasElement;
  const uiLayer = document.getElementById('ui-layer')!;

  const state = new AppState();
  const scene = new GalaxyScene(canvas);
  scene.start();

  const promptInput = new PromptInput(state, uiLayer);
  const igniteButton = new IgniteButton(state, uiLayer);
  const liveRegion = new LiveRegion(state, uiLayer);
  const loading = new LoadingIndicator(state, uiLayer);
  const errorOverlay = new ErrorOverlay(state, uiLayer, () => location.reload());

  const modelLoader = new ModelLoader();
  state.setModelLoading(true);

  try {
    const buffer = await modelLoader.load((p) => {
      loading.setProgress(p);
    });
    state.setModelReady(true);

    const tokenizer = new SimpleTokenizer({});

    state.subscribe((snap) => {
      if (snap.phase === 'JOURNEY') {
        startJourney(snap.prompt, tokenizer, buffer);
      }
      if (snap.phase === 'VOID' && activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
      }
    });
  } catch (e) {
    state.setError('The stars are not aligning. The model could not be summoned.');
  }

  async function startJourney(prompt: string, tokenizer: SimpleTokenizer, modelBuffer: ArrayBuffer) {
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
    }

    const tokens = tokenizer.encode(prompt);
    const worker = new Worker(new URL('./inference/InferenceWorker.ts', import.meta.url), { type: 'module' });
    activeWorker = worker;

    worker.postMessage({ type: 'load', buffer: modelBuffer }, [modelBuffer]);

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type } = e.data;
      if (type === 'loaded') {
        console.log('Model loaded in worker');
      }
      if (type === 'summary') {
        console.log('Activation summary:', e.data.summary);
      }
      if (type === 'complete') {
        console.log('Generated tokens:', e.data.tokens);
        setTimeout(() => state.complete(), 3000);
        worker.terminate();
        activeWorker = null;
      }
      if (type === 'error') {
        state.setError(e.data.message);
        worker.terminate();
        activeWorker = null;
      }
    };

    worker.postMessage({ type: 'infer', promptTokens: tokens });
  }
}

init();

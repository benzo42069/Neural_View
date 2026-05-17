import './style.css';
import { AppState } from './state/AppState';
import { PromptInput } from './ui/PromptInput';
import { IgniteButton } from './ui/IgniteButton';
import { LiveRegion } from './ui/LiveRegion';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { ErrorOverlay } from './ui/ErrorOverlay';
import { ReducedMotion } from './ui/ReducedMotion';
import { GalaxyScene } from './visualization/GalaxyScene';
import { ModelLoader } from './inference/ModelLoader';
import { SimpleTokenizer } from './inference/Tokenizer';

async function init() {
  const canvas = document.getElementById('galaxy-canvas') as HTMLCanvasElement;
  const uiLayer = document.getElementById('ui-layer')!;

  const state = new AppState();
  const reducedMotion = new ReducedMotion();
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
    });
  } catch (e) {
    state.setError('The stars are not aligning. The model could not be summoned.');
  }

  async function startJourney(prompt: string, tokenizer: SimpleTokenizer, modelBuffer: ArrayBuffer) {
    const tokens = tokenizer.encode(prompt);
    const worker = new Worker(new URL('./inference/InferenceWorker.ts', import.meta.url), { type: 'module' });

    worker.postMessage({ type: 'load', buffer: modelBuffer }, [modelBuffer]);

    worker.onmessage = (e) => {
      const { type, summary, tokens: generated, message } = e.data;
      if (type === 'summary') {
        console.log('Activation summary:', summary);
      }
      if (type === 'complete') {
        console.log('Generated tokens:', generated);
        setTimeout(() => state.complete(), 3000);
        worker.terminate();
      }
      if (type === 'error') {
        state.setError(message);
        worker.terminate();
      }
    };

    worker.postMessage({ type: 'infer', promptTokens: tokens });
  }
}

init();

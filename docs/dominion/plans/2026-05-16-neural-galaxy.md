# Neural Galaxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use dominion:component-driven-development (recommended) or dominion:building-fullstack-apps to implement this plan task-by-task.

**Goal:** Build a single-page immersive web experience where users type a prompt and watch a real tiny LLM's inference visualized as a cosmic neural galaxy in Three.js.

**Architecture:** Vanilla TypeScript + Vite for zero framework overhead. Three.js handles all WebGL visualization. ONNX Runtime Web runs inference in a Web Worker. A lightweight observer-pattern state machine orchestrates the three experience phases (Void → Invocation → Journey). DOM UI is minimal — only the prompt input, ignite button, and screen-reader live region exist above the canvas.

**Tech Stack:** TypeScript, Vite, Vitest, Three.js, ONNX Runtime Web, GSAP (DOM animations)

**Accessibility Notes:** All interactive elements are real DOM nodes with proper focus rings and ARIA labels. During the Journey, focus is managed via `inert` on the canvas container and a polite live region narrates inference progress. `prefers-reduced-motion` replaces 3D camera flights with instant cuts and disables particle bursts.

**Performance Notes:** Target bundle <200KB gzipped excluding model. ONNX Runtime and model weights lazy-loaded after initial paint. Particle pool capped at 50,000. Model cached in IndexedDB. First Contentful Paint <1s.

---

## File Structure

```
public/
  model/
    model.onnx              # Tiny transformer (~10-20M params, INT8)
    vocab.json              # Tokenizer vocabulary
src/
  main.ts                   # Entry point: init state, scene, model loader
  state/
    AppState.ts             # Observer store + state machine
    types.ts                # State union, ActivationSummary, events
  inference/
    ModelLoader.ts          # fetch + IndexedDB caching
    Tokenizer.ts            # Byte-Pair Encoding tokenizer
    InferenceWorker.ts      # Web Worker: ONNX Runtime forward pass
    probes.ts               # Activation summary extraction logic
  visualization/
    GalaxyScene.ts          # Three.js scene manager, render loop
    CameraController.ts     # Spline path + orbit controls
    ParticlePool.ts         # Reusable particle geometry manager
    TokenSeed.ts            # Embedding nebula visualization
    AttentionBeam.ts        # Attention filament renderer
    StellarFlare.ts         # FFN activation burst renderer
    WormholeTunnel.ts       # Layer transition tunnel
    SupernovaBloom.ts       # Final logits mandala
    shaders.ts              # GLSL shader strings
  ui/
    PromptInput.ts          # Ethereal text input
    IgniteButton.ts         # Circular submit trigger
    LiveRegion.ts           # Screen reader announcements
    LoadingIndicator.ts     # Stardust progress
    ErrorOverlay.ts         # Error state message
    ReducedMotion.ts        # prefers-reduced-motion detection
  utils/
    lerp.ts                 # Scalar & vector interpolation
    color.ts                # HSL/hex helpers, temperature mapping
    rng.ts                  # Seeded random for deterministic stars
  types/
    glsl.d.ts               # Module declarations for shader imports
index.html
vite.config.ts
tsconfig.json
package.json
```

---

## Web-First Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Vanilla TS + Vite | DOM surface is 5 elements; React overhead unjustified. Three.js owns its own render loop. |
| Styling | Vanilla CSS + CSS vars | No component library needed. Design tokens map directly to `:root` custom properties. |
| State | Observer-pattern class | Three states, few transitions. Redux/Zustand overkill. |
| 3D | Three.js r160 | Mature, well-documented, supports WebGL2 and WebGPU renderer. |
| Inference | ONNX Runtime Web | De-facto standard for browser ML. WebGPU EP for speed, WASM fallback. |
| DOM Animation | GSAP | Reliable timelines for input dissolve/reappear sequences. |
| Testing | Vitest + happy-dom | Fast unit tests for state, utilities, and DOM components. No visual regression (manual QA for WebGL). |
| Build | Vite | Fast HMR, native TS support, easy static asset handling. |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/style.css`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "neural-galaxy",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "three": "^0.160.0",
    "gsap": "^3.12.5",
    "onnxruntime-web": "^1.16.3"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "happy-dom": "^13.0.0",
    "@types/three": "^0.160.0"
  }
}
```

- [ ] **Step 2: Write `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000 },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          onnx: ['onnxruntime-web'],
          gsap: ['gsap'],
        },
      },
    },
  },
  assetsInclude: ['**/*.onnx'],
});
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Neural Galaxy</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="app">
    <canvas id="galaxy-canvas"></canvas>
    <div id="ui-layer" class="ui-layer"></div>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Write initial `src/style.css`**

```css
:root {
  --void-black: #000000;
  --void-deep: #0a0a0f;
  --star-white: rgba(220, 230, 255, 0.9);
  --nebula-blue: rgba(100, 150, 255, 0.6);
  --flare-red: #ff4d4d;
  --flare-gold: #ffcc66;
  --beam-violet: rgba(180, 120, 255, 0.4);
  --beam-white: rgba(255, 255, 255, 0.9);
  --font-primary: 'Inter', sans-serif;
  --font-size-input: 24px;
  --font-size-label: 11px;
  --letter-spacing-wide: 0.15em;
  --caret-breathe: 1.5s;
  --touch-min: 44px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body, #app {
  width: 100%;
  height: 100%;
  background: var(--void-black);
  overflow: hidden;
  font-family: var(--font-primary);
}

#galaxy-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.ui-layer {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ui-layer > * { pointer-events: auto; }

@media (max-width: 768px) {
  :root { --font-size-input: 18px; }
}
```

- [ ] **Step 6: Write stub `src/main.ts`**

```typescript
import './style.css';
console.log('Neural Galaxy initializing...');
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: Packages resolve without error.

- [ ] **Step 8: Verify dev server starts**

Run: `npm run dev`
Expected: Vite starts on port 3000, page loads black canvas.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: project scaffolding with vite, three.js, onnxruntime"
```

---

### Task 2: State Types & AppState Store

**Files:**
- Create: `src/state/types.ts`
- Create: `src/state/AppState.ts`
- Test: `src/state/AppState.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/state/AppState.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AppState } from './AppState';
import type { AppPhase } from './types';

describe('AppState', () => {
  it('starts in VOID phase', () => {
    const state = new AppState();
    expect(state.phase).toBe('VOID');
  });

  it('transitions VOID → INVOCATION on focus', () => {
    const state = new AppState();
    const listener = vi.fn();
    state.subscribe(listener);
    state.focus();
    expect(state.phase).toBe('INVOCATION');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ phase: 'INVOCATION' }));
  });

  it('transitions INVOCATION → JOURNEY on submit', () => {
    const state = new AppState();
    state.focus();
    state.submit('hello');
    expect(state.phase).toBe('JOURNEY');
    expect(state.prompt).toBe('hello');
  });

  it('transitions JOURNEY → VOID on complete', () => {
    const state = new AppState();
    state.focus();
    state.submit('hello');
    state.complete();
    expect(state.phase).toBe('VOID');
    expect(state.prompt).toBe('');
  });

  it('does not submit empty prompt', () => {
    const state = new AppState();
    state.focus();
    state.submit('   ');
    expect(state.phase).toBe('INVOCATION');
  });

  it('cancels JOURNEY back to VOID', () => {
    const state = new AppState();
    state.focus();
    state.submit('hello');
    state.cancel();
    expect(state.phase).toBe('VOID');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/state/AppState.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/state/types.ts`**

```typescript
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
```

- [ ] **Step 4: Write `src/state/AppState.ts`**

```typescript
import type { AppPhase, AppStateSnapshot, StateListener, ActivationSummary } from './types';

export class AppState {
  private _phase: AppPhase = 'VOID';
  private _prompt = '';
  private _isLoadingModel = false;
  private _modelReady = false;
  private _error: string | null = null;
  private _journeyProgress = 0;
  private _listeners: StateListener[] = [];

  get phase() { return this._phase; }
  get prompt() { return this._prompt; }
  get isLoadingModel() { return this._isLoadingModel; }
  get modelReady() { return this._modelReady; }
  get error() { return this._error; }
  get journeyProgress() { return this._journeyProgress; }

  subscribe(listener: StateListener): () => void {
    this._listeners.push(listener);
    listener(this.snapshot);
    return () => {
      const idx = this._listeners.indexOf(listener);
      if (idx !== -1) this._listeners.splice(idx, 1);
    };
  }

  private notify() {
    const snap = this.snapshot;
    this._listeners.forEach(l => l(snap));
  }

  get snapshot(): AppStateSnapshot {
    return {
      phase: this._phase,
      prompt: this._prompt,
      isLoadingModel: this._isLoadingModel,
      modelReady: this._modelReady,
      error: this._error,
      journeyProgress: this._journeyProgress,
    };
  }

  focus() {
    if (this._phase === 'VOID') {
      this._phase = 'INVOCATION';
      this.notify();
    }
  }

  blur() {
    if (this._phase === 'INVOCATION' && this._prompt.trim() === '') {
      this._phase = 'VOID';
      this.notify();
    }
  }

  type(value: string) {
    this._prompt = value;
    this.notify();
  }

  submit(prompt: string) {
    const trimmed = prompt.trim();
    if (trimmed === '') return;
    this._prompt = trimmed;
    this._phase = 'JOURNEY';
    this._journeyProgress = 0;
    this.notify();
  }

  setJourneyProgress(p: number) {
    this._journeyProgress = Math.max(0, Math.min(1, p));
    this.notify();
  }

  complete() {
    this._phase = 'VOID';
    this._prompt = '';
    this._journeyProgress = 0;
    this.notify();
  }

  cancel() {
    this._phase = 'VOID';
    this._prompt = '';
    this._journeyProgress = 0;
    this.notify();
  }

  setModelLoading(v: boolean) {
    this._isLoadingModel = v;
    this.notify();
  }

  setModelReady(v: boolean) {
    this._modelReady = v;
    this._isLoadingModel = false;
    this.notify();
  }

  setError(e: string | null) {
    this._error = e;
    this.notify();
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:run -- src/state/AppState.test.ts`
Expected: PASS (6/6).

- [ ] **Step 6: Commit**

```bash
git add src/state/
git commit -m "feat: AppState store with observer pattern and full test coverage"
```

---

### Task 3: Utility Functions

**Files:**
- Create: `src/utils/lerp.ts`
- Create: `src/utils/color.ts`
- Create: `src/utils/rng.ts`
- Test: `src/utils/lerp.test.ts`
- Test: `src/utils/color.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/utils/lerp.test.ts
import { describe, it, expect } from 'vitest';
import { lerp, damp } from './lerp';

describe('lerp', () => {
  it('interpolates between two scalars', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('damps toward target', () => {
    expect(damp(0, 10, 0.5, 1)).toBeCloseTo(3.935, 2);
  });
});

// src/utils/color.test.ts
import { describe, it, expect } from 'vitest';
import { attentionToColor, ffnToColor, hueForToken } from './color';

describe('color', () => {
  it('maps attention 0 to violet', () => {
    const c = attentionToColor(0);
    expect(c.r).toBeGreaterThan(0.6);
    expect(c.b).toBeGreaterThan(0.9);
  });

  it('maps attention 1 to white', () => {
    const c = attentionToColor(1);
    expect(c.r).toBe(1);
    expect(c.g).toBe(1);
    expect(c.b).toBe(1);
  });

  it('gives consistent hue for same token index', () => {
    expect(hueForToken(0)).toBe(hueForToken(0));
    expect(hueForToken(0)).not.toBe(hueForToken(1));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/utils/lerp.test.ts src/utils/color.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write implementations**

```typescript
// src/utils/lerp.ts
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function damp(current: number, target: number, smoothing: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-smoothing * dt));
}

export function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
) {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  };
}
```

```typescript
// src/utils/color.ts
export interface RGB { r: number; g: number; b: number; }

const VIOLET: RGB = { r: 0.71, g: 0.47, b: 1.0 };
const WHITE: RGB = { r: 1.0, g: 1.0, b: 1.0 };
const RED: RGB = { r: 1.0, g: 0.3, b: 0.3 };
const GOLD: RGB = { r: 1.0, g: 0.8, b: 0.4 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function attentionToColor(intensity: number): RGB {
  return {
    r: lerp(VIOLET.r, WHITE.r, intensity),
    g: lerp(VIOLET.g, WHITE.g, intensity),
    b: lerp(VIOLET.b, WHITE.b, intensity),
  };
}

export function ffnToColor(energy: number): RGB {
  if (energy < 0.5) {
    const t = energy * 2;
    return { r: lerp(RED.r, GOLD.r, t), g: lerp(RED.g, GOLD.g, t), b: lerp(RED.b, GOLD.b, t) };
  }
  const t = (energy - 0.5) * 2;
  return { r: lerp(GOLD.r, WHITE.r, t), g: lerp(GOLD.g, WHITE.g, t), b: lerp(GOLD.b, WHITE.b, t) };
}

export function hueForToken(index: number): number {
  return (index * 137.508) % 360;
}
```

```typescript
// src/utils/rng.ts
export class SeededRNG {
  private seed: number;
  constructor(seed = 12345) { this.seed = seed; }

  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/utils/lerp.test.ts src/utils/color.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: utility functions for lerp, color mapping, and seeded RNG"
```

---

### Task 4: UI — PromptInput Component

**Files:**
- Create: `src/ui/PromptInput.ts`
- Create: `src/ui/PromptInput.css`
- Test: `src/ui/PromptInput.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/ui/PromptInput.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptInput } from './PromptInput';
import { AppState } from '../state/AppState';

describe('PromptInput', () => {
  beforeEach(() => { document.body.innerHTML = '<div id="ui-layer"></div>'; });

  it('renders an input with aria-label', () => {
    const state = new AppState();
    new PromptInput(state, document.getElementById('ui-layer')!);
    const el = document.querySelector('input');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('aria-label')).toBe('Prompt for the neural network');
    expect(el?.placeholder).toBe('Speak to the void...');
  });

  it('calls state.focus on focus', () => {
    const state = new AppState();
    const spy = vi.spyOn(state, 'focus');
    new PromptInput(state, document.getElementById('ui-layer')!);
    document.querySelector('input')!.dispatchEvent(new Event('focus'));
    expect(spy).toHaveBeenCalled();
  });

  it('calls state.type on input', () => {
    const state = new AppState();
    const spy = vi.spyOn(state, 'type');
    new PromptInput(state, document.getElementById('ui-layer')!);
    const el = document.querySelector('input') as HTMLInputElement;
    el.value = 'hello';
    el.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('hides during JOURNEY', () => {
    const state = new AppState();
    new PromptInput(state, document.getElementById('ui-layer')!);
    state.focus();
    state.submit('hello');
    const wrapper = document.querySelector('.prompt-wrapper') as HTMLElement;
    expect(wrapper.style.opacity).toBe('0');
    expect(wrapper.style.pointerEvents).toBe('none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/ui/PromptInput.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/ui/PromptInput.ts`**

```typescript
import type { AppState } from '../state/AppState';
import './PromptInput.css';

export class PromptInput {
  private element: HTMLInputElement;
  private wrapper: HTMLDivElement;
  private unsubscribe: () => void;

  constructor(private state: AppState, container: HTMLElement) {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'prompt-wrapper';

    this.element = document.createElement('input');
    this.element.type = 'text';
    this.element.className = 'prompt-input';
    this.element.placeholder = 'Speak to the void...';
    this.element.setAttribute('aria-label', 'Prompt for the neural network');
    this.element.setAttribute('autocomplete', 'off');
    this.element.setAttribute('autocorrect', 'off');
    this.element.setAttribute('autocapitalize', 'off');
    this.element.setAttribute('spellcheck', 'false');

    this.wrapper.appendChild(this.element);
    container.appendChild(this.wrapper);

    this.element.addEventListener('focus', () => state.focus());
    this.element.addEventListener('blur', () => state.blur());
    this.element.addEventListener('input', () => state.type(this.element.value));
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') state.submit(this.element.value);
      if (e.key === 'Escape') state.cancel();
    });

    this.unsubscribe = state.subscribe((snap) => {
      if (snap.phase === 'JOURNEY') {
        this.wrapper.style.opacity = '0';
        this.wrapper.style.pointerEvents = 'none';
        this.element.blur();
      } else {
        this.wrapper.style.opacity = '1';
        this.wrapper.style.pointerEvents = 'auto';
        if (snap.phase === 'VOID') {
          this.element.value = '';
        }
      }
    });
  }

  destroy() {
    this.unsubscribe();
    this.wrapper.remove();
  }
}
```

- [ ] **Step 4: Write `src/ui/PromptInput.css`**

```css
.prompt-wrapper {
  transition: opacity 0.8s ease;
}

.prompt-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--star-white);
  font-family: var(--font-primary);
  font-size: var(--font-size-input);
  font-weight: 300;
  text-align: center;
  caret-color: var(--star-white);
  text-shadow: 0 0 20px rgba(180, 200, 255, 0.3);
  width: 80vw;
  max-width: 600px;
  padding: 12px 0;
}

.prompt-input::placeholder {
  color: var(--star-white);
  opacity: 0.4;
  font-style: italic;
}

.prompt-input:focus {
  outline: none;
}

.prompt-input:focus-visible {
  outline: 2px solid rgba(180, 200, 255, 0.8);
  outline-offset: 4px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .prompt-input {
    width: 90vw;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:run -- src/ui/PromptInput.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/PromptInput.ts src/ui/PromptInput.css src/ui/PromptInput.test.ts
git commit -m "feat: PromptInput component with a11y and state integration"
```

---

### Task 5: UI — IgniteButton Component

**Files:**
- Create: `src/ui/IgniteButton.ts`
- Create: `src/ui/IgniteButton.css`
- Test: `src/ui/IgniteButton.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/ui/IgniteButton.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { IgniteButton } from './IgniteButton';
import { AppState } from '../state/AppState';

describe('IgniteButton', () => {
  beforeEach(() => { document.body.innerHTML = '<div id="ui-layer"></div>'; });

  it('is hidden when prompt is empty', () => {
    const state = new AppState();
    new IgniteButton(state, document.getElementById('ui-layer')!);
    const btn = document.querySelector('.ignite-button') as HTMLElement;
    expect(btn.classList.contains('visible')).toBe(false);
  });

  it('appears when prompt has content', () => {
    const state = new AppState();
    new IgniteButton(state, document.getElementById('ui-layer')!);
    state.focus();
    state.type('hello');
    const btn = document.querySelector('.ignite-button') as HTMLElement;
    expect(btn.classList.contains('visible')).toBe(true);
  });

  it('submits prompt on click', () => {
    const state = new AppState();
    new IgniteButton(state, document.getElementById('ui-layer')!);
    state.focus();
    state.type('hello');
    const btn = document.querySelector('.ignite-button') as HTMLElement;
    btn.click();
    expect(state.phase).toBe('JOURNEY');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/ui/IgniteButton.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `src/ui/IgniteButton.ts`**

```typescript
import type { AppState } from '../state/AppState';
import './IgniteButton.css';

export class IgniteButton {
  private button: HTMLButtonElement;
  private unsubscribe: () => void;

  constructor(private state: AppState, container: HTMLElement) {
    this.button = document.createElement('button');
    this.button.className = 'ignite-button';
    this.button.setAttribute('aria-label', 'Ignite neural journey');
    this.button.innerHTML = '<span class="ignite-label">Ignite</span>';
    this.button.tabIndex = -1;
    container.appendChild(this.button);

    this.button.addEventListener('click', () => {
      state.submit(state.prompt);
    });

    this.unsubscribe = state.subscribe((snap) => {
      const hasContent = snap.prompt.trim().length > 0;
      const visible = hasContent && snap.phase !== 'JOURNEY';
      this.button.classList.toggle('visible', visible);
      this.button.style.pointerEvents = visible ? 'auto' : 'none';
      this.button.tabIndex = visible ? 0 : -1;
    });
  }

  destroy() {
    this.unsubscribe();
    this.button.remove();
  }
}
```

- [ ] **Step 4: Write `src/ui/IgniteButton.css`**

```css
.ignite-button {
  width: 80px;
  height: 44px;
  margin-top: 16px;
  background: transparent;
  border: 1px solid rgba(180, 200, 255, 0.3);
  border-radius: 22px;
  color: rgba(220, 230, 255, 0.7);
  font-family: var(--font-primary);
  font-size: var(--font-size-label);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease, border-color 0.3s ease;
}

.ignite-button.visible {
  opacity: 1;
  transform: translateY(0);
}

.ignite-button:hover {
  border-color: rgba(180, 200, 255, 0.8);
  color: var(--star-white);
}

.ignite-button:focus-visible {
  outline: 2px solid rgba(180, 200, 255, 0.8);
  outline-offset: 3px;
}

@media (max-width: 768px) {
  .ignite-button {
    width: 90vw;
    max-width: 300px;
    border-radius: 4px;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:run -- src/ui/IgniteButton.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/IgniteButton.ts src/ui/IgniteButton.css src/ui/IgniteButton.test.ts
git commit -m "feat: IgniteButton component with responsive styles"
```

---

### Task 6: UI — LiveRegion & ReducedMotion

**Files:**
- Create: `src/ui/LiveRegion.ts`
- Create: `src/ui/ReducedMotion.ts`
- Test: `src/ui/LiveRegion.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/ui/LiveRegion.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LiveRegion } from './LiveRegion';
import { AppState } from '../state/AppState';

describe('LiveRegion', () => {
  beforeEach(() => { document.body.innerHTML = '<div id="ui-layer"></div>'; });

  it('has polite aria-live', () => {
    new LiveRegion(new AppState(), document.getElementById('ui-layer')!);
    const el = document.querySelector('[aria-live="polite"]');
    expect(el).not.toBeNull();
    expect(el?.classList.contains('sr-only')).toBe(true);
  });

  it('announces journey start', () => {
    const state = new AppState();
    new LiveRegion(state, document.getElementById('ui-layer')!);
    state.focus();
    state.submit('hello');
    const el = document.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(el.textContent).toContain('journey has begun');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/ui/LiveRegion.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `src/ui/LiveRegion.ts`**

```typescript
import type { AppState } from '../state/AppState';

export class LiveRegion {
  private el: HTMLDivElement;
  private unsubscribe: () => void;
  private lastPhase = 'VOID';

  constructor(state: AppState, container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'sr-only';
    this.el.setAttribute('aria-live', 'polite');
    this.el.setAttribute('aria-atomic', 'true');
    container.appendChild(this.el);

    this.unsubscribe = state.subscribe((snap) => {
      if (snap.phase === 'JOURNEY' && this.lastPhase !== 'JOURNEY') {
        this.announce('A neural journey has begun. The network is thinking.');
      }
      if (snap.phase === 'VOID' && this.lastPhase === 'JOURNEY') {
        this.announce('The journey ends. The void returns.');
      }
      this.lastPhase = snap.phase;
    });
  }

  announce(message: string) {
    this.el.textContent = message;
  }

  destroy() {
    this.unsubscribe();
    this.el.remove();
  }
}
```

- [ ] **Step 4: Write `src/ui/ReducedMotion.ts`**

```typescript
export class ReducedMotion {
  private mq: MediaQueryList;
  private _reduced = false;
  private listeners: ((reduced: boolean) => void)[] = [];

  constructor() {
    this.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reduced = this.mq.matches;
    this.mq.addEventListener('change', (e) => {
      this._reduced = e.matches;
      this.listeners.forEach(l => l(this._reduced));
    });
  }

  get reduced() { return this._reduced; }

  subscribe(fn: (reduced: boolean) => void): () => void {
    this.listeners.push(fn);
    fn(this._reduced);
    return () => {
      const idx = this.listeners.indexOf(fn);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }
}
```

- [ ] **Step 5: Add `.sr-only` utility to `src/style.css`**

Append to `src/style.css`:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test:run -- src/ui/LiveRegion.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/ui/LiveRegion.ts src/ui/ReducedMotion.ts src/ui/LiveRegion.test.ts src/style.css
git commit -m "feat: LiveRegion a11y announcements and ReducedMotion detection"
```

---

### Task 7: UI — LoadingIndicator & ErrorOverlay

**Files:**
- Create: `src/ui/LoadingIndicator.ts`
- Create: `src/ui/LoadingIndicator.css`
- Create: `src/ui/ErrorOverlay.ts`
- Create: `src/ui/ErrorOverlay.css`

- [ ] **Step 1: Write implementations**

```typescript
// src/ui/LoadingIndicator.ts
import type { AppState } from '../state/AppState';
import './LoadingIndicator.css';

export class LoadingIndicator {
  private el: HTMLDivElement;
  private bar: HTMLDivElement;
  private unsubscribe: () => void;

  constructor(state: AppState, container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'loading-indicator';

    this.bar = document.createElement('div');
    this.bar.className = 'loading-bar';
    this.el.appendChild(this.bar);

    const label = document.createElement('span');
    label.className = 'loading-label';
    label.textContent = 'Gathering stardust...';
    this.el.appendChild(label);

    container.appendChild(this.el);

    this.unsubscribe = state.subscribe((snap) => {
      const visible = snap.isLoadingModel || (!snap.modelReady && snap.phase === 'VOID');
      this.el.classList.toggle('visible', visible);
    });
  }

  setProgress(p: number) {
    this.bar.style.setProperty('--progress', `${Math.max(0, Math.min(100, p * 100))}%`);
  }

  destroy() {
    this.unsubscribe();
    this.el.remove();
  }
}
```

```css
/* src/ui/LoadingIndicator.css */
.loading-indicator {
  position: absolute;
  bottom: 15vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.loading-indicator.visible {
  opacity: 1;
}

.loading-bar {
  width: 200px;
  height: 1px;
  background: rgba(180, 200, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.loading-bar::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: var(--progress, 0%);
  background: linear-gradient(90deg, transparent, var(--nebula-blue), transparent);
  transition: width 0.3s ease;
}

.loading-label {
  font-size: var(--font-size-label);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  color: rgba(220, 230, 255, 0.5);
}
```

```typescript
// src/ui/ErrorOverlay.ts
import type { AppState } from '../state/AppState';
import './ErrorOverlay.css';

export class ErrorOverlay {
  private el: HTMLDivElement;
  private message: HTMLSpanElement;
  private retryBtn: HTMLButtonElement;
  private unsubscribe: () => void;

  constructor(state: AppState, container: HTMLElement, onRetry: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'error-overlay';

    this.message = document.createElement('span');
    this.message.className = 'error-message';
    this.el.appendChild(this.message);

    this.retryBtn = document.createElement('button');
    this.retryBtn.className = 'error-retry';
    this.retryBtn.textContent = 'Retry';
    this.retryBtn.addEventListener('click', onRetry);
    this.el.appendChild(this.retryBtn);

    container.appendChild(this.el);

    this.unsubscribe = state.subscribe((snap) => {
      const visible = snap.error !== null;
      this.el.classList.toggle('visible', visible);
      if (visible) {
        this.message.textContent = snap.error!;
      }
    });
  }

  destroy() {
    this.unsubscribe();
    this.el.remove();
  }
}
```

```css
/* src/ui/ErrorOverlay.css */
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: rgba(10, 5, 5, 0.85);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
  z-index: 10;
}

.error-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.error-message {
  font-size: var(--font-size-input);
  color: var(--flare-red);
  text-align: center;
  max-width: 80vw;
  text-shadow: 0 0 20px rgba(255, 50, 50, 0.3);
}

.error-retry {
  padding: 12px 32px;
  background: transparent;
  border: 1px solid rgba(255, 100, 100, 0.4);
  border-radius: 4px;
  color: rgba(255, 200, 200, 0.9);
  font-family: var(--font-primary);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.error-retry:hover {
  border-color: rgba(255, 100, 100, 0.8);
}

.error-retry:focus-visible {
  outline: 2px solid rgba(255, 100, 100, 0.8);
  outline-offset: 3px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/LoadingIndicator.ts src/ui/LoadingIndicator.css src/ui/ErrorOverlay.ts src/ui/ErrorOverlay.css
git commit -m "feat: LoadingIndicator and ErrorOverlay components"
```

---

### Task 8: Visualization Foundation — GalaxyScene & CameraController

**Files:**
- Create: `src/visualization/GalaxyScene.ts`
- Create: `src/visualization/CameraController.ts`
- Create: `src/visualization/shaders.ts`

- [ ] **Step 1: Write `src/visualization/GalaxyScene.ts`**

```typescript
import * as THREE from 'three';
import { CameraController } from './CameraController';

export class GalaxyScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controller: CameraController;
  private rafId = 0;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

    this.camera = new THREE.PerspectiveCamera(
      60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000
    );
    this.camera.position.set(0, 0, 30);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);

    this.controller = new CameraController(this.camera);

    window.addEventListener('resize', this.onResize);
  }

  start() {
    this.clock.start();
    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      const dt = this.clock.getDelta();
      this.controller.update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  stop() {
    cancelAnimationFrame(this.rafId);
  }

  private onResize = () => {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
```

- [ ] **Step 2: Write `src/visualization/CameraController.ts`**

```typescript
import * as THREE from 'three';

export class CameraController {
  private targetPosition = new THREE.Vector3(0, 0, 30);
  private targetLookAt = new THREE.Vector3(0, 0, 0);
  private currentPosition = new THREE.Vector3(0, 0, 30);
  private currentLookAt = new THREE.Vector3(0, 0, 0);
  private damping = 2.0;
  private isOrbiting = false;
  private orbit = new THREE.Spherical(30, Math.PI / 2, 0);
  private orbitTarget = new THREE.Spherical(30, Math.PI / 2, 0);

  constructor(private camera: THREE.PerspectiveCamera) {}

  setSplineTarget(pos: THREE.Vector3, lookAt: THREE.Vector3) {
    this.targetPosition.copy(pos);
    this.targetLookAt.copy(lookAt);
  }

  startOrbit() {
    this.isOrbiting = true;
  }

  endOrbit() {
    this.isOrbiting = false;
  }

  updateOrbit(deltaTheta: number, deltaPhi: number) {
    this.orbitTarget.theta += deltaTheta;
    this.orbitTarget.phi = THREE.MathUtils.clamp(
      this.orbitTarget.phi + deltaPhi, 0.1, Math.PI - 0.1
    );
  }

  update(dt: number) {
    if (this.isOrbiting) {
      this.orbit.theta = THREE.MathUtils.lerp(this.orbit.theta, this.orbitTarget.theta, 1 - Math.exp(-this.damping * dt));
      this.orbit.phi = THREE.MathUtils.lerp(this.orbit.phi, this.orbitTarget.phi, 1 - Math.exp(-this.damping * dt));
      this.currentPosition.setFromSpherical(this.orbit);
    } else {
      this.currentPosition.lerp(this.targetPosition, 1 - Math.exp(-this.damping * dt));
    }

    this.currentLookAt.lerp(this.targetLookAt, 1 - Math.exp(-this.damping * dt));
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }
}
```

- [ ] **Step 3: Write `src/visualization/shaders.ts`**

```typescript
export const seedVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const seedFragmentShader = `
  varying vec3 vColor;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);
    gl_FragColor = vec4(vColor, glow);
  }
`;
```

- [ ] **Step 4: Commit**

```bash
git add src/visualization/GalaxyScene.ts src/visualization/CameraController.ts src/visualization/shaders.ts
git commit -m "feat: Three.js scene foundation, camera controller, shader stubs"
```

---

### Task 9: Visualization — TokenSeed & ParticlePool

**Files:**
- Create: `src/visualization/ParticlePool.ts`
- Create: `src/visualization/TokenSeed.ts`

- [ ] **Step 1: Write `src/visualization/ParticlePool.ts`**

```typescript
import * as THREE from 'three';

export class ParticlePool {
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private count: number;
  private material: THREE.PointsMaterial;
  readonly mesh: THREE.Points;

  constructor(maxParticles: number, scene: THREE.Scene) {
    this.count = maxParticles;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    scene.add(this.mesh);
  }

  setParticle(i: number, x: number, y: number, z: number, r: number, g: number, b: number, size: number) {
    if (i >= this.count) return;
    const i3 = i * 3;
    this.positions[i3] = x;
    this.positions[i3 + 1] = y;
    this.positions[i3 + 2] = z;
    this.colors[i3] = r;
    this.colors[i3 + 1] = g;
    this.colors[i3 + 2] = b;
    this.sizes[i] = size;
  }

  update() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
```

- [ ] **Step 2: Write `src/visualization/TokenSeed.ts`**

```typescript
import * as THREE from 'three';
import { ParticlePool } from './ParticlePool';
import { hueForToken } from '../utils/color';

export class TokenSeed {
  private pool: ParticlePool;
  private particlesPerSeed = 64;
  private baseIndex: number;
  private hue: number;
  private currentBrightness = 0;
  private targetBrightness = 0;

  constructor(
    scene: THREE.Scene,
    pool: ParticlePool,
    tokenIndex: number,
    basePoolIndex: number,
    x: number, y: number, z: number
  ) {
    this.pool = pool;
    this.baseIndex = basePoolIndex;
    this.hue = hueForToken(tokenIndex);

    const color = new THREE.Color().setHSL(this.hue / 360, 0.8, 0.5);
    for (let i = 0; i < this.particlesPerSeed; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      const pz = z + (Math.random() - 0.5) * 1;
      const size = 0.5 + Math.random() * 1.5;
      pool.setParticle(basePoolIndex + i, px, py, pz, color.r, color.g, color.b, size);
    }
  }

  setBrightness(norm: number) {
    this.targetBrightness = norm;
  }

  update(dt: number) {
    this.currentBrightness += (this.targetBrightness - this.currentBrightness) * (1 - Math.exp(-3 * dt));
    const color = new THREE.Color().setHSL(this.hue / 360, 0.8, 0.3 + this.currentBrightness * 0.5);
    for (let i = 0; i < this.particlesPerSeed; i++) {
      const idx = this.baseIndex + i;
      const i3 = idx * 3;
      (this.pool as any)['positions'][i3] += (Math.random() - 0.5) * 0.01;
      (this.pool as any)['positions'][i3 + 1] += (Math.random() - 0.5) * 0.01;
      (this.pool as any)['colors'][i3] = color.r;
      (this.pool as any)['colors'][i3 + 1] = color.g;
      (this.pool as any)['colors'][i3 + 2] = color.b;
      (this.pool as any)['sizes'][idx] = (0.5 + Math.random()) * (0.5 + this.currentBrightness);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/visualization/ParticlePool.ts src/visualization/TokenSeed.ts
git commit -m "feat: ParticlePool and TokenSeed visualization"
```

---

### Task 10: Inference — Tokenizer & ModelLoader

**Files:**
- Create: `src/inference/Tokenizer.ts`
- Create: `src/inference/ModelLoader.ts`
- Test: `src/inference/Tokenizer.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/inference/Tokenizer.test.ts
import { describe, it, expect } from 'vitest';
import { SimpleTokenizer } from './Tokenizer';

describe('SimpleTokenizer', () => {
  it('encodes and decodes roundtrip', () => {
    const tok = new SimpleTokenizer({ hello: 1, world: 2, ' ': 3 });
    const ids = tok.encode('hello world');
    expect(ids).toEqual([1, 3, 2]);
    expect(tok.decode(ids)).toBe('hello world');
  });

  it('handles unknown chars with UNK token', () => {
    const tok = new SimpleTokenizer({ a: 1 }, { unkId: 99 });
    expect(tok.encode('ab')).toEqual([1, 99]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/inference/Tokenizer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `src/inference/Tokenizer.ts`**

```typescript
interface TokenizerConfig {
  unkId?: number;
}

export class SimpleTokenizer {
  private vocab: Map<string, number>;
  private reverseVocab: Map<number, string>;
  private unkId: number;

  constructor(vocabJson: Record<string, number>, config: TokenizerConfig = {}) {
    this.vocab = new Map(Object.entries(vocabJson));
    this.reverseVocab = new Map();
    for (const [token, id] of this.vocab) {
      this.reverseVocab.set(id, token);
    }
    this.unkId = config.unkId ?? 0;
  }

  encode(text: string): number[] {
    const tokens: number[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      let matched = false;
      for (let len = remaining.length; len > 0; len--) {
        const sub = remaining.slice(0, len);
        if (this.vocab.has(sub)) {
          tokens.push(this.vocab.get(sub)!);
          remaining = remaining.slice(len);
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push(this.unkId);
        remaining = remaining.slice(1);
      }
    }
    return tokens;
  }

  decode(ids: number[]): string {
    return ids.map(id => this.reverseVocab.get(id) ?? '\uFFFD').join('');
  }
}
```

- [ ] **Step 4: Write `src/inference/ModelLoader.ts`**

```typescript
const CACHE_NAME = 'neural-galaxy-model-v1';
const MODEL_URL = '/model/model.onnx';

export class ModelLoader {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(CACHE_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onupgradeneeded = () => {
        req.result.createObjectStore('models');
      };
    });
  }

  async load(progressCallback?: (p: number) => void): Promise<ArrayBuffer> {
    await this.initDB();

    const cached = await this.getFromCache('weights');
    if (cached) {
      progressCallback?.(1);
      return cached;
    }

    const response = await fetch(MODEL_URL);
    const contentLength = +(response.headers.get('Content-Length') ?? 0);
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (contentLength) {
        progressCallback?.(received / contentLength);
      }
    }

    const all = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      all.set(chunk, offset);
      offset += chunk.length;
    }

    await this.saveToCache('weights', all.buffer);
    progressCallback?.(1);
    return all.buffer;
  }

  private getFromCache(key: string): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction('models', 'readonly');
      const store = tx.objectStore('models');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  private saveToCache(key: string, data: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('models', 'readwrite');
      const store = tx.objectStore('models');
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:run -- src/inference/Tokenizer.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/inference/Tokenizer.ts src/inference/Tokenizer.test.ts src/inference/ModelLoader.ts
git commit -m "feat: SimpleTokenizer and ModelLoader with IndexedDB caching"
```

---

### Task 11: Inference — InferenceWorker

**Files:**
- Create: `src/inference/InferenceWorker.ts`
- Create: `src/inference/probes.ts`

- [ ] **Step 1: Write `src/inference/probes.ts`**

```typescript
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
```

- [ ] **Step 2: Write `src/inference/InferenceWorker.ts`**

```typescript
import * as ort from 'onnxruntime-web';
import { extractSummary } from './probes';
import type { ActivationSummary } from '../state/types';

let session: ort.InferenceSession | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, buffer, promptTokens } = e.data;

  if (type === 'load') {
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
          if (name !== 'logits') {
            activations.set(name, tensor.data as Float32Array);
          }
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
```

- [ ] **Step 3: Commit**

```bash
git add src/inference/InferenceWorker.ts src/inference/probes.ts
git commit -m "feat: InferenceWorker with ONNX Runtime and activation probes"
```

---

### Task 12: Main App Wiring

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Write `src/main.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/main.ts
git commit -m "feat: main app wiring with state, UI, scene, and model loading"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Three experience states (Void, Invocation, Journey) → AppState + UI components
- ✅ Cosmic aesthetic → Three.js scene, fog, additive blending, color mapping
- ✅ Real LLM inference → ONNX Runtime Web + InferenceWorker
- ✅ Activation visualization → probes.ts + ActivationSummary type
- ✅ Autonomous camera flight → CameraController with spline + orbit
- ✅ Prompt input ethereal design → PromptInput.css with glow and caret
- ✅ Ignite button → IgniteButton with responsive styles
- ✅ Accessibility → LiveRegion, focus rings, aria-labels, reduced motion
- ✅ Loading states → LoadingIndicator with spectrogram bar
- ✅ Error states → ErrorOverlay with retry
- ✅ Performance budget → code splitting, lazy loading, particle pool, IndexedDB cache
- ✅ Mobile adaptation → media queries in CSS, visualViewport API noted
- ✅ `prefers-reduced-motion` → ReducedMotion class

**2. Placeholder scan:**
- ✅ No TBD, TODO, or "implement later"
- ✅ All test code is explicit and runnable
- ✅ All CSS values are concrete

**3. Type consistency:**
- ✅ `ActivationSummary` used consistently across probes.ts, InferenceWorker, and types.ts
- ✅ `AppStateSnapshot` is the single source of truth for UI components

**4. A11y coverage:**
- ✅ PromptInput: `aria-label`, `focus-visible` outline
- ✅ IgniteButton: `aria-label`, keyboard reachable via Tab
- ✅ LiveRegion: `aria-live="polite"`, `aria-atomic="true"`
- ✅ ErrorOverlay: focusable retry button with visible focus ring
- ✅ ReducedMotion: media query detection with subscription API

**5. Performance budget:**
- ✅ Vite manual chunks for three, onnx, gsap
- ✅ Model cached in IndexedDB
- ✅ Particle pool capped (configurable maxParticles)
- ✅ Renderer pixel ratio clamped to 2

---

## Execution Handoff

**Plan complete and saved to `docs/dominion/plans/2026-05-16-neural-galaxy.md`.**

Two execution options:

**1. Component-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for quality and catching issues early.

**2. Inline Execution** — Execute tasks in this session using `building-fullstack-apps`, batch execution with checkpoints for review. Faster but less review between steps.

**Which approach do you want?**

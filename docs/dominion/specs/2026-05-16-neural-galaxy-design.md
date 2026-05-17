# Neural Galaxy — Design Specification

**Date:** 2026-05-16  
**Approach:** The Honest Neuron (Tiny Pre-trained Model with Activation Streaming)  
**Aesthetic:** Deep Space / Cosmic  
**Scope:** Single-page immersive experience  

---

## 1. Overall Experience & Layout Architecture

The page is a single full-viewport immersive canvas. No scrolling. No navigation chrome. No footer. The browser window becomes a viewport into deep space.

### Three Experience States

| State | What the user sees |
|-------|-------------------|
| **The Void** | On load: a slowly drifting starfield. A subtle, breathing cursor-line pulses in the center. No other UI. The stars are background ambience, not yet the network. |
| **The Invocation** | User begins typing. Their prompt materializes as faint phosphorescent characters floating in the void, each keystroke emitting a tiny radial shockwave of particles. A "ignite" button (or Enter key) appears as a dim stellar waypoint. |
| **The Journey** | Upon submission: the prompt text dissolves into the void, the camera begins its autonomous flight, and the neural galaxy materializes — layer by layer — as the model runs inference. The flight path is choreographed: wide establishing shot of the full transformer stack, then a slow dolly through attention heads, a pass through feed-forward constellations, and finally a pull-back as the final logits bloom. |

### Camera Philosophy

The camera never jerks. All movement is inertial — heavy, spacecraft-like. During The Journey, the camera follows a spline path keyed to the inference timeline (token 1 = approach embedding nebula, token N = reveal final output energies). The user can grab and orbit the camera at any time (orbit controls with damping), but releasing returns it to the cinematic spline within 2 seconds of smooth interpolation.

### Layout

There is no "layout" in the traditional sense. The only DOM element above the canvas is the prompt input — absolutely centered, transparent background, ethereal caret. Everything else is WebGL.

---

## 2. The Neural Galaxy — Visual Language & Transformer Mapping

The galaxy is not an arbitrary particle system. Every visual element maps to a real tensor operation in the forward pass.

### Token Embeddings: The Seed Nebula

At the start of each token's journey, it appears as a **luminous seed** in a swirling nebula. The embedding vector's 256–512 dimensions are compressed into a radial glow profile — high-magnitude dimensions create brighter lobes, low-magnitude create shadow. Each token retains a unique base hue (e.g., "the" = deep azure, "light" = gold) carried through every subsequent layer via residual connections as a colored aura.

### Attention Heads: Gravitational Beams

Each attention head becomes a constellation of **filamentary beams** connecting token seeds. The attention weight (softmax score) between query token *i* and key token *j* controls:

- **Beam opacity** — weak attention = ghostly whisper; strong = blazing arc
- **Beam color temperature** — low weights = cool violet; high weights = white-hot
- **Particle drift along beams** — a stream of photons travels from key to query, velocity proportional to attention score

Multiple heads in a layer create a **crown of light** around each token — you see which prior tokens "voted" for the current one.

### Feed-Forward Layers: Stellar Flares

After attention, each token seed passes through the FFN. We compute the **activation energy** (sum of ReLU/GELU activations in the hidden layer). This drives a **stellar flare** — a radial burst of particles emanating from the token seed. High energy = violent, hot, fast ejection; low energy = gentle pulse. The FFN's output projection subtly warps the seed's glow shape, reflecting how the FFN remixes semantic space.

### Layer Transitions: The Wormhole Passage

Between transformer blocks, the camera and tokens pass through a **stardust tunnel** — residual streams twist into helices, carrying token auras forward. This is the visual metaphor for `x + Attention(x)` and `x + FFN(x)`. The tunnel's density and color reflect the layer-norm statistics (mean/variance) — stable norms = smooth passage; wild norms = turbulent, churning space.

### The Output Bloom

At the final layer, all token seeds align in a great ring. The logits vector becomes a **supernova bloom** — a radial probability mandala where each ray represents a candidate next-token. The highest-probability token ignites brightest. As the model samples (or greedily selects), the chosen ray collapses into a new seed nebula, and the cycle begins again for the next token.

### Color System

| Element | Color Logic |
|---------|-------------|
| Token identity | Persistent HSL hue per token position |
| Attention intensity | Cool → warm → white (0 → 1) |
| FFN energy | Deep red → orange → white-hot |
| Layer depth | Slight blue-shift as depth increases |
| Background | True `#000000` with depth fog |

---

## 3. The Prompt Input — The Only Interface

Everything else is WebGL. This one DOM element bridges the human and the machine.

### Visual Design

- **Position:** Dead center during The Void and The Invocation states. Absolutely positioned, no container chrome.
- **Appearance:** Transparent background. Text in a thin-weight geometric sans (Inter or Space Grotesk) at `24px`, color `rgba(220, 230, 255, 0.9)` with a subtle `text-shadow: 0 0 20px rgba(180, 200, 255, 0.3)` for an ethereal glow.
- **Caret:** A vertical line that pulses softly (1.5s ease-in-out) rather than blinking — more like a breathing star than a terminal cursor.
- **Placeholder:** `"Speak to the void..."` in italic, `0.4` opacity, same typeface.

### Interaction & Animation

- **On focus:** The surrounding starfield subtly brightens and slows its drift, as if the cosmos is listening. A faint circular gradient bloom appears behind the input at `0.15` opacity.
- **On keystroke:** Each character materializes with a tiny radial burst of 8–12 particles (canvas overlay, not DOM) that fade over 600ms. Backspace causes characters to dissolve inward rather than vanish.
- **Submit:** Pressing Enter (or a floating "Ignite" button that appears after 3+ characters) triggers:
  1. Input text dissolves into drifting particles over 800ms
  2. Input element fades to `opacity: 0` and `pointer-events: none`
  3. The Journey begins
- **During Journey:** Input is invisible and inert. No UI distracts from the flight.
- **Post-Journey:** After the final token's supernova bloom completes, the galaxy holds for 3 seconds, then gracefully fades back toward The Void state. The input re-materializes (empty, ready) over 1.5s.

### The Ignite Button

- Appears only after the user has typed at least one non-space character
- Positioned as a small circular waypoint below the input, `32px` diameter
- Rendered as a faint ring that completes itself when hovered
- Label: "Ignite" in `11px` uppercase tracking
- Keyboard accessible: `Tab` from input focuses the button; `Space/Enter` activates

### Mobile Adaptation

- On viewports `< 768px`, input scales to `18px` and the Ignite button becomes a full-width pill below it (min touch target `44px` height)
- Virtual keyboard pushes the canvas upward via `visualViewport` API rather than squashing it — the starfield recenters

### Accessibility

- The input is a real `<input type="text">` with `aria-label="Prompt for the neural network"`
- During The Journey, a visually hidden live region announces: "The network is thinking. A visual journey is in progress."
- `prefers-reduced-motion:` If active, particle bursts are disabled, camera movement is instantaneous cuts rather than smooth flights, and the stardust tunnel is replaced by a simple crossfade.

---

## 4. Data Flow & State Management

### The Model

- **Source:** A tiny decoder-only transformer, target ~10–20M parameters. Candidate: a distilled GPT-2 variant or a custom-trained micro-model on TinyStories-like data.
- **Format:** Exported to ONNX via `optimum` or `torch.onnx`. We use **ONNX Runtime Web** with the WebGPU Execution Provider for GPU-accelerated inference. WASM fallback for unsupported browsers.
- **Load strategy:** The model downloads asynchronously on first page load (progress shown as a subtle "gathering stardust" message in the void). Target model size: **under 50MB** quantized to INT8.

### Activation Extraction Strategy

We instrument **summary probes** at key points rather than streaming every scalar:

| Probe Location | What We Extract | Visual Mapping |
|----------------|-----------------|--------------|
| Post-embedding | L2 norm of each token's embedding vector | Seed nebula brightness |
| Attention (per head) | Row-wise max softmax score per query token | Beam opacity peak |
| Attention (per head) | Entropy of attention distribution per token | Beam color spread |
| Post-FFN | Mean activation energy (sum of positive GELU outputs) | Flare intensity |
| Post-FFN | Top-k activated neuron indices | Flare particle count |
| Post-layer-norm | Variance across the layer | Tunnel turbulence |
| Final logits | Top-10 probability values | Supernova ray lengths |

These ~50–100 scalar values per layer per token are emitted via ONNX Runtime's `IOBinding` or custom op hooks, then passed to the visualization thread.

### The Data Pipeline

```
User types prompt
       ↓
Tokenize (wasm tokenizer, ~1ms)
       ↓
ONNX Runtime Web: forward pass token-by-token
       ↓
At each layer: ActivationSummary object emitted
       ↓
Three.js: update uniforms & particle attributes
       ↓
Render frame (60fps target, decoupled from inference speed)
```

**Critical decoupling:** The inference loop runs in a Web Worker. It posts `ActivationSummary` messages to the main thread at each layer boundary. The main thread's Three.js renderer consumes these summaries into target values (e.g., `targetFlareIntensity = summary.ffnEnergy`), then lerps toward them in the render loop. This means the galaxy animates smoothly even if inference hiccups.

### State Machine

```
[VOID] --focus/type--> [INVOCATION] --submit--> [JOURNEY] --complete--> [VOID]
                           ↑                                              |
                           └────────── timeout/error ─────────────────────┘
```

- **VOID:** Idle starfield. Model may still be downloading. Input ready.
- **INVOCATION:** User typing. Particle bursts active. Ignite button visible.
- **JOURNEY:** Inference running. Camera on spline. Input hidden. No new prompts accepted until journey completes or user presses Escape (cancels).

### Performance Budget

- **Inference:** ~100–500ms per token on mid-tier laptop WebGPU
- **Render:** 60fps, <8ms CPU per frame, GPU memory <256MB
- **Data transfer:** Activation summaries <1KB per token per layer — negligible
- **Fallback:** If WebGPU unavailable, graceful degradation to WASM inference with simplified particle counts (50% fewer particles, no volumetric beams)

---

## 5. Accessibility & Performance

### Screen Reader Experience

Since there is no text output, the screen reader becomes a narrator of the machine's inner life. A hidden live region (`aria-live="polite"`) announces the journey's progress:

- *"A neural journey has begun. 12 layers await."*
- *"Passing through attention. The word 'light' is gathering context from 3 prior tokens."*
- *"Feed-forward activation surges. Energy: high."*
- *"The network decides. A new token is born."*
- *"The journey ends. The void returns."*

These narrations are generated from the same `ActivationSummary` data that drives the visuals.

### Keyboard Navigation

- `Tab` moves focus to the prompt input (visible focus ring: `2px solid rgba(180, 200, 255, 0.8)` with `4px` offset)
- `Tab` again moves to the Ignite button
- `Escape` during The Journey cancels inference and returns to Void
- `Space` or `Enter` on focused Ignite button triggers submission
- No other interactive elements require focus

### Motion & Vestibular Sensitivity

- `prefers-reduced-motion: reduce` triggers a completely alternate mode:
  - Camera does not fly; it cuts instantly between static viewpoints (embedding view → attention view → output view)
  - Particle bursts are disabled
  - Stardust tunnels become simple fades
  - No auto-playing animation longer than 5 seconds without user control

### Color & Contrast

- The prompt input maintains **4.5:1 contrast ratio** against the near-black background (`#0a0a0f`)
- Token hues in the galaxy are decorative and do not convey critical information alone — intensity (brightness) is always redundantly encoded
- No flashing content exceeds 3 flashes per second (WCAG 2.3.1)

### Loading Strategy

- **Phase 0 (initial):** HTML + CSS + Three.js core (~150KB gzipped) renders The Void immediately
- **Phase 1 (background):** ONNX Runtime Web wasm + model weights stream via `fetch` with ReadableStream, progress shown as a subtle starfield density increase
- **Phase 2 (ready):** Model cached in `IndexedDB` for subsequent visits; load time drops from ~15s to ~3s

### Runtime Performance

- Target **First Contentful Paint:** <1s
- Target **Largest Contentful Paint:** <2.5s (the canvas itself)
- Target **Time to Interactive:** <3.5s (input responsive even while model loads)
- Render loop uses `requestAnimationFrame` with delta-time clamping
- GPU memory capped by limiting particle pool sizes (max 50,000 particles)

### Browser Support

- **Primary:** Chrome/Edge 113+ (WebGPU), Firefox 126+ (WebGPU), Safari 17+ (WebGL fallback)
- **Degraded:** Older browsers get WASM inference + simplified Canvas2D visualization (no 3D camera, just 2D constellation map)
- **Unsupported:** IE11 and sub-Chrome 90 show a static message: *"This experience requires a stardust-resistant browser. Please visit with Chrome, Firefox, or Safari."*

---

## 6. Error States, Loading & Edge Cases

### Loading States

| State | Visual Treatment |
|-------|------------------|
| **Gathering Stardust** (downloading model) | The Void's starfield slowly densifies. A faint horizontal line below the input fills left-to-right like a spectrogram. No numbers, no percentages — just a sense of "the universe is assembling itself." |
| **Warming the Engines** (compiling shaders) | The starfield briefly shifts to a deep indigo hue. A single bright star pulses three times. |
| **Ready** | The spectrogram line vanishes. The input caret begins its gentle pulse. |

### Error States

| Error | Behavior |
|-------|----------|
| **Model fails to load** (network, corrupted weights) | The starfield dims to a deep crimson. The input remains but is disabled. Message appears: *"The stars are not aligning. The model could not be summoned."* with a **Retry** button. Retry re-attempts download from cache-first, then network. |
| **WebGPU unavailable** | Seamless degradation to WASM inference. A subtle glyph (a small hollow hexagon) appears in the bottom-right corner indicating "Stardust mode" (simplified visuals). Tooltip on hover: *"Your vessel is running in compatible mode. The journey continues, but the nebula is less dense."* |
| **Out of memory during inference** (large prompt, constrained device) | Journey pauses mid-flight. Camera gently pulls back to a safe overview. Message: *"This constellation is too vast for your viewport. Try a shorter invocation."* Input reappears, prompt preserved. |
| **Inference timeout** (>30s without token generation) | Journey aborts. A "dead star" visual — the active token seed collapses to a dark sphere. Message: *"The void did not answer. The network has gone silent."* Auto-retry once; if still failing, return to Void with preserved input. |
| **Empty prompt submitted** | Input shakes gently (CSS transform, `translateX` oscillation 3× over 300ms) with a faint red aura. No journey begins. |
| **Prompt exceeds max length** (model context window, e.g., 512 tokens) | Characters beyond the limit type in a desaturated gray and do not emit particle bursts. A soft horizontal line at the input's right edge glows amber. |

### Edge Cases

- **Tab backgrounded during Journey:** Inference pauses (`visibilitychange` event). When user returns, a gentle prompt: *"The journey was suspended in time. Continue?"* Yes resumes; No returns to Void.
- **User types during Journey:** Keystrokes are ignored (input is `pointer-events: none`). A faint "occupied" hum (visual only, a soft vibration in the starfield) indicates the system is busy.
- **Rapid-fire submissions:** If user submits while a Journey is active, the new prompt is queued. A small orbital ring appears around the Ignite button indicating queue depth (max 1 queued prompt). After the current Journey completes, the next launches automatically after a 2s interlude.
- **First visit vs. Return:** First visit plays a brief (4s) introductory sequence — the camera drifts through a generic "archetypal" neural galaxy (pre-baked, no inference) to teach the user what they're looking at. Return visitors skip this and land directly in The Void.

---

## 7. Design Tokens

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `void-black` | `#000000` | Canvas background |
| `void-deep` | `#0a0a0f` | Input background contrast base |
| `star-white` | `rgba(220, 230, 255, 0.9)` | Primary text |
| `nebula-blue` | `rgba(100, 150, 255, 0.6)` | Focus states, ambient glow |
| `flare-red` | `#ff4d4d` | High FFN energy |
| `flare-gold` | `#ffcc66` | Medium FFN energy |
| `beam-violet` | `rgba(180, 120, 255, 0.4)` | Weak attention |
| `beam-white` | `rgba(255, 255, 255, 0.9)` | Strong attention |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `font-primary` | `Inter` or `Space Grotesk`, weight 300 | Input text, UI chrome |
| `font-size-input` | `24px` desktop / `18px` mobile | Prompt input |
| `font-size-label` | `11px` | Ignite button, status text |
| `letter-spacing-wide` | `0.15em` | Uppercase labels |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `input-glow-radius` | `20px` | Text shadow blur |
| `focus-ring-width` | `2px` | Input focus outline |
| `focus-ring-offset` | `4px` | Input focus outline offset |
| `ignite-size` | `32px` | Ignite button diameter |
| `touch-min` | `44px` | Minimum touch target |

### Animation Timing

| Token | Value | Usage |
|-------|-------|-------|
| `caret-breathe` | `1.5s ease-in-out infinite` | Caret pulse |
| `particle-fade` | `600ms` | Keystroke particle lifetime |
| `input-dissolve` | `800ms` | Submit text dissolve |
| `void-return` | `1500ms` | Post-journey input reappear |
| `camera-recover` | `2000ms` | Release-to-spline interpolation |
| `journey-hold` | `3000ms` | Final state dwell before return |

---

## 8. Open Questions

1. **Model selection:** Final decision on exact model (distilled GPT-2, TinyLlama, or custom-trained micro-model) pending prototype inference speed testing.
2. **Tokenizer:** Will use the model's native tokenizer (BPE or SentencePiece), wrapped in a lightweight WASM module.
3. **Activation hook mechanism:** Exact ONNX Runtime Web API for extracting intermediate activations to be validated during prototyping.

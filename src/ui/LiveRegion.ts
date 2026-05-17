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

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

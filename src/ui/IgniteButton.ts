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

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
    this.el.setAttribute('role', 'alertdialog');
    this.el.setAttribute('aria-modal', 'true');

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
        this.retryBtn.focus();
      }
    });
  }

  destroy() {
    this.unsubscribe();
    this.el.remove();
  }
}

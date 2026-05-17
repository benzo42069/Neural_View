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

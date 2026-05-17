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

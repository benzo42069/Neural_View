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

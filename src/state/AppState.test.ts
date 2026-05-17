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

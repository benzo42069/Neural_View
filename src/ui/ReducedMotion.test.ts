import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReducedMotion } from './ReducedMotion';

describe('ReducedMotion', () => {
  beforeEach(() => { document.body.innerHTML = '<div id="ui-layer"></div>'; });

  it('detects initial reduced motion preference', () => {
    const rm = new ReducedMotion();
    expect(typeof rm.reduced).toBe('boolean');
    rm.destroy();
  });

  it('calls subscriber with initial value', () => {
    const rm = new ReducedMotion();
    const fn = vi.fn();
    rm.subscribe(fn);
    expect(fn).toHaveBeenCalledWith(rm.reduced);
    rm.destroy();
  });

  it('unsubscribe removes listener', () => {
    const rm = new ReducedMotion();
    const fn = vi.fn();
    const unsub = rm.subscribe(fn);
    unsub();
    expect(rm['listeners']).toHaveLength(0);
    rm.destroy();
  });
});

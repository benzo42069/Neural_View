import { describe, it, expect } from 'vitest';
import { attentionToColor, ffnToColor, hueForToken } from './color';

describe('color', () => {
  it('maps attention 0 to violet', () => {
    const c = attentionToColor(0);
    expect(c.r).toBeGreaterThan(0.6);
    expect(c.b).toBeGreaterThan(0.9);
  });

  it('maps attention 1 to white', () => {
    const c = attentionToColor(1);
    expect(c.r).toBe(1);
    expect(c.g).toBe(1);
    expect(c.b).toBe(1);
  });

  it('gives consistent hue for same token index', () => {
    expect(hueForToken(0)).toBe(hueForToken(0));
    expect(hueForToken(0)).not.toBe(hueForToken(1));
  });
});

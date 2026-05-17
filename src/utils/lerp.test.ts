import { describe, it, expect } from 'vitest';
import { lerp, damp } from './lerp';

describe('lerp', () => {
  it('interpolates between two scalars', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('damps toward target', () => {
    expect(damp(0, 10, 0.5, 1)).toBeCloseTo(3.935, 2);
  });
});

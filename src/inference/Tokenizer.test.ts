import { describe, it, expect } from 'vitest';
import { SimpleTokenizer } from './Tokenizer';

describe('SimpleTokenizer', () => {
  it('encodes and decodes roundtrip', () => {
    const tok = new SimpleTokenizer({ hello: 1, world: 2, ' ': 3 });
    const ids = tok.encode('hello world');
    expect(ids).toEqual([1, 3, 2]);
    expect(tok.decode(ids)).toBe('hello world');
  });

  it('handles unknown chars with UNK token', () => {
    const tok = new SimpleTokenizer({ a: 1 }, { unkId: 99 });
    expect(tok.encode('ab')).toEqual([1, 99]);
  });
});

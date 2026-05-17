interface TokenizerConfig {
  unkId?: number;
}

export class SimpleTokenizer {
  private vocab: Map<string, number>;
  private reverseVocab: Map<number, string>;
  private unkId: number;

  constructor(vocabJson: Record<string, number>, config: TokenizerConfig = {}) {
    this.vocab = new Map(Object.entries(vocabJson));
    this.reverseVocab = new Map();
    for (const [token, id] of this.vocab) {
      this.reverseVocab.set(id, token);
    }
    this.unkId = config.unkId ?? 0;
  }

  encode(text: string): number[] {
    const tokens: number[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      let matched = false;
      for (let len = remaining.length; len > 0; len--) {
        const sub = remaining.slice(0, len);
        if (this.vocab.has(sub)) {
          tokens.push(this.vocab.get(sub)!);
          remaining = remaining.slice(len);
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push(this.unkId);
        remaining = remaining.slice(1);
      }
    }
    return tokens;
  }

  decode(ids: number[]): string {
    return ids.map(id => this.reverseVocab.get(id) ?? '\uFFFD').join('');
  }
}

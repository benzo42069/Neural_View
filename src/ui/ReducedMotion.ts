export class ReducedMotion {
  private mq: MediaQueryList;
  private _reduced = false;
  private listeners: ((reduced: boolean) => void)[] = [];
  private onChange: (e: MediaQueryListEvent) => void;

  constructor() {
    this.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reduced = this.mq.matches;
    this.onChange = (e: MediaQueryListEvent) => {
      this._reduced = e.matches;
      this.listeners.forEach(l => l(this._reduced));
    };
    this.mq.addEventListener('change', this.onChange);
  }

  get reduced() { return this._reduced; }

  subscribe(fn: (reduced: boolean) => void): () => void {
    this.listeners.push(fn);
    fn(this._reduced);
    return () => {
      const idx = this.listeners.indexOf(fn);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  destroy() {
    this.mq.removeEventListener('change', this.onChange);
    this.listeners = [];
  }
}

export class ReducedMotion {
  private mq: MediaQueryList;
  private _reduced = false;
  private listeners: ((reduced: boolean) => void)[] = [];

  constructor() {
    this.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reduced = this.mq.matches;
    this.mq.addEventListener('change', (e) => {
      this._reduced = e.matches;
      this.listeners.forEach(l => l(this._reduced));
    });
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
}

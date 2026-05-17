import type { AppPhase, AppStateSnapshot, StateListener, ActivationSummary } from './types';

export class AppState {
  private _phase: AppPhase = 'VOID';
  private _prompt = '';
  private _isLoadingModel = false;
  private _modelReady = false;
  private _error: string | null = null;
  private _journeyProgress = 0;
  private _listeners: StateListener[] = [];

  get phase() { return this._phase; }
  get prompt() { return this._prompt; }
  get isLoadingModel() { return this._isLoadingModel; }
  get modelReady() { return this._modelReady; }
  get error() { return this._error; }
  get journeyProgress() { return this._journeyProgress; }

  subscribe(listener: StateListener): () => void {
    this._listeners.push(listener);
    listener(this.snapshot);
    return () => {
      const idx = this._listeners.indexOf(listener);
      if (idx !== -1) this._listeners.splice(idx, 1);
    };
  }

  private notify() {
    const snap = this.snapshot;
    this._listeners.forEach(l => l(snap));
  }

  get snapshot(): AppStateSnapshot {
    return {
      phase: this._phase,
      prompt: this._prompt,
      isLoadingModel: this._isLoadingModel,
      modelReady: this._modelReady,
      error: this._error,
      journeyProgress: this._journeyProgress,
    };
  }

  focus() {
    if (this._phase === 'VOID') {
      this._phase = 'INVOCATION';
      this.notify();
    }
  }

  blur() {
    if (this._phase === 'INVOCATION' && this._prompt.trim() === '') {
      this._phase = 'VOID';
      this.notify();
    }
  }

  type(value: string) {
    this._prompt = value;
    this.notify();
  }

  submit(prompt: string) {
    const trimmed = prompt.trim();
    if (trimmed === '') return;
    this._prompt = trimmed;
    this._phase = 'JOURNEY';
    this._journeyProgress = 0;
    this.notify();
  }

  setJourneyProgress(p: number) {
    this._journeyProgress = Math.max(0, Math.min(1, p));
    this.notify();
  }

  complete() {
    this._phase = 'VOID';
    this._prompt = '';
    this._journeyProgress = 0;
    this.notify();
  }

  cancel() {
    this._phase = 'VOID';
    this._prompt = '';
    this._journeyProgress = 0;
    this.notify();
  }

  setModelLoading(v: boolean) {
    this._isLoadingModel = v;
    this.notify();
  }

  setModelReady(v: boolean) {
    this._modelReady = v;
    this._isLoadingModel = false;
    this.notify();
  }

  setError(e: string | null) {
    this._error = e;
    this.notify();
  }
}

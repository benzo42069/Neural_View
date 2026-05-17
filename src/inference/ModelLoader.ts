const CACHE_NAME = 'neural-galaxy-model-v1';
const MODEL_URL = '/model/model.onnx';

export class ModelLoader {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(CACHE_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onupgradeneeded = () => {
        req.result.createObjectStore('models');
      };
    });
  }

  async load(progressCallback?: (p: number) => void): Promise<ArrayBuffer> {
    await this.initDB();

    const cached = await this.getFromCache('weights');
    if (cached) {
      progressCallback?.(1);
      return cached;
    }

    const response = await fetch(MODEL_URL);
    const contentLength = +(response.headers.get('Content-Length') ?? 0);
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (contentLength) {
        progressCallback?.(received / contentLength);
      }
    }

    const all = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      all.set(chunk, offset);
      offset += chunk.length;
    }

    await this.saveToCache('weights', all.buffer);
    progressCallback?.(1);
    return all.buffer;
  }

  private getFromCache(key: string): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction('models', 'readonly');
      const store = tx.objectStore('models');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  private saveToCache(key: string, data: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('models', 'readwrite');
      const store = tx.objectStore('models');
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

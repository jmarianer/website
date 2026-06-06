import type { SolveProgress, SolveResult } from '../core/solver.js';
import type { SolveRequest, SolveResponse } from './solver.worker.js';

export type SolveHandlers = {
  onProgress?: (p: SolveProgress) => void;
  onResult: (r: SolveResult) => void;
  onError: (msg: string) => void;
};

export class SolverClient {
  private worker: Worker | null = null;

  solve(input: string, handlers: SolveHandlers): void {
    this.cancel();
    const worker = new Worker(
      new URL('./solver.worker.ts', import.meta.url),
      { type: 'module' },
    );
    this.worker = worker;
    worker.addEventListener('message', (event: MessageEvent<SolveResponse>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'progress':
          handlers.onProgress?.(msg.progress);
          break;
        case 'result':
          handlers.onResult(msg.result);
          this.terminate();
          break;
        case 'error':
          handlers.onError(msg.error);
          this.terminate();
          break;
      }
    });
    const req: SolveRequest = { input };
    worker.postMessage(req);
  }

  cancel(): void {
    this.terminate();
  }

  private terminate(): void {
    if (this.worker !== null) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

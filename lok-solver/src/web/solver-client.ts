import type { SolveProgress, SolveResult } from '../core/solver.js';
import { Grid } from '../core/types.js';
import type { SolveRequest, SolveResponse } from './solver.worker.js';

export type SolveHandlers = {
  onProgress?: (p: SolveProgress) => void;
  onResult: (r: SolveResult) => void;
  onError: (msg: string) => void;
};

export class SolverClient {
  private worker: Worker | null = null;

  solve(grid: Grid, handlers: SolveHandlers): void {
    this.cancel();
    this.worker = new Worker(
      new URL('./solver.worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.worker.addEventListener('message', (event: MessageEvent<SolveResponse>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'progress':
          handlers.onProgress?.(msg.progress);
          break;
        case 'result':
          handlers.onResult(msg.result);
          this.cancel();
          break;
        case 'error':
          handlers.onError(msg.error);
          this.cancel();
          break;
      }
    });
    this.worker.postMessage({ grid } satisfies SolveRequest);
  }

  cancel(): void {
    if (this.worker !== null) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

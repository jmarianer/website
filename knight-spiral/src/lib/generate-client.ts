import type { PlacedPiece } from './generate';
import type { GenerateRequest, GenerateResponse } from './generate.worker';

export type GenerationHandlers = {
  onBatch: (batch: PlacedPiece[]) => void;
  onDone: () => void;
};

/** Runs generation in a worker so a large piece count doesn't freeze the UI. */
export class GenerationClient {
  private worker: Worker | null = null;

  generate(request: GenerateRequest, handlers: GenerationHandlers): void {
    this.cancel();
    this.worker = new Worker(new URL('./generate.worker.ts', import.meta.url), {
      type: 'module'
    });
    this.worker.addEventListener('message', (event: MessageEvent<GenerateResponse>) => {
      if (event.data.type === 'batch') {
        handlers.onBatch(event.data.placements);
      } else {
        handlers.onDone();
        this.cancel();
      }
    });
    this.worker.postMessage(request);
  }

  cancel(): void {
    if (this.worker !== null) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

/// <reference lib="webworker" />

import { solve, type SolveProgress, type SolveResult } from '../core/solver.js';
import { Grid } from '../core/types.js';

export type SolveRequest = { grid: Grid };

export type SolveResponse =
  | { type: 'progress'; progress: SolveProgress }
  | { type: 'result'; result: SolveResult }
  | { type: 'error'; error: string };

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<SolveRequest>) => {
  const { grid } = event.data;
  try {
    const result = solve(grid, {
      onProgress: (progress) => self.postMessage({ type: 'progress', progress } satisfies SolveResponse),
    });
    self.postMessage({ type: 'result', result } satisfies SolveResponse);
  } catch (err) {
    self.postMessage({ type: 'error', error: (err as Error).message } satisfies SolveResponse);
  }
});

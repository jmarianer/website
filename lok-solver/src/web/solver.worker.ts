/// <reference lib="webworker" />

import { parseGrid } from '../core/grid.js';
import { solve, type SolveProgress, type SolveResult } from '../core/solver.js';

export type SolveRequest = { input: string };

export type SolveResponse =
  | { type: 'progress'; progress: SolveProgress }
  | { type: 'result'; result: SolveResult }
  | { type: 'error'; error: string };

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<SolveRequest>) => {
  const { input } = event.data;
  try {
    const grid = parseGrid(input);
    const result = solve(grid, {
      onProgress: (progress) => self.postMessage({ type: 'progress', progress } satisfies SolveResponse),
    });
    self.postMessage({ type: 'result', result } satisfies SolveResponse);
  } catch (err) {
    self.postMessage({ type: 'error', error: (err as Error).message } satisfies SolveResponse);
  }
});

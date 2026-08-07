/// <reference lib="webworker" />

import { generatePlacements, type PlacedPiece } from './generate';
import type { Offset } from './leaper';
import { GENERATION_MIN_BATCH_SIZE, GENERATION_TARGET_BATCH_COUNT } from './constants';

export type GenerateRequest = { offsetsByColor: Offset[]; pieceCount: number };

export type GenerateResponse = { type: 'batch'; placements: PlacedPiece[] } | { type: 'done' };

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateRequest>) => {
  const { offsetsByColor, pieceCount } = event.data;
  const batchSize = Math.max(
    GENERATION_MIN_BATCH_SIZE,
    Math.ceil(pieceCount / GENERATION_TARGET_BATCH_COUNT)
  );

  generatePlacements(
    offsetsByColor,
    pieceCount,
    (batch) => self.postMessage({ type: 'batch', placements: batch } satisfies GenerateResponse),
    batchSize
  );

  self.postMessage({ type: 'done' } satisfies GenerateResponse);
});

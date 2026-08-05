/// <reference lib="webworker" />

import { generatePlacements, type PlacedPiece } from './generate';
import { GENERATION_MIN_BATCH_SIZE, GENERATION_TARGET_BATCH_COUNT } from './constants';

export type GenerateRequest = { colorCount: number; pieceCount: number };

export type GenerateResponse = { type: 'batch'; placements: PlacedPiece[] } | { type: 'done' };

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateRequest>) => {
	const { colorCount, pieceCount } = event.data;
	const batchSize = Math.max(
		GENERATION_MIN_BATCH_SIZE,
		Math.ceil(pieceCount / GENERATION_TARGET_BATCH_COUNT)
	);

	generatePlacements(
		colorCount,
		pieceCount,
		undefined,
		(batch) => self.postMessage({ type: 'batch', placements: batch } satisfies GenerateResponse),
		batchSize
	);

	self.postMessage({ type: 'done' } satisfies GenerateResponse);
});

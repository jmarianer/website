/// <reference lib="webworker" />

import { generatePlacements, type PlacedPiece } from './generate';
import { GENERATION_BATCH_SIZE } from './constants';

export type GenerateRequest = { colorCount: number; pieceCount: number };

export type GenerateResponse = { type: 'batch'; placements: PlacedPiece[] } | { type: 'done' };

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<GenerateRequest>) => {
	const { colorCount, pieceCount } = event.data;

	generatePlacements(
		colorCount,
		pieceCount,
		undefined,
		(batch) => self.postMessage({ type: 'batch', placements: batch } satisfies GenerateResponse),
		GENERATION_BATCH_SIZE
	);

	self.postMessage({ type: 'done' } satisfies GenerateResponse);
});

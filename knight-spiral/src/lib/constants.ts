import type { Offset } from './leaper';

export const MIN_COLOR_COUNT = 2;
export const MAX_COLOR_COUNT = 8;
export const DEFAULT_COLOR_COUNT = 2;

/** Knight: the only piece type available in v1. */
export const KNIGHT_OFFSET: Offset = { a: 1, b: 2 };

/**
 * Total pieces generated, split round-robin across colors, regardless of
 * color count. Deliberately still a fixed budget rather than a UI
 * parameter — generation runs in a worker (generate.worker.ts) with
 * per-color search pointers, so this can be raised further if 50k pieces
 * ever stops being enough picture.
 */
export const MAX_TOTAL_PIECES = 1_000_000;

/**
 * Batch size floor for streaming progress: below this piece count, batches
 * are exactly this size. Above it, batch size scales up with pieceCount
 * (see generate.worker.ts) so the number of batches — and therefore the
 * main thread's total accumulation/redraw work — stays roughly constant
 * instead of growing with piece count.
 */
export const GENERATION_MIN_BATCH_SIZE = 500;

/** Target number of progress batches per generation, at any piece count. */
export const GENERATION_TARGET_BATCH_COUNT = 50;

export const COLOR_PALETTE = [
	'#1a1a1a', // black
	'#c0392b', // red
	'#2d6cdf', // blue
	'#1f8a5b', // green
	'#c9962c', // gold
	'#8e44ad', // purple
	'#17a2a2', // teal
	'#d9720c' // orange
];

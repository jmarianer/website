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
export const MAX_TOTAL_PIECES = 50_000;

/** How many placements the worker streams back per progress message. */
export const GENERATION_BATCH_SIZE = 500;

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

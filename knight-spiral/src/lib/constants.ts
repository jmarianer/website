import type { Offset } from './leaper';

export const MIN_COLOR_COUNT = 2;
export const MAX_COLOR_COUNT = 8;
export const DEFAULT_COLOR_COUNT = 2;

/** Knight: the only piece type available in v1. */
export const KNIGHT_OFFSET: Offset = { a: 1, b: 2 };

/**
 * Total pieces generated, split round-robin across colors, regardless of
 * color count. v1 keeps this a fixed budget rather than exposing it as a
 * parameter — the generator rescans from scratch on every placement, so
 * pushing this much higher will get noticeably slower before it gets
 * incorrect. If that becomes the seam to widen, switch generate.ts from a
 * full rescan to per-color monotonic search pointers (attack/occupancy
 * status only ever gets stricter, never loosens, so a pointer never needs
 * to rewind) before raising this.
 */
export const MAX_TOTAL_PIECES = 300;

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

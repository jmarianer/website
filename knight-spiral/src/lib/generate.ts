import { SpiralCache } from './spiral';
import { leaperAttackOffsets, type Offset } from './leaper';
import { KNIGHT_OFFSET } from './constants';

export interface PlacedPiece {
	index: number;
	x: number;
	y: number;
	color: number;
}

/**
 * Backstop against runaway search in a configuration that can never find a
 * legal cell. Should never be hit in practice: leaper attacks are local, so
 * an infinite board always has free space arbitrarily far out.
 */
const SAFETY_INDEX_LIMIT = 10_000_000;

/**
 * Places `pieceCount` pieces round-robin across `colorCount` colors,
 * starting with color 0 at the spiral's origin. Each subsequent piece goes
 * on the lowest-indexed spiral cell that is unoccupied and unattacked by
 * any piece of a different color.
 *
 * Each color tracks its own search pointer rather than rescanning from
 * index 0 every time: a cell's validity for a given color only ever gets
 * stricter over time (occupancy and attacks accumulate, never clear), so
 * once a color's pointer has passed a cell, that cell can never become
 * valid for it later. This keeps total work roughly linear in the spiral
 * range reached instead of quadratic in piece count.
 *
 * If `onBatch` is given, it's called with each newly placed chunk (size
 * `batchSize`) as it's produced, in addition to the full result being
 * returned at the end — lets a caller (e.g. a worker) stream progress.
 */
export function generatePlacements(
	colorCount: number,
	pieceCount: number,
	offsetsByColor: Offset[] = Array.from({ length: colorCount }, () => KNIGHT_OFFSET),
	onBatch?: (batch: PlacedPiece[]) => void,
	batchSize = 500
): PlacedPiece[] {
	const spiral = new SpiralCache();
	const attackVectorsByColor = offsetsByColor.map(leaperAttackOffsets);

	const occupied = new Set<string>();
	const attackedByColor: Set<string>[] = Array.from({ length: colorCount }, () => new Set());
	const nextIndexByColor: number[] = new Array(colorCount).fill(0);

	const placements: PlacedPiece[] = [];
	let pendingBatch: PlacedPiece[] = [];

	for (let i = 0; i < pieceCount; i++) {
		const color = i % colorCount;

		let idx = nextIndexByColor[color];
		let cell = spiral.at(idx);
		let key = `${cell.x},${cell.y}`;
		while (
			occupied.has(key) ||
			attackedByColor.some((attacked, c) => c !== color && attacked.has(key))
		) {
			if (idx > SAFETY_INDEX_LIMIT) {
				throw new Error(
					`No legal cell found for color ${color} within ${SAFETY_INDEX_LIMIT} cells`
				);
			}
			idx++;
			cell = spiral.at(idx);
			key = `${cell.x},${cell.y}`;
		}

		occupied.add(key);
		for (const { a, b } of attackVectorsByColor[color]) {
			attackedByColor[color].add(`${cell.x + a},${cell.y + b}`);
		}
		nextIndexByColor[color] = idx + 1;

		const piece: PlacedPiece = { index: idx, x: cell.x, y: cell.y, color };
		placements.push(piece);

		if (onBatch) {
			pendingBatch.push(piece);
			if (pendingBatch.length >= batchSize) {
				onBatch(pendingBatch);
				pendingBatch = [];
			}
		}
	}

	if (onBatch && pendingBatch.length > 0) onBatch(pendingBatch);

	return placements;
}

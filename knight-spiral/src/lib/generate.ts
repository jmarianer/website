import { generateSpiral } from './spiral';
import { leaperAttackOffsets, type Offset } from './leaper';
import { KNIGHT_OFFSET, MAX_TOTAL_PIECES } from './constants';

export interface PlacedPiece {
	index: number;
	x: number;
	y: number;
	color: number;
}

/** How far out the spiral is walked looking for a free, unattacked cell. */
const SPIRAL_SEARCH_SPACE = 20000;

/**
 * Places `pieceCount` pieces round-robin across `colorCount` colors,
 * starting with color 0 at the spiral's origin. Each subsequent piece goes
 * on the lowest-indexed spiral cell that is unoccupied and unattacked by
 * any piece of a different color.
 */
export function generatePlacements(
	colorCount: number,
	pieceCount: number = MAX_TOTAL_PIECES,
	offsetsByColor: Offset[] = Array.from({ length: colorCount }, () => KNIGHT_OFFSET)
): PlacedPiece[] {
	const spiral = generateSpiral(SPIRAL_SEARCH_SPACE);
	const attackVectorsByColor = offsetsByColor.map(leaperAttackOffsets);

	const occupied = new Set<string>();
	const attackedByColor: Set<string>[] = Array.from({ length: colorCount }, () => new Set());

	const placements: PlacedPiece[] = [];

	for (let i = 0; i < pieceCount; i++) {
		const color = i % colorCount;

		const spiralIndex = spiral.findIndex(({ x, y }) => {
			const key = `${x},${y}`;
			if (occupied.has(key)) return false;
			for (let c = 0; c < colorCount; c++) {
				if (c !== color && attackedByColor[c].has(key)) return false;
			}
			return true;
		});

		if (spiralIndex === -1) {
			throw new Error(
				`Exhausted spiral search space (${SPIRAL_SEARCH_SPACE} cells) placing piece ${i}`
			);
		}

		const { x, y } = spiral[spiralIndex];
		const key = `${x},${y}`;
		occupied.add(key);
		for (const { a, b } of attackVectorsByColor[color]) {
			attackedByColor[color].add(`${x + a},${y + b}`);
		}

		placements.push({ index: spiralIndex, x, y, color });
	}

	return placements;
}

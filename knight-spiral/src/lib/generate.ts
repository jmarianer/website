import { SpiralCache } from './spiral';
import { leaperAttackOffsets, type Offset } from './leaper';

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
 * Encodes a cell as a single number instead of a "x,y" template-string key.
 * Avoids a string allocation on every candidate cell checked (millions of
 * times at large piece counts) and Map/Set lookups on numbers are faster
 * than on strings. Safe for coordinates well beyond anything this board
 * will reach: 1e6 is already ~1000x the spiral radius needed for tens of
 * millions of pieces.
 */
const KEY_COORD_OFFSET = 1_000_000;
function cellKey(x: number, y: number): number {
  return (x + KEY_COORD_OFFSET) * (2 * KEY_COORD_OFFSET) + (y + KEY_COORD_OFFSET);
}

/**
 * Places `pieceCount` pieces round-robin across the colors implied by
 * `offsetsByColor` (one leaper offset per color; its length is the color
 * count), starting with color 0 at the spiral's origin. Each subsequent
 * piece goes on the lowest-indexed spiral cell that is unoccupied and
 * unattacked by any piece of a different color.
 *
 * Each color tracks its own search pointer rather than rescanning from
 * index 0 every time: a cell's validity for a given color only ever gets
 * stricter over time (occupancy and attacks accumulate, never clear), so
 * once a color's pointer has passed a cell, that cell can never become
 * valid for it later. This keeps total work roughly linear in the spiral
 * range reached instead of quadratic in piece count.
 *
 * Which colors attack a cell is tracked as a bitmask (one Map lookup) rather
 * than a Set per color (up to `colorCount` lookups) — matters most at high
 * color counts, where the naive version's per-candidate cost scales with
 * colorCount on top of the search itself.
 *
 * If `onBatch` is given, it's called with each newly placed chunk (size
 * `batchSize`) as it's produced, in addition to the full result being
 * returned at the end — lets a caller (e.g. a worker) stream progress.
 */
export function generatePlacements(
  offsetsByColor: Offset[],
  pieceCount: number,
  onBatch?: (batch: PlacedPiece[]) => void,
  batchSize = 500
): PlacedPiece[] {
  const colorCount = offsetsByColor.length;
  const spiral = new SpiralCache();
  const attackVectorsByColor = offsetsByColor.map(leaperAttackOffsets);

  const occupied = new Set<number>();
  const attackMask = new Map<number, number>(); // bitmask of colors attacking each cell
  const nextIndexByColor: number[] = new Array(colorCount).fill(0);

  const placements: PlacedPiece[] = [];
  let pendingBatch: PlacedPiece[] = [];

  for (let i = 0; i < pieceCount; i++) {
    const color = i % colorCount;
    const colorBit = 1 << color;

    let idx = nextIndexByColor[color];
    let cell = spiral.at(idx);
    let key = cellKey(cell.x, cell.y);
    while (occupied.has(key) || ((attackMask.get(key) ?? 0) & ~colorBit) !== 0) {
      if (idx > SAFETY_INDEX_LIMIT) {
        throw new Error(
          `No legal cell found for color ${color} within ${SAFETY_INDEX_LIMIT} cells`
        );
      }
      idx++;
      cell = spiral.at(idx);
      key = cellKey(cell.x, cell.y);
    }

    occupied.add(key);
    for (const { a, b } of attackVectorsByColor[color]) {
      const attackedKey = cellKey(cell.x + a, cell.y + b);
      attackMask.set(attackedKey, (attackMask.get(attackedKey) ?? 0) | colorBit);
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

import { applyMove } from '../core/apply.js';
import type { Coord, Grid, Move } from '../core/types.js';

/** A solved puzzle: the starting grid plus the sequence of moves that wins it. */
export type Solution = { initialGrid: Grid; moves: Move[] };

/**
 * Reconstruct the grid as it should be drawn at a given playback position.
 *
 * When settled, `animProgress` is null and we simply replay `step` moves.
 * While animating move N, callers pass `step = N + 1` and a non-null
 * `animProgress`: we replay the first N moves, then blacken the first
 * `animProgress + 1` cells of move N's route to show the cursor sweeping it.
 * Once the target burst passes its midpoint, callers set `targetApplied` and
 * the move's target effect lands on top of the swept route.
 */
export function replayTo(
  solution: Solution,
  step: number,
  animProgress: number | null,
  targetApplied = false
): Grid {
  const baseStep = animProgress !== null ? step - 1 : step;
  let g = solution.initialGrid;
  for (let i = 0; i < baseStep; i++) g = applyMove(g, solution.moves[i]!);

  if (animProgress !== null) {
    // The route is fully swept by burst time, so the full move is equivalent.
    if (targetApplied) return applyMove(g, solution.moves[step - 1]!);
    const move = solution.moves[step - 1]!;
    const newCells = g.cells.map((row) => [...row]);
    for (let i = 0; i <= animProgress; i++) {
      const p = move.route[i]!;
      const cell = newCells[p.r]![p.c]!;
      if (cell === null || cell.sym === 'X') continue;
      newCells[p.r]![p.c] = { sym: cell.sym, col: 'B' };
    }
    return { ...g, cells: newCells };
  }

  return g;
}

/**
 * The cells a move changes beyond its route — where the target burst plays.
 * `grid` must be the pre-effect state (route already swept), since TA's
 * matches are whichever cells with the symbol are still white at that point.
 */
export function effectCells(grid: Grid, move: Move): Coord[] {
  switch (move.word) {
    case 'LOK':
      return [move.target];
    case 'TLAK':
      return [move.first, move.second];
    case 'TA': {
      const coords: Coord[] = [];
      grid.cells.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell !== null && cell.col === 'W' && cell.sym === move.symbol) coords.push({ r, c });
        })
      );
      return coords;
    }
    case 'BE':
      return [move.star];
  }
}

/** Human-readable one-line summary of a move. */
export function describeMove(m: Move): string {
  switch (m.word) {
    case 'LOK':
      return `LOK · target (${m.target.r},${m.target.c})`;
    case 'TLAK':
      return `TLAK · targets (${m.first.r},${m.first.c}) → (${m.second.r},${m.second.c})`;
    case 'TA':
      return `TA · symbol ${m.symbol}`;
    case 'BE':
      return `BE · (${m.star.r},${m.star.c}) → ${m.newLetter}`;
  }
}

// Pixel geometry — must match the CSS for .grid / .cell / .label in App.svelte.
export const CELL_SIZE = 32; // 2rem
export const CELL_GAP = 1;
export const LABEL_SIZE = 24; // 1.5rem
export const GRID_INSET = 2 + 1; // border (2px) + padding (1px)

export function cellCenter(r: number, c: number): { x: number; y: number } {
  return {
    x: GRID_INSET + LABEL_SIZE + CELL_GAP + c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    y: GRID_INSET + LABEL_SIZE + CELL_GAP + r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2
  };
}

/**
 * Build the SVG polyline `points` string for a route drawn up to a continuous
 * fraction. `lineFraction` semantics:
 *   -1        = pre-roll wait (no line)
 *    0        = cursor at route[0] (single dot)
 *    K        = cursor at route[K]
 *    K + frac = cursor `frac` of the way from route[K] toward route[K+1]
 */
export function routePoints(route: Coord[], lineFraction: number): string {
  if (lineFraction < 0) return '';
  const completed = Math.floor(lineFraction);
  const partial = lineFraction - completed;
  const pts: { x: number; y: number }[] = [];
  const lastFull = Math.min(completed, route.length - 1);
  for (let i = 0; i <= lastFull; i++) {
    pts.push(cellCenter(route[i]!.r, route[i]!.c));
  }
  // Partial segment from the last full point toward the next cell.
  if (completed + 1 < route.length && partial > 0) {
    const a = pts[pts.length - 1]!;
    const next = cellCenter(route[completed + 1]!.r, route[completed + 1]!.c);
    pts.push({
      x: a.x + (next.x - a.x) * partial,
      y: a.y + (next.y - a.y) * partial
    });
  }
  if (pts.length === 0) return '';
  // Duplicate the point so stroke-linecap=round renders a visible dot for length-1 routes.
  if (pts.length === 1) {
    const p = pts[0]!;
    return `${p.x},${p.y} ${p.x},${p.y}`;
  }
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

export type Segment = { x1: number; y1: number; x2: number; y2: number };

const BURST_SPOKES = 8;

/**
 * Line segments radiating out from a cell center for the target burst.
 * As `fraction` runs 0..1 the spokes travel from just inside the cell edge
 * to past it, staying short so they read as sparks jumping outward.
 */
export function burstSegments(center: { x: number; y: number }, fraction: number): Segment[] {
  const inner = 6 + fraction * 22;
  const outer = 12 + fraction * 26;
  const segs: Segment[] = [];
  for (let i = 0; i < BURST_SPOKES; i++) {
    // Offset by half a spoke so no spoke overlaps the route line's grid axes.
    const angle = ((i + 0.5) / BURST_SPOKES) * 2 * Math.PI;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    segs.push({
      x1: center.x + dx * inner,
      y1: center.y + dy * inner,
      x2: center.x + dx * outer,
      y2: center.y + dy * outer
    });
  }
  return segs;
}

import { describe, expect, it } from 'vitest';
import { parseGrid, formatGrid } from '../../src/core/grid.js';
import { solve } from '../../src/core/solver.js';
import type { Move } from '../../src/core/types.js';
import {
  cellCenter,
  describeMove,
  replayTo,
  routePoints,
  type Solution
} from '../../src/web/render.js';

function solutionFor(text: string): Solution {
  const result = solve(parseGrid(text));
  if (result === null) throw new Error(`unsolvable: ${text}`);
  return result;
}

describe('replayTo', () => {
  it('returns the untouched initial grid at step 0', () => {
    const sol = solutionFor('LOK*');
    expect(formatGrid(replayTo(sol, 0, null))).toBe(formatGrid(sol.initialGrid));
  });

  it('applies every move when settled at the final step', () => {
    const sol = solutionFor('LOK*');
    const won = formatGrid(replayTo(sol, sol.moves.length, null));
    expect(won).toMatch(/^[a-z. \n]*$/); // fully blackened: no uppercase, no white *
  });

  it('blackens the route incrementally while animating a move', () => {
    const sol = solutionFor('LOK*');
    // Animating move 0 (step = 1). animProgress = -1 is pre-roll: nothing blackened yet.
    expect(formatGrid(replayTo(sol, 1, -1))).toBe(formatGrid(sol.initialGrid));
    // Sweeping cell 0 of the route blackens exactly that cell, leaving the rest white.
    const afterFirstCell = formatGrid(replayTo(sol, 1, 0));
    expect(afterFirstCell).not.toBe(formatGrid(sol.initialGrid));
    expect(afterFirstCell.match(/[a-z]/g)?.length ?? 0).toBe(1);
  });
});

describe('describeMove', () => {
  it('summarises each word form', () => {
    expect(describeMove({ word: 'LOK', route: [], target: { r: 1, c: 2 } })).toBe(
      'LOK · target (1,2)'
    );
    expect(describeMove({ word: 'TA', route: [], symbol: 'T' })).toBe('TA · symbol T');
    expect(describeMove({ word: 'BE', route: [], star: { r: 0, c: 0 }, newLetter: 'L' })).toBe(
      'BE · (0,0) → L'
    );
    const tlak: Move = {
      word: 'TLAK',
      route: [],
      first: { r: 0, c: 0 },
      direction: 'E',
      second: { r: 0, c: 3 }
    };
    expect(describeMove(tlak)).toBe('TLAK · targets (0,0) → (0,3)');
  });
});

describe('routePoints', () => {
  const route = [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
    { r: 0, c: 2 }
  ];

  it('draws nothing during the pre-roll wait', () => {
    expect(routePoints(route, -1)).toBe('');
  });

  it('draws a degenerate dot at the start (fraction 0)', () => {
    const c0 = cellCenter(0, 0);
    expect(routePoints(route, 0)).toBe(`${c0.x},${c0.y} ${c0.x},${c0.y}`);
  });

  it('connects completed cells with a polyline', () => {
    const pts = routePoints(route, 2).split(' ');
    expect(pts).toHaveLength(3);
  });

  it('interpolates a partial segment between cells', () => {
    const a = cellCenter(0, 0);
    const b = cellCenter(0, 1);
    const midX = a.x + (b.x - a.x) * 0.5;
    expect(routePoints(route, 0.5)).toContain(`${midX},`);
  });
});

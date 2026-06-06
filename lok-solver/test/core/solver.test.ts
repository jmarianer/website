import { describe, expect, it } from 'vitest';
import { parseGrid, formatGrid } from '../../src/core/grid.js';
import { solve, type SolveProgress } from '../../src/core/solver.js';
import { applyMove } from '../../src/core/apply.js';
import type { Grid, Move } from '../../src/core/types.js';

function replay(initial: Grid, moves: Move[]): Grid {
  return moves.reduce((grid, move) => applyMove(grid, move), initial);
}

function expectWon(g: Grid): void {
  const text = formatGrid(g);
  expect(text).toMatch(/^[a-z. \n]*$/); // no uppercase, no *
}

describe('solve', () => {
  it('returns zero moves on an already-won grid', () => {
    const grid = parseGrid('lok');
    const result = solve(grid);
    expect(result).not.toBeNull();
    expect(result!.moves).toEqual([]);
  });

  it('solves LOK* in one LOK move', () => {
    const grid = parseGrid('LOK*');
    const result = solve(grid);
    expect(result).not.toBeNull();
    expect(result!.moves).toHaveLength(1);
    expect(result!.moves[0]!.word).toBe('LOK');
    expectWon(replay(grid, result!.moves));
  });

  it('solves TATT in one TA move', () => {
    const grid = parseGrid('TATT');
    const result = solve(grid);
    expect(result).not.toBeNull();
    expect(result!.moves).toHaveLength(1);
    expect(result!.moves[0]!.word).toBe('TA');
    expectWon(replay(grid, result!.moves));
  });

  it('returns null on an unsolvable puzzle', () => {
    // LOK*M -- after 1 LOK we have 1 white cell left, no second word possible.
    const grid = parseGrid('LOK*M');
    expect(solve(grid)).toBeNull();
  });

  it('solves a puzzle that requires BE to write a missing letter', () => {
    // BE*OK*: only way is BE -> write * as L (or O or K reachable) -> then LOK
    const grid = parseGrid('BE*OK*');
    const result = solve(grid);
    expect(result).not.toBeNull();
    expect(result!.moves).toHaveLength(2);
    expect(result!.moves[0]!.word).toBe('BE');
    expect(result!.moves[1]!.word).toBe('LOK');
    expectWon(replay(grid, result!.moves));
  });

  it('emits at least one progress callback and reports a sensible maxDepth', () => {
    // A puzzle with 6 white cells -- maxDepth should be 3.
    const grid = parseGrid('LOK**M');
    const updates: SolveProgress[] = [];
    solve(grid, {
      onProgress: (p) => updates.push(p),
      progressIntervalMs: 0,
    });
    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0]!.maxDepth).toBe(3);
    expect(updates.at(-1)!.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('returns null and stops early when the abort signal fires', () => {
    const grid = parseGrid([
      '  A    ',
      '  K    ',
      '  E    ',
      '  *L   ',
      '  XXR  ',
      ' *KAV  ',
      'UKXXLTB',
      'TLAOTX ',
      '  LK A ',
      '  X* K ',
      '  T    ',
    ].join('\n'));
    const controller = new AbortController();
    let aborted = false;
    const result = solve(grid, {
      signal: controller.signal,
      progressIntervalMs: 0,
      onProgress: (p) => {
        // Abort once we've expanded a handful of states.
        // This puzzle is complex enough that there's no chance of it getting solved with only 50 states visited.
        if (!aborted && p.visited > 50) {
          aborted = true;
          controller.abort();
        }
      },
    });
    expect(aborted).toBe(true);
    expect(result).toBeNull();
  });
});

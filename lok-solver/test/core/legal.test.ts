import { describe, expect, it } from 'vitest';
import { parseGrid, formatGrid } from '../../src/core/grid.js';
import { legalMoves } from '../../src/core/legal.js';
import { applyMove } from '../../src/core/apply.js';

describe('legalMoves', () => {
  it('on LOK* yields exactly one LOK move (the * is the only valid target)', () => {
    const grid = parseGrid('LOK*');
    const moves = legalMoves(grid);
    expect(moves).toHaveLength(1);
    const m = moves[0]!;
    expect(m.word).toBe('LOK');
    expect(applyMove(grid, m)).toEqual(parseGrid('lok.'));
  });

  it('on LOK*M yields LOK moves with two target choices (the * and the M)', () => {
    const grid = parseGrid('LOK*M');
    const moves = legalMoves(grid).filter((m) => m.word === 'LOK');
    expect(moves).toHaveLength(2);
    const targetSyms = moves.map((m) => {
      if (m.word !== 'LOK') throw new Error('unreachable');
      return formatGrid(applyMove(grid, m));
    });
    expect(new Set(targetSyms)).toEqual(new Set(['lok.M', 'lok*m']));
  });

  it('on TAT yields two TA moves (one per direction) both finishing the puzzle', () => {
    // T(0)A(1)T(2). Two TA routes: T(0)->A and T(2)->A. Each leaves the other T white.
    // TA action picks T (the only white symbol left post-word). Either move wins.
    const grid = parseGrid('TAT');
    const moves = legalMoves(grid).filter((m) => m.word === 'TA');
    expect(moves).toHaveLength(2);
    for (const m of moves) {
      if (m.word !== 'TA') throw new Error('unreachable');
      expect(m.symbol).toBe('T');
      expect(formatGrid(applyMove(grid, m))).toBe('tat');
    }
  });

  it('on TA alone yields no TA moves (no remaining white target post-word)', () => {
    const grid = parseGrid('TA');
    const moves = legalMoves(grid).filter((m) => m.word === 'TA');
    expect(moves).toEqual([]);
  });

  it('TLAK: legal when the second-block search lands on a white cell', () => {
    const grid = parseGrid('TLAK**');
    const moves = legalMoves(grid).filter((m) => m.word === 'TLAK');
    // After word: T,L,A,K black; two white *'s at (0,4) and (0,5).
    // TLAK first ∈ {(0,4),(0,5)}; second is "immediately N or E skipping blacks".
    // The only legal move is to select them both; specifically, first=(0,4), direction=E, second=(0,5).
    expect(moves).toHaveLength(1);
    expect(formatGrid(applyMove(grid, moves[0]!))).toBe('tlak..');
  });

  it('BE: enumerates moves for each white * with the restricted letter set', () => {
    const grid = parseGrid('BE*');
    const moves = legalMoves(grid).filter((m) => m.word === 'BE');
    // One white * at (0,2). Letter choices = {L,O,K,T,A,B,E,X} ∪ symbols-on-grid={B,E,*}.
    // * is not a letter so not in letter choices. Final = {L,O,K,T,A,B,E,X}.
    expect(moves).toHaveLength(8);
  });

  it('returns no moves on an already-won grid', () => {
    const grid = parseGrid('lok');
    expect(legalMoves(grid)).toEqual([]);
  });
});

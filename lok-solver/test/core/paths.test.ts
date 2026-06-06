import { describe, expect, it } from 'vitest';
import { parseGrid } from '../../src/core/grid.js';
import { enumerateWordPaths } from '../../src/core/paths.js';

describe('enumerateWordPaths', () => {
  it('finds LOK in a horizontal row', () => {
    const grid = parseGrid('LOK');
    const paths = enumerateWordPaths(grid, 'LOK');
    expect(paths).toEqual([
      [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }],
    ]);
  });

  it('finds LOK reading right-to-left', () => {
    const grid = parseGrid('KOL');
    const paths = enumerateWordPaths(grid, 'LOK');
    expect(paths).toEqual([
      [{ r: 0, c: 2 }, { r: 0, c: 1 }, { r: 0, c: 0 }],
    ]);
  });

  it('finds LOK vertically', () => {
    const grid = parseGrid('L\nO\nK');
    const paths = enumerateWordPaths(grid, 'LOK');
    expect(paths).toEqual([
      [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }],
    ]);
  });

  it('returns empty when blocked by a white cell (LMK)', () => {
    const grid = parseGrid('LMOK');
    expect(enumerateWordPaths(grid, 'LOK')).toEqual([]);
  });

  it('treats white * as a wall', () => {
    const grid = parseGrid('L*OK');
    expect(enumerateWordPaths(grid, 'LOK')).toEqual([]);
  });

  it('skips over black cells between letters', () => {
    // L (white) . (black *) O (white) . (black *) K (white)
    const grid = parseGrid('L.O.K');
    const paths = enumerateWordPaths(grid, 'LOK');
    expect(paths).toEqual([
      [{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 0, c: 4 }],
    ]);
  });

  it('skips over blanks between letters', () => {
    const grid = parseGrid('L O K');
    const paths = enumerateWordPaths(grid, 'LOK');
    expect(paths).toEqual([
      [{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 0, c: 4 }],
    ]);
  });

  it('passes straight through X (X is in the route)', () => {
    const grid = parseGrid('LXOK');
    const paths = enumerateWordPaths(grid, 'LOK');
    expect(paths).toEqual([
      [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }],
    ]);
  });

  it('turns at X to route around a wall', () => {
    // L X (row 0), M O (row 1), . K (row 2 -- col 0 is black, col 1 is K)
    // Path: L(0,0) -> X(0,1) turn S -> O(1,1) -> K(2,1)
    const grid = parseGrid(['LX', 'MO', '.K'].join('\n'));
    const paths = enumerateWordPaths(grid, 'LOK');
    expect(paths).toEqual([
      [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
    ]);
  });

  it('routes around M using Xs', () => {
    const grid = parseGrid([' X X  ', 'LXMXOK'].join('\n'));
    const paths = enumerateWordPaths(grid, 'LOK');
    expect(paths.length).toEqual(1);
    // Verify that the path uses the upper row, which it should to get around the M wall.
    expect(paths[0].some((cell) => cell.r === 0)).toBe(true);
  });

  it('finds TLAK in a straight row', () => {
    const grid = parseGrid('TLAK');
    const paths = enumerateWordPaths(grid, 'TLAK');
    expect(paths).toEqual([
      [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }],
    ]);
  });

  it('finds TA and stops there (does not continue past the A)', () => {
    const grid = parseGrid('TAK');
    const paths = enumerateWordPaths(grid, 'TA');
    expect(paths).toEqual([
      [{ r: 0, c: 0 }, { r: 0, c: 1 }],
    ]);
  });

  it('returns empty when the starting letter is absent', () => {
    const grid = parseGrid('*OK');
    expect(enumerateWordPaths(grid, 'LOK')).toEqual([]);
  });

  it('does not start from a black starting letter', () => {
    // lowercase l is a black L
    const grid = parseGrid('lOK');
    expect(enumerateWordPaths(grid, 'LOK')).toEqual([]);
  });

  it('finds multiple paths when several exist', () => {
    const grid = parseGrid(['LOK', 'LOK'].join('\n'));
    expect(enumerateWordPaths(grid, 'LOK')).toHaveLength(2);
  })

  it('finds multiple paths when several exist (same starting position)', () => {
    const grid = parseGrid(['LOK', 'O', 'K'].join('\n'));
    expect(enumerateWordPaths(grid, 'LOK')).toHaveLength(2);
  });

  it('finds multiple paths when several exist (intersect in middle)', () => {
    const grid = parseGrid([' L ', 'LOK', ' K'].join('\n'));
    expect(enumerateWordPaths(grid, 'LOK')).toHaveLength(2);
  });
});

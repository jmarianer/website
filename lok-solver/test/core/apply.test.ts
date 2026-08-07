import { describe, expect, it } from 'vitest';
import { parseGrid, formatGrid } from '../../src/core/grid.js';
import { applyMove } from '../../src/core/apply.js';

describe('applyMove', () => {
  it('LOK: blackens word letters and the chosen target', () => {
    const grid = parseGrid('LOK*');
    const after = applyMove(grid, {
      word: 'LOK',
      route: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 }
      ],
      target: { r: 0, c: 3 }
    });
    expect(formatGrid(after)).toBe('lok.');
  });

  it('LOK: target may be a letter cell', () => {
    const grid = parseGrid('LOKM');
    const after = applyMove(grid, {
      word: 'LOK',
      route: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 }
      ],
      target: { r: 0, c: 3 }
    });
    expect(formatGrid(after)).toBe('lokm');
  });

  it('LOK: route X cells stay white', () => {
    const grid = parseGrid('LXOKM');
    const after = applyMove(grid, {
      word: 'LOK',
      route: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
        { r: 0, c: 3 }
      ],
      target: { r: 0, c: 4 }
    });
    expect(formatGrid(after)).toBe('lXokm');
  });

  it('TLAK: blackens word letters plus both first and second blocks', () => {
    const grid = parseGrid('TLAK**');
    const after = applyMove(grid, {
      word: 'TLAK',
      route: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
        { r: 0, c: 3 }
      ],
      first: { r: 0, c: 4 },
      direction: 'E',
      second: { r: 0, c: 5 }
    });
    expect(formatGrid(after)).toBe('tlak..');
  });

  it('TA: blackens all remaining white cells of the chosen symbol', () => {
    // Word T-A at (0,0)-(0,1); other A's at (0,2) and (1,0).
    const grid = parseGrid('TAA\nA  ');
    const after = applyMove(grid, {
      word: 'TA',
      route: [
        { r: 0, c: 0 },
        { r: 0, c: 1 }
      ],
      symbol: 'A'
    });
    expect(formatGrid(after)).toBe(['taa', 'a  '].join('\n'));
  });

  it('TA: can target * to blacken all white empty blocks', () => {
    const grid = parseGrid('TA**');
    const after = applyMove(grid, {
      word: 'TA',
      route: [
        { r: 0, c: 0 },
        { r: 0, c: 1 }
      ],
      symbol: '*'
    });
    expect(formatGrid(after)).toBe('ta..');
  });

  it('BE: turns a white * into a white letter', () => {
    const grid = parseGrid('BE*');
    const after = applyMove(grid, {
      word: 'BE',
      route: [
        { r: 0, c: 0 },
        { r: 0, c: 1 }
      ],
      star: { r: 0, c: 2 },
      newLetter: 'O'
    });
    expect(formatGrid(after)).toBe('beO');
  });
});

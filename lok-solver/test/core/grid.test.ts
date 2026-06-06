import { describe, expect, it } from 'vitest';
import { parseGrid, formatGrid } from '../../src/core/grid.js';

describe('parseGrid / formatGrid', () => {
  it('round-trips a simple initial grid', () => {
    const text = ['LOK', ' X ', 'T*A'].join('\n');
    const grid = parseGrid(text);
    expect(grid.rows).toBe(3);
    expect(grid.cols).toBe(3);
    expect(formatGrid(grid)).toBe(text);
  });

  it('encodes black cells as lowercase letters and "." for black empty blocks', () => {
    const grid = parseGrid('LO*');
    grid.cells[0]![0]!.col = 'B';
    grid.cells[0]![2]!.col = 'B';
    expect(formatGrid(grid)).toBe('lO.');
  });

  it('round-trips a grid containing black cells', () => {
    const text = ['lOk', ' X ', 't.A'].join('\n');
    const grid = parseGrid(text);
    expect(formatGrid(grid)).toBe(text);
  });

  it('pads short rows with blanks to the longest row width', () => {
    const text = ['LOK', 'X', 'T*A'].join('\n');
    const grid = parseGrid(text);
    expect(grid.cols).toBe(3);
    expect(formatGrid(grid)).toBe(['LOK', 'X  ', 'T*A'].join('\n'));
  });

  it('rejects characters that are not letters, *, ., or space', () => {
    expect(() => parseGrid('LO?')).toThrow();
  });
});

import type { Cell, Grid, Letter } from './types.js';

const UPPER = /^[A-Z]$/;
const LOWER = /^[a-z]$/;

function parseChar(ch: string): Cell {
  if (ch === ' ') return null;
  if (ch === '*') return { sym: '*', col: 'W', pencil: true };
  if (ch === '.') return { sym: '*', col: 'B', pencil: true };
  if (UPPER.test(ch)) return { sym: ch as Letter, col: 'W' };
  if (LOWER.test(ch)) return { sym: ch.toUpperCase() as Letter, col: 'B' };
  throw new Error(`parseGrid: unexpected character ${JSON.stringify(ch)}`);
}

function formatCell(cell: Cell): string {
  if (cell === null) return ' ';
  if (cell.sym === '*') return cell.col === 'W' ? '*' : '.';
  return cell.col === 'W' ? cell.sym : cell.sym.toLowerCase();
}

export function parseGrid(text: string): Grid {
  const lines = text.split('\n');
  const cols = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const cells: Cell[][] = lines.map((line) => {
    const padded = line.padEnd(cols, ' ');
    const row: Cell[] = [];
    for (const ch of padded) row.push(parseChar(ch));
    return row;
  });
  return { rows: lines.length, cols, cells };
}

export function formatGrid(grid: Grid): string {
  return grid.cells.map((row) => row.map(formatCell).join('')).join('\n');
}

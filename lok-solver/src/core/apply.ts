import type { Cell, Coord, Grid, Move } from './types.js';

function blackenAt(cells: Cell[][], { r, c }: Coord): void {
  const cell = cells[r]![c]!;
  if (cell === null || cell.col === 'B') return;
  cells[r]![c] = { sym: cell.sym, col: 'B' };
}

function blackenRouteLetters(cells: Cell[][], route: ReadonlyArray<Coord>): void {
  for (const coord of route) {
    const cell = cells[coord.r]![coord.c]!;
    if (cell === null || cell.sym === 'X') continue;
    blackenAt(cells, coord);
  }
}

/*
 * Returns a new grid with the move applied, leaving the input grid unmodified.
 *
 * The entire route is blackened first, then the specific effect of the move is
 * applied as follows:
 *
 * LOK: blacken the target cell.
 * TLAK: blacken the two target cells.
 * TA: blacken all white cells matching the selected symbol.
 * BE: place a new white letter at the star.
 */
export function applyMove(grid: Grid, move: Move): Grid {
  // Deep-copy the rows once, then mutate freely below.
  const cells: Cell[][] = grid.cells.map((row) => [...row]);

  blackenRouteLetters(cells, move.route);
  switch (move.word) {
    case 'LOK':
      blackenAt(cells, move.target);
      break;
    case 'TLAK':
      blackenAt(cells, move.first);
      blackenAt(cells, move.second);
      break;
    case 'TA': {
      const sym = move.symbol;
      for (const row of cells) {
        for (let ci = 0; ci < row.length; ci++) {
          const cell = row[ci]!;
          if (cell === null || cell.col !== 'W' || cell.sym !== sym) continue;
          row[ci] = { sym: cell.sym, col: 'B' };
        }
      }
      break;
    }
    case 'BE':
      cells[move.star.r]![move.star.c] = { sym: move.newLetter, col: 'W' };
      break;
  }

  return { ...grid, cells };
}

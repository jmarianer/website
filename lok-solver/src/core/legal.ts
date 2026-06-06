import { enumerateWordPaths } from './paths.js';
import type {
  Cell, CellSymbol, Coord, Direction, Grid, Letter, Move,
} from './types.js';

const TLAK_DIRS: ReadonlyArray<'N' | 'E'> = ['N', 'E'];

const WORD_LETTERS: ReadonlyArray<Letter> =
  ['L', 'O', 'K', 'T', 'A', 'B', 'E', 'X'];

const DIR_DELTAS: Record<Direction, { dr: number; dc: number }> = {
  N: { dr: -1, dc:  0 },
  S: { dr:  1, dc:  0 },
  E: { dr:  0, dc:  1 },
  W: { dr:  0, dc: -1 },
};

function isLetter(sym: CellSymbol): sym is Letter {
  return sym !== '*';
}

// TODO: Deduplicate with paths.ts's stepUntilCell.
function stepUntilCell(grid: Grid, from: Coord, dir: Direction): Coord | null {
  const { dr, dc } = DIR_DELTAS[dir];
  let r = from.r;
  let c = from.c;
  while (true) {
    r += dr;
    c += dc;
    if (r < 0 || r >= grid.rows || c < 0 || c >= grid.cols) return null;
    const cell = grid.cells[r]![c]!;
    if (cell === null) continue;
    if (cell.col === 'B') continue;
    return { r, c };
  }
}

// TODO: Deduplicate with applyMove's blackening logic.
function blackenRouteLetters(grid: Grid, route: ReadonlyArray<Coord>): Grid {
  const newCells = grid.cells.map((row) => row.slice()) as Cell[][];
  for (const { r, c } of route) {
    const cell = newCells[r]![c]!;
    if (cell === null || cell.sym === 'X') continue;
    newCells[r]![c] = { sym: cell.sym, col: 'B' };
  }
  return { ...grid, cells: newCells };
}

function whiteCellCoords(grid: Grid): Coord[] {
  return grid.cells.flatMap((row, r) =>
    row.flatMap((cell, c) => (cell !== null && cell.col === 'W' ? [{ r, c }] : [])),
  );
}

function whiteSymbols(grid: Grid): Set<CellSymbol> {
  return new Set(
    grid.cells.flatMap((row) =>
      row.flatMap((cell) => (cell !== null && cell.col === 'W' ? [cell.sym] : [])),
    ),
  );
}

function beLetterChoices(grid: Grid): Letter[] {
  const gridLetters = grid.cells.flatMap((row) =>
    row.flatMap((cell) => (cell !== null && isLetter(cell.sym) ? [cell.sym] : [])),
  );
  return [...new Set<Letter>([...WORD_LETTERS, ...gridLetters])];
}

/*
  * Returns an array of every move that's legal on the given grid.
  *
  * The implementation is straightforward but not optimized at all; it just
  * brute-force enumerates every possible move and checks legality by simulating
  * the route blackening. This is fast enough for now since the grids are small
  * and the branching factor is limited by the words, but if we wanted to
  * optimize we could probably do something more clever like integrating the
  * move generation into the path search.
  */
export function legalMoves(grid: Grid): Move[] {
  const moves: Move[] = [];

  // LOK
  for (const route of enumerateWordPaths(grid, 'LOK')) {
    const post = blackenRouteLetters(grid, route);
    for (const target of whiteCellCoords(post)) {
      moves.push({ word: 'LOK', route, target });
    }
  }

  // TLAK
  for (const route of enumerateWordPaths(grid, 'TLAK')) {
    const post = blackenRouteLetters(grid, route);
    for (const first of whiteCellCoords(post)) {
      for (const direction of TLAK_DIRS) {
        const second = stepUntilCell(post, first, direction);
        if (second === null) continue;
        moves.push({ word: 'TLAK', route, first, direction, second });
      }
    }
  }

  // TA
  for (const route of enumerateWordPaths(grid, 'TA')) {
    const post = blackenRouteLetters(grid, route);
    for (const symbol of whiteSymbols(post)) {
      moves.push({ word: 'TA', route, symbol });
    }
  }

  // BE
  for (const route of enumerateWordPaths(grid, 'BE')) {
    const post = blackenRouteLetters(grid, route);
    const stars = whiteCellCoords(post).filter((co) => {
      const cell = post.cells[co.r]![co.c]!;
      return cell !== null && cell.sym === '*';
    });
    const letters = beLetterChoices(post);
    for (const star of stars) {
      for (const newLetter of letters) {
        moves.push({ word: 'BE', route, star, newLetter });
      }
    }
  }

  return moves;
}
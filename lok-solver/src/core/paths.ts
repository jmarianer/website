import type { Coord, Direction, Grid, Word } from './types.js';

const DIRS: Record<Direction, { dr: number; dc: number }> = {
  N: { dr: -1, dc:  0 },
  S: { dr:  1, dc:  0 },
  E: { dr:  0, dc:  1 },
  W: { dr:  0, dc: -1 },
};

const REVERSE: Record<Direction, Direction> = {
  N: 'S', S: 'N', E: 'W', W: 'E',
};

const ALL_DIRS: ReadonlyArray<Direction> = ['N', 'S', 'E', 'W'];

function nonReverseDirs(dir: Direction): Direction[] {
  return ALL_DIRS.filter((d) => d !== REVERSE[dir]);
}

/*
 * Steps through the grid in the given direction until a non-null, non-black cell is found.
 */
function stepUntilCell(grid: Grid, from: Coord, dir: Direction): Coord | null {
  const { dr, dc } = DIRS[dir];
  let {r, c} = from;
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

/*
 * Recursive DFS that finds every path spelling the given word, appending each
 * completed route to `out`.
 *
 * From `pos`, takes one step in `dir` via stepUntilCell (skipping empty and
 * black cells) to land on the next white cell, then:
 *   - 'X' cells are pivots: they're added to the route but consume no letter,
 *     and the search fans out in every non-reverse direction. `xVisited` keys
 *     on (cell, dir) so pivots can't loop forever.
 *   - '*' cells end the branch (a star can't be part of a spelled word here).
 *   - any other cell must match the next needed letter to advance; once all
 *     letters are matched the route is recorded.
 */
function search(
  grid: Grid,
  word: Word,
  pos: Coord,
  dir: Direction,
  collected: number,
  route: Coord[],
  xVisited: Set<string>,
  out: Coord[][],
): void {
  const next = stepUntilCell(grid, pos, dir);
  if (next === null) return;
  const cell = grid.cells[next.r]![next.c]!;
  // cell is guaranteed non-null and white at this point
  if (cell === null) return;
  if (cell.sym === 'X') {
    const key = `${next.r},${next.c},${dir}`;
    if (xVisited.has(key)) return;
    xVisited.add(key);
    const newRoute = [...route, next];
    for (const d2 of nonReverseDirs(dir)) {
      search(grid, word, next, d2, collected, newRoute, xVisited, out);
    }
    xVisited.delete(key);
    return;
  }
  if (cell.sym === '*') return;
  if (cell.sym !== word[collected]) return;
  const newRoute = [...route, next];
  const newCollected = collected + 1;
  if (newCollected === word.length) {
    out.push(newRoute);
    return;
  }
  search(grid, word, next, dir, newCollected, newRoute, xVisited, out);
}

/*
 * Returns a list of all paths through the grid that spell the given word, where
 * a path is a list of coordinates corresponding to the letters in the word. Paths
 * may only traverse white cells, and must follow the stepping rules of the game:
 *  - From each letter, you must step in one of the four cardinal directions until
 *    you reach the next white cell, which must match the next letter in the
 *    word.
 *  - 'X' cells are wildcards that can be part of a path but don't consume letters;
 *  - when you step on an 'X', you may change direction (except to reverse) and
 *    keep going for the same letter.
 */
export function enumerateWordPaths(grid: Grid, word: Word): Coord[][] {
  const out: Coord[][] = [];
  const startLetter = word[0]!;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cell = grid.cells[r]![c]!;
      if (cell === null || cell.col !== 'W' || cell.sym !== startLetter) continue;
      const start = { r, c };
      for (const dir of ALL_DIRS) {
        search(grid, word, start, dir, 1, [start], new Set(), out);
      }
    }
  }
  return out;
}

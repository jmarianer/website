import { Puzzle } from './types';

export function isPuzzleEmpty(puzzle: Puzzle): boolean {
  return puzzle.cells.flat().every(cell => !cell.isFillable());
}

export function isRotationallySymmetric(puzzle: Puzzle): boolean {
  const rows = puzzle.cells.length;
  if (rows === 0) return true;
  const cols = puzzle.cells[0].length;
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const a = puzzle.cells[r][c].isFillable();
      const b = puzzle.cells[rows - 1 - r][cols - 1 - c].isFillable();
      if (a !== b) return false;
    }
  }
  return true;
}

export function isConnected(puzzle: Puzzle): boolean {
  const rows = puzzle.cells.length;
  if (rows === 0) return true;
  const cols = puzzle.cells[0].length;
  const visited: boolean[][] = puzzle.cells.map(row => row.map(() => false));

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (!puzzle.cells[r][c].isFillable() || visited[r][c]) continue;

      const queue: [number, number][] = [[r, c]];
      visited[r][c] = true;
      while (queue.length > 0) {
        const [cr, cc] = queue.shift()!;
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 1 || nr >= rows - 1 || nc < 1 || nc >= cols - 1) continue;
          if (!puzzle.cells[nr][nc].isFillable() || visited[nr][nc]) continue;
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
      break;  // Only need to visit one component, since we check at the end if all fillable cells were visited
    }
  }

  return puzzle.cells.every((row, r) =>
    row.every((cell, c) => !cell.isFillable() || visited[r][c])
  );
}

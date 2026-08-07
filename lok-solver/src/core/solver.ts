import { applyMove } from './apply.js';
import { formatGrid } from './grid.js';
import { legalMoves } from './legal.js';
import type { Grid, Move } from './types.js';

export type SolveResult = {
  initialGrid: Grid;
  moves: Move[];
} | null;

export type SolveProgress = {
  /** Number of states fully expanded (dequeued and their successors generated). */
  visited: number;
  /** Number of states currently in the BFS frontier waiting to be expanded. */
  queued: number;
  /** Path length of the state most recently expanded. */
  depth: number;
  /** Upper bound on any solution's path length: every move blackens >= 2 cells. */
  maxDepth: number;
  /** Wall-clock milliseconds since solve() was called. */
  elapsedMs: number;
};

export type SolveOptions = {
  /** Callback invoked periodically with current search state. Throttled by progressIntervalMs. */
  onProgress?: (p: SolveProgress) => void;
  /** If aborted, solve() returns null at the next state-expansion boundary. */
  signal?: AbortSignal;
  /** Minimum wall-clock ms between onProgress calls. Default 100. */
  progressIntervalMs?: number;
};

function isWon(grid: Grid): boolean {
  return grid.cells.flatMap((x) => x).every((cell) => cell === null || cell.col !== 'W');
}

function countWhite(grid: Grid): number {
  return grid.cells
    .flatMap((x) => x)
    .reduce((count, cell) => count + (cell !== null && cell.col === 'W' ? 1 : 0), 0);
}

/*
 * Solves the given grid, returning a sequence of moves leading to a win if one exists.
 *
 * Uses a breadth-first search, which is guaranteed to find a shortest solution if one exists.
 * The search space is finite since every move blackens at least one white cell and thus can't
 * repeat the same grid state indefinitely.
 *
 * The `onProgress` callback is invoked periodically with the current search state, throttled by
 * `progressIntervalMs`. The `signal` can be used to abort the search early; if it's aborted,
 * solve() will return null at the next state-expansion boundary.
 */
export function solve(grid: Grid, options: SolveOptions = {}): SolveResult {
  const { onProgress, signal, progressIntervalMs = 100 } = options;
  const startTime = performance.now();
  const maxDepth = Math.ceil(countWhite(grid) / 2);

  const emit = (visited: number, queued: number, depth: number): void => {
    if (!onProgress) return;
    onProgress({
      visited,
      queued,
      depth,
      maxDepth,
      elapsedMs: performance.now() - startTime
    });
  };

  if (isWon(grid)) {
    emit(0, 0, 0);
    return { initialGrid: grid, moves: [] };
  }

  type Node = { grid: Grid; path: Move[] };
  const visited = new Set<string>([formatGrid(grid)]);
  const queue: Node[] = [{ grid, path: [] }];
  let head = 0;
  let visitedCount = 0;
  let currentDepth = 0;
  let lastProgressEmit = startTime;

  while (head < queue.length) {
    if (signal?.aborted) {
      emit(visitedCount, queue.length - head, currentDepth);
      return null;
    }
    const { grid: g, path } = queue[head++]!;
    visitedCount++;
    currentDepth = path.length;

    const now = performance.now();
    if (onProgress && now - lastProgressEmit >= progressIntervalMs) {
      lastProgressEmit = now;
      emit(visitedCount, queue.length - head, currentDepth);
    }

    for (const move of legalMoves(g)) {
      const next = applyMove(g, move);
      const key = formatGrid(next);
      if (visited.has(key)) continue;
      visited.add(key);
      const newPath = [...path, move];
      if (isWon(next)) {
        emit(visitedCount, queue.length - head, newPath.length);
        return { initialGrid: grid, moves: newPath };
      }
      queue.push({ grid: next, path: newPath });
    }
  }

  emit(visitedCount, 0, currentDepth);
  return null;
}

import { readFileSync } from 'node:fs';
import { parseGrid, formatGrid } from '../core/grid.js';
import { applyMove } from '../core/apply.js';
import { solve } from '../core/solver.js';
import type { Move } from '../core/types.js';

function describeMove(move: Move): string {
  const route = move.route.map((c) => `(${c.r},${c.c})`).join(' → ');
  switch (move.word) {
    case 'LOK':
      return `LOK  route=${route}  target=(${move.target.r},${move.target.c})`;
    case 'TLAK':
      return `TLAK route=${route}  first=(${move.first.r},${move.first.c}) ${move.direction} second=(${move.second.r},${move.second.c})`;
    case 'TA':
      return `TA   route=${route}  symbol=${move.symbol}`;
    case 'BE':
      return `BE   route=${route}  star=(${move.star.r},${move.star.c}) → ${move.newLetter}`;
  }
}

function readPuzzle(): string {
  const path = process.argv[2];
  if (path) return readFileSync(path, 'utf-8').replace(/\n+$/, '');
  return readFileSync(0, 'utf-8').replace(/\n+$/, '');
}

function main(): void {
  const text = readPuzzle();
  const grid = parseGrid(text);

  console.log('Puzzle:');
  console.log(formatGrid(grid));
  console.log();

  const start = performance.now();
  const result = solve(grid, {
    progressIntervalMs: 500,
    onProgress: (p) => {
      console.log(
        `Visited ${p.visited}, queued ${p.queued}, depth ${p.depth}/${p.maxDepth}, elapsed ${p.elapsedMs.toFixed(0)} ms`
      );
    }
  });
  const elapsed = performance.now() - start;
  const elapsedStr =
    elapsed < 1000 ? `${elapsed.toFixed(0)} ms` : `${(elapsed / 1000).toFixed(2)} s`;

  if (result === null) {
    console.log(`No solution. (${elapsedStr})`);
    process.exit(2);
  }

  let g = grid;
  for (let i = 0; i < result.moves.length; i++) {
    const move = result.moves[i]!;
    g = applyMove(g, move);
    console.log(`Move ${i + 1}: ${describeMove(move)}`);
    console.log(formatGrid(g));
    console.log();
  }
  console.log(`Solved in ${result.moves.length} move(s). (${elapsedStr})`);
}

main();

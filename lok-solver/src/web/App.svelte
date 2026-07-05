<script lang="ts">
  import { applyMove } from '../core/apply.js';
  import type { SolveProgress } from '../core/solver.js';
  import type { Grid, Move } from '../core/types.js';
  import { SolverClient } from './solver-client.js';

  let input = $state(`  A
  K
  E
  *L
  XXR
 *KAV
UKXXLTB
TLAOTX
  LK A
  X* K
  T`);

  let solution = $state<{ initialGrid: Grid; moves: Move[] } | null>(null);
  let solveError = $state<string | null>(null);
  let solving = $state(false);
  let solveProgress = $state<SolveProgress | null>(null);
  let step = $state(0);

  const solverClient = new SolverClient();

  // Animation clock: animElapsed is ms since the current move's animation started, or null when settled.
  // animMoveLength is the route length of the move currently being animated.
  let animElapsed = $state<number | null>(null);
  let animMoveLength = $state<number>(0);
  let animRAF: number | null = null;
  const ANIM_MS = 250;

  let playing = $state(false);

  function clearAnim(): void {
    if (animRAF !== null) {
      cancelAnimationFrame(animRAF);
      animRAF = null;
    }
    animElapsed = null;
  }

  function advance(): void {
    if (!solution || step >= solution.moves.length) {
      playing = false;
      clearAnim();
      return;
    }
    clearAnim();
    const move = solution.moves[step]!;
    step++;
    animMoveLength = move.route.length;
    animElapsed = 0;
    // Total duration: one unit of pre-roll wait + one unit per cell visited.
    const totalDuration = (move.route.length + 1) * ANIM_MS;
    const startTime = performance.now();
    const frame = (now: number): void => {
      const elapsed = now - startTime;
      if (elapsed >= totalDuration) {
        if (playing) {
          advance();
        } else {
          animElapsed = null;
          animRAF = null;
        }
        return;
      }
      animElapsed = elapsed;
      animRAF = requestAnimationFrame(frame);
    };
    animRAF = requestAnimationFrame(frame);
  }

  function goBack(): void {
    playing = false;
    clearAnim();
    if (step > 0) step--;
  }

  function reset(): void {
    playing = false;
    clearAnim();
    step = 0;
  }

  function togglePlay(): void {
    if (!solution) return;
    if (playing) {
      playing = false;
      return;
    }
    // If we're at the end, restart from the beginning before playing.
    if (step >= solution.moves.length) step = 0;
    playing = true;
    if (animElapsed === null) advance();
  }

  function handleSolve(): void {
    clearAnim();
    solving = true;
    solveError = null;
    solution = null;
    solveProgress = null;
    solverClient.solve(input, {
      onProgress: (p) => {
        solveProgress = p;
      },
      onResult: (res) => {
        solving = false;
        solveProgress = null;
        if (res === null) {
          solveError = 'No solution.';
        } else {
          solution = res;
          step = 0;
        }
      },
      onError: (msg) => {
        solving = false;
        solveProgress = null;
        solveError = msg;
      },
    });
  }

  function cancelSolve(): void {
    solverClient.cancel();
    solving = false;
    solveProgress = null;
  }

  // Discrete cell index for darkening (and gating "are we animating?"). null = settled.
  const animProgress = $derived.by((): number | null => {
    if (animElapsed === null) return null;
    const frac = animElapsed / ANIM_MS - 1;
    if (frac < 0) return -1;
    return Math.min(Math.floor(frac), animMoveLength - 1);
  });

  // Continuous progress for line growth. Values:
  //   -1 = pre-roll wait (no line)
  //    0 = cursor at route[0] (single dot)
  //    K (integer) = cursor at route[K]
  //    K + frac = cursor frac of the way from route[K] toward route[K+1]
  // When settled, returns route.length-1 so the full line stays drawn.
  const lineFraction = $derived.by((): number => {
    if (animElapsed === null) {
      return currentMove ? currentMove.route.length - 1 : -1;
    }
    return animElapsed / ANIM_MS - 1;
  });

  const currentGrid = $derived.by((): Grid | null => {
    if (!solution) return null;
    // While animating move N, step is already N+1 and we render the pre-move
    // grid plus partial route blackening. When settled, render the full grid at step.
    const baseStep = animProgress !== null ? step - 1 : step;
    let g = solution.initialGrid;
    for (let i = 0; i < baseStep; i++) g = applyMove(g, solution.moves[i]!);

    if (animProgress !== null) {
      const move = solution.moves[step - 1]!;
      const newCells = g.cells.map((row) => [...row]);
      for (let i = 0; i <= animProgress; i++) {
        const p = move.route[i]!;
        const cell = newCells[p.r]![p.c]!;
        if (cell === null || cell.sym === 'X') continue;
        newCells[p.r]![p.c] = { sym: cell.sym, col: 'B' };
      }
      return { ...g, cells: newCells };
    }

    return g;
  });

  const currentMove = $derived(
    solution && step > 0 ? solution.moves[step - 1] : null,
  );

  function describeMove(m: Move): string {
    switch (m.word) {
      case 'LOK':
        return `LOK · target (${m.target.r},${m.target.c})`;
      case 'TLAK':
        return `TLAK · targets (${m.first.r},${m.first.c}) → (${m.second.r},${m.second.c})`;
      case 'TA':
        return `TA · symbol ${m.symbol}`;
      case 'BE':
        return `BE · (${m.star.r},${m.star.c}) → ${m.newLetter}`;
    }
  }

  function isOnRoute(r: number, c: number): boolean {
    if (!currentMove) return false;
    const end = animProgress !== null ? animProgress : currentMove.route.length - 1;
    for (let i = 0; i <= end; i++) {
      const p = currentMove.route[i]!;
      if (p.r === r && p.c === c) return true;
    }
    return false;
  }

  // Pixel geometry — must match the CSS for .grid / .cell / .label.
  const CELL_SIZE = 32;        // 2rem
  const CELL_GAP = 1;
  const LABEL_SIZE = 24;       // 1.5rem
  const GRID_INSET = 2 + 1;    // border (2px) + padding (1px)

  function cellCenter(r: number, c: number): { x: number; y: number } {
    return {
      x: GRID_INSET + LABEL_SIZE + CELL_GAP + c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
      y: GRID_INSET + LABEL_SIZE + CELL_GAP + r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    };
  }

  const routePoints = $derived.by((): string => {
    if (!currentMove || lineFraction < 0) return '';
    const route = currentMove.route;
    const completed = Math.floor(lineFraction);
    const partial = lineFraction - completed;
    const pts: { x: number; y: number }[] = [];
    const lastFull = Math.min(completed, route.length - 1);
    for (let i = 0; i <= lastFull; i++) {
      pts.push(cellCenter(route[i]!.r, route[i]!.c));
    }
    // Partial segment from the last full point toward the next cell.
    if (completed + 1 < route.length && partial > 0) {
      const a = pts[pts.length - 1]!;
      const next = cellCenter(route[completed + 1]!.r, route[completed + 1]!.c);
      pts.push({
        x: a.x + (next.x - a.x) * partial,
        y: a.y + (next.y - a.y) * partial,
      });
    }
    if (pts.length === 0) return '';
    // Duplicate the point so stroke-linecap=round renders a visible dot for length-1 routes.
    if (pts.length === 1) {
      const p = pts[0]!;
      return `${p.x},${p.y} ${p.x},${p.y}`;
    }
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  });
</script>

<main>
  <h1>LOK Solver</h1>

  <section class="input">
    <label for="puzzle">Puzzle (uppercase = letter, <code>*</code> = empty block, space = blank):</label>
    <textarea id="puzzle" bind:value={input} rows="12" spellcheck="false"></textarea>
    <button onclick={handleSolve} disabled={solving}>Solve</button>
    {#if solving}
      <button onclick={cancelSolve}>Cancel</button>
    {/if}
    {#if solving && solveProgress}
      <div class="progress">
        <progress max={solveProgress.maxDepth} value={solveProgress.depth}></progress>
        <span class="progress-text">
          depth {solveProgress.depth} / {solveProgress.maxDepth}
          · visited {solveProgress.visited.toLocaleString()}
          · queued {solveProgress.queued.toLocaleString()}
          · {(solveProgress.elapsedMs / 1000).toFixed(1)}s
        </span>
      </div>
    {:else if solving}
      <p class="progress-text">Solving…</p>
    {/if}
    {#if solveError}
      <p class="error">{solveError}</p>
    {/if}
  </section>

  {#if solution && currentGrid}
    <section class="output">
      <div class="controls">
        <button onclick={reset} disabled={step === 0 && !playing}>⏮ Reset</button>
        <button onclick={goBack} disabled={step === 0 || playing}>|◀ Prev</button>
        <span class="counter">Move {step} / {solution.moves.length}</span>
        <button onclick={advance} disabled={step === solution.moves.length || playing}>Next ▶|</button>
        <button onclick={togglePlay}>
          {playing ? '⏸ Pause' : step >= solution.moves.length ? '↻ Replay' : '▶ Play'}
        </button>
      </div>

      {#if currentMove}
        <p class="move-desc">{describeMove(currentMove)}</p>
      {:else}
        <p class="move-desc">Initial state.</p>
      {/if}

      <div class="grid-wrap">
        <div class="grid" style="--cols: {currentGrid.cols}; --rows: {currentGrid.rows}">
          <div class="label corner" style="grid-row: 1; grid-column: 1"></div>
          {#each Array.from({ length: currentGrid.cols }) as _, c}
            <div class="label col-label" style="grid-row: 1; grid-column: {c + 2}">{c}</div>
          {/each}
          {#each currentGrid.cells as row, r}
            <div class="label row-label" style="grid-row: {r + 2}; grid-column: 1">{r}</div>
            {#each row as cell, c}
              {#if cell !== null}
                <div
                  class="cell"
                  class:black={cell.col === 'B'}
                  class:star={cell.sym === '*'}
                  class:x={cell.sym === 'X'}
                  class:route={isOnRoute(r, c)}
                  style="grid-row: {r + 2}; grid-column: {c + 2}"
                >
                  {cell.sym === '*' ? '' : cell.sym}
                </div>
              {/if}
            {/each}
          {/each}
        </div>
        {#if routePoints}
          <svg class="route-line" aria-hidden="true">
            <polyline points={routePoints} />
          </svg>
        {/if}
      </div>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    font-family: -apple-system, system-ui, sans-serif;
    margin: 0;
    padding: 2rem;
    background: #fafafa;
    color: #222;
  }

  main {
    max-width: 700px;
    margin: 0 auto;
  }

  h1 {
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  section {
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }

  label {
    display: block;
    font-size: 0.9rem;
    color: #555;
    margin-bottom: 0.5rem;
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.5rem;
    resize: vertical;
  }

  button {
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
    cursor: pointer;
    margin-top: 0.5rem;
    margin-right: 0.25rem;
  }
  button:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
  button:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .error {
    color: #b91c1c;
    margin-top: 0.5rem;
  }

  .progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .progress progress {
    flex: 0 0 200px;
  }
  .progress-text {
    color: #555;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    margin: 0;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .counter {
    margin: 0 0.5rem;
    font-variant-numeric: tabular-nums;
    color: #444;
  }

  .move-desc {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    color: #444;
    margin: 0.5rem 0 1rem;
  }

  .grid-wrap {
    display: inline-block;
    position: relative;
  }
  .route-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }
  .route-line polyline {
    fill: none;
    stroke: #f59e0b;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.85;
  }

  .grid {
    display: inline-grid;
    grid-template-columns: 1.5rem repeat(var(--cols), 2rem);
    grid-template-rows: 1.5rem repeat(var(--rows), 2rem);
    gap: 1px;
    background: #fafafa;
    padding: 1px;
    border: 2px solid #333;
  }
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-weight: 600;
    font-size: 1rem;
    border: 1px solid #ccc;
    box-shadow: 1px 1px 0 #eee;
  }
  .label {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.7rem;
    font-weight: 400;
  }
  .cell.black {
    background: #222;
    color: white;
  }
</style>

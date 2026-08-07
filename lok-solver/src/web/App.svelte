<script lang="ts">
  import { parseGrid } from '../core/grid.js';
  import type { SolveProgress } from '../core/solver.js';
  import type { Grid } from '../core/types.js';
  import { Playback } from './playback.svelte.js';
  import {
    burstSegments,
    cellCenter,
    describeMove,
    effectCells,
    replayTo,
    routePoints,
    type Segment,
    type Solution
  } from './render.js';
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

  let solution = $state<Solution | null>(null);
  let solveError = $state<string | null>(null);
  let solving = $state(false);
  let solveProgress = $state<SolveProgress | null>(null);

  const solverClient = new SolverClient();
  const playback = new Playback(() => solution);

  function handleSolve(): void {
    playback.reset();
    solving = true;
    solveError = null;
    solution = null;
    solveProgress = null;
    solverClient.solve(parseGrid(input), {
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
        }
      },
      onError: (msg) => {
        solving = false;
        solveProgress = null;
        solveError = msg;
      }
    });
  }

  function cancelSolve(): void {
    solverClient.cancel();
    solving = false;
    solveProgress = null;
  }

  // The target effect lands mid-burst: sparks fly over the old state, the
  // cells flip, then the sparks fade out over the new one.
  const targetApplied = $derived(
    playback.targetFraction !== null && playback.targetFraction >= 0.5
  );

  const currentGrid = $derived.by((): Grid | null =>
    solution ? replayTo(solution, playback.step, playback.animProgress, targetApplied) : null
  );

  const routeLine = $derived(
    playback.currentMove ? routePoints(playback.currentMove.route, playback.lineFraction) : ''
  );

  const burst = $derived.by((): { segments: Segment[]; opacity: number } | null => {
    const t = playback.targetFraction;
    const move = playback.currentMove;
    if (t === null || !move || !solution) return null;
    const preEffectGrid = replayTo(solution, playback.step, playback.animProgress);
    return {
      segments: effectCells(preEffectGrid, move).flatMap((coord) =>
        burstSegments(cellCenter(coord.r, coord.c), t)
      ),
      opacity: t < 0.5 ? 1 : 1 - (t - 0.5) * 2
    };
  });

  function isOnRoute(r: number, c: number): boolean {
    const move = playback.currentMove;
    if (!move) return false;
    const end = playback.animProgress !== null ? playback.animProgress : move.route.length - 1;
    for (let i = 0; i <= end; i++) {
      const p = move.route[i]!;
      if (p.r === r && p.c === c) return true;
    }
    return false;
  }
</script>

<main>
  <h1>LOK Solver</h1>

  <section class="input">
    <label for="puzzle"
      >Puzzle (uppercase = letter, <code>*</code> = empty block, space = blank):</label
    >
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
        <button onclick={() => playback.reset()} disabled={playback.step === 0 && !playback.playing}
          >⏮ Reset</button
        >
        <button onclick={() => playback.goBack()} disabled={playback.step === 0 || playback.playing}
          >|◀ Prev</button
        >
        <span class="counter">Move {playback.step} / {solution.moves.length}</span>
        <button
          onclick={() => playback.advance()}
          disabled={playback.step === solution.moves.length || playback.playing}>Next ▶|</button
        >
        <button onclick={() => playback.togglePlay()}>
          {playback.playing
            ? '⏸ Pause'
            : playback.step >= solution.moves.length
              ? '↻ Replay'
              : '▶ Play'}
        </button>
      </div>

      {#if playback.currentMove}
        <p class="move-desc">{describeMove(playback.currentMove)}</p>
      {:else}
        <p class="move-desc">Initial state.</p>
      {/if}

      <div class="grid-wrap">
        <div class="grid" style="--cols: {currentGrid.cols}; --rows: {currentGrid.rows}">
          <div class="label corner" style="grid-row: 1; grid-column: 1"></div>
          {#each Array.from({ length: currentGrid.cols }) as _, c (c)}
            <div class="label col-label" style="grid-row: 1; grid-column: {c + 2}">{c}</div>
          {/each}
          {#each currentGrid.cells as row, r (r)}
            <div class="label row-label" style="grid-row: {r + 2}; grid-column: 1">{r}</div>
            {#each row as cell, c (c)}
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
        {#if routeLine || burst}
          <svg class="route-line" aria-hidden="true">
            {#if routeLine}
              <polyline points={routeLine} />
            {/if}
            {#if burst}
              <g class="burst" style="opacity: {burst.opacity}">
                {#each burst.segments as seg, i (i)}
                  <line x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} />
                {/each}
              </g>
            {/if}
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
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
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
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
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
  .route-line .burst line {
    stroke: #f59e0b;
    stroke-width: 2.5;
    stroke-linecap: round;
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
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
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
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 0.7rem;
    font-weight: 400;
  }
  .cell.black {
    background: #222;
    color: white;
  }
</style>

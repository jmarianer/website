<script lang="ts">
  import InputColumn from '$lib/components/InputColumn.svelte';
  import OutputColumn from '$lib/components/OutputColumn.svelte';
  import { browser } from '$app/environment';

  const DEFAULT_GRID = `
    SVELTE.WVM
    ELZZUP.OIA
    ..J....RTT
    ...A...DEC
    B...G....H
    .L...GGRID
    ..U...E...
    ...E...D..
    SOLVER....
    REVLOS....
  `.replace(/^\s+/gm, '');
  const DEFAULT_WORDS = 'svelte, vite, puzzle, word, blue, jagged, grid, match, solver, missing, typescript';

  const storedGrid = browser ? (localStorage.getItem('grid') || DEFAULT_GRID) : DEFAULT_GRID;
  const storedWords = browser ? (localStorage.getItem('words') || DEFAULT_WORDS) : DEFAULT_WORDS;

  let grid = $state(storedGrid);
  let words = $state(storedWords);
</script>

<div class="page">
  <div class="col col-input">
    <InputColumn bind:grid={grid} bind:words={words} />
  </div>
  <div class="col col-output">
    <OutputColumn grid={grid} words={words} />
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: row;
    gap: 3rem;
    margin: 1rem;
    padding: 3rem;
    background-color: var(--card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  .col {
    min-width: 0;
  }

  .col-input {
    flex: 1 1 33%;
  }

  .col-output {
    flex: 1 1 67%;
  }
</style>
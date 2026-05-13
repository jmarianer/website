<script lang="ts">
	import { toUpper } from "lodash";

  let { grid, words }: { grid: string; words: string } = $props();
  let gridCells = $derived(grid.trim().split('\n').map(row => row.replaceAll(/\s/g, '').split('').map(toUpper)));
  let wordList = $derived(words.trim().split(/,?\s/).map(w => w.trim().toUpperCase()));
</script>

<div class="main">
  <table class="word-grid">
    <tbody>
      {#each gridCells as row, i (i)}
        <tr>
          {#each row as cell, j (j)}
            <td>{cell}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class="word-list">
    <h3>Words</h3>
    <ul>
      {#each wordList as word, i (i)}
        <li>{word}</li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .main {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    table {
      align-self: flex-start;
      border-collapse: collapse;
      border: 3px solid var(--ink);
      box-shadow: var(--shadow-card);

      td {
        width: 38px;
        height: 38px;
        font-family: var(--mono);
        border: 1px solid var(--line-2);
        padding: 0.5rem;
        text-align: center;
      }
    }
  }
</style>
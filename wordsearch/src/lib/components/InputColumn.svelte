<script lang="ts">
  let { grid = $bindable(''), words = $bindable('') }: { grid: string; words: string } = $props();
</script>

<div class="main">
  <div class="input-container">
    <span class="input-label">Grid</span>
    <span class="input-hint">{grid.split('\n').filter((r) => r.trim()).length} rows</span>
    <textarea bind:value={grid} placeholder="Enter your grid here..."></textarea>
  </div>
  <div class="input-container">
    <span class="input-label">Words</span>
    <span class="input-hint">{words.split('\n').filter((w) => w.trim()).length} words</span>
    <textarea bind:value={words}></textarea>
  </div>
</div>

<style>
  .main {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .input-container {
      display: grid;
      grid-template-columns: 1fr 1fr;

      .input-label {
        text-transform: uppercase;
        color: var(--ink-2);
        font-weight: bold;
        font-size: small;
      }

      .input-hint {
        color: var(--ink-3);
        font-size: small;
        text-align: right;
        font-style: italic;
      }

      textarea {
        font-family: var(--mono);
        grid-row: 2;
        grid-column: 1 / 3;
        width: 100%;
        height: 10rem;
        padding: 0.5em;
      }
    }
  }
</style>

<script lang="ts">
  type Answer = {
    wordIndex: number;
    iStart: number;
    jStart: number;
    iEnd: number;
    jEnd: number;
    direction: number;
  }

  let { grid, words }: { grid: string; words: string } = $props();

  let gridCells = $derived(grid.trim().split('\n').map(row => row.replaceAll(/\s/g, '').split('').map(c => c.toUpperCase())));
  let wordList = $derived(words.trim().split(/,?\s/).map(w => w.trim().toUpperCase()));

  let tableEl = $state<Element>();
  let cellEls = $state<Record<string, Element>>({});
  let lines = $state<Array<{ x1: number, y1: number, x2: number, y2: number}>>([]);

  let tableRect = $derived(tableEl?.getBoundingClientRect());

  const DIRECTIONS = [
    { di: 1, dj: 0, name: '↓' },
    { di: 0, dj: 1, name: '→' },
    { di: -1, dj: 0, name: '↑' },
    { di: 0, dj: -1, name: '←' },
    { di: 1, dj: 1, name: '↘' },
    { di: -1, dj: 1, name: '↗' },
    { di: 1, dj: -1, name: '↙' },
    { di: -1, dj: -1, name: '↖' }
  ];

  function tryToFind(word: string, i: number, j: number, wordIndex: number): Array<Answer> {
    return DIRECTIONS.flatMap(({ di, dj }, direction) => {
      if (word.split('').every((char, k) => {
        const ni = i + k * di;
        const nj = j + k * dj;
        return ni >= 0 && ni < gridCells.length && nj >= 0 && nj < gridCells[0].length && gridCells[ni][nj] === char;
      })) {
        return { wordIndex, iStart: i, jStart: j, iEnd: i + (word.length - 1) * di, jEnd: j + (word.length - 1) * dj, direction };
      }
      return [];
    });
  }

  function getAllVectors(): Array<[string, Array<Answer>]> {
    return wordList.map((word, wordIndex) => [
      word,
      gridCells.flatMap((row, i) =>
        row.flatMap((_, j) => tryToFind(word, i, j, wordIndex))
      )
    ])
  }

  const allVectors = $derived(getAllVectors());
  const cleanVectors = $derived(allVectors.filter(([_, answers]) => answers.length === 1));
  const problemVectors = $derived(allVectors.filter(([_, answers]) => answers.length !== 1));

  function answerString({ iStart, jStart, iEnd, jEnd, direction }: Answer): string {
    return `r${iStart + 1}c${jStart + 1} ${DIRECTIONS[direction].name} r${iEnd + 1}c${jEnd + 1}`;
  }

  function computeLines() {
    if (!tableRect) {
      return;
    }
    lines = allVectors.flatMap(([_, answers]) => answers).map(({ iStart, jStart, iEnd, jEnd }) => {
      const a = cellEls[`r${iStart}c${jStart}`].getBoundingClientRect();
      const b = cellEls[`r${iEnd}c${jEnd}`].getBoundingClientRect();
      return {
        x1: a.left + a.width / 2 - tableRect.left,
        y1: a.top + a.height / 2 - tableRect.top,
        x2: b.left + b.width / 2 - tableRect.left,
        y2: b.top + b.height / 2 - tableRect.top
      };

    });
  }

  $effect(() => {
    computeLines();
    const ro = new ResizeObserver(computeLines);
    if (tableEl) ro.observe(tableEl);
    return () => ro.disconnect();
  });

</script>

<div class="main">
  <table class="word-grid" bind:this={tableEl}>
    <tbody>
      {#each gridCells as row, i (i)}
        <tr>
          {#each row as cell, j (j)}
            <td bind:this={cellEls[`r${i}c${j}`]}>{cell}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <svg>
    {#each lines as {x1, y1, x2, y2}, i (i)}
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
    {/each}
  </svg>
  <details>
    <summary>Found cleanly</summary>
    <table class="clean-vectors">
      <tbody>
        {#each cleanVectors as [word, [ answer ]], i (i)}
          <tr>
            <td class="word">{word}</td>
            <td>{answerString(answer)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </details>

  <details open>
    <summary>Needs attention</summary>
    <table class="problem-vectors">
      <tbody>
        {#each problemVectors as [word, answers], i (i)}
          <tr>
            {#if answers.length === 0}
              <td class="missing"><span class="chip">✗</span> <span class="word">{word}</span></td>
            {:else}
              <td class="dup"><span class="chip">{answers.length}×</span> <span class="word">{word}</span></td>
            {/if}
            <td>
              {answers.map(answer => answerString(answer)).join(', ')}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </details>
</div>

<style lang="scss">
  .main {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    table.word-grid {
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

    svg {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;

      line {
        stroke: var(--stroke);
      }
    }

    details {
      summary {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ink-2);
        cursor: pointer;
      }
    }

    .word {
      font-size: 13px;
      font-family: var(--mono);
      color: var(--ink);
      letter-spacing: 0.05em;
    }

    table.clean-vectors, table.problem-vectors {
      width: 100%;
      margin: 1rem;
      border-collapse: collapse;
      font-family: var(--mono);

      td {
        border-top: 1px solid var(--line-2);
        padding: 7px 0;
      }

      td:last-child {
        text-align: end;
        font-size: 11px;
        color: var(--ink-3);
      }
    }

    .problem-vectors {
      .chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 20px;
        border-radius: 3px;
        font-family: var(--mono);
        font-size: 11px;
        font-weight: 700;
        background-color: var(--chip-bg);
      }

      .missing {
        .word {
          color: var(--ink-3);
          text-decoration: line-through;
          text-decoration-color: var(--ink-4);
          text-decoration-thickness: 1px;
        }
        .chip {
          color: var(--bad);
        }
      }

      .dup {
        .chip {
          color: var(--dup);
        }
      }
    }
  }
</style>
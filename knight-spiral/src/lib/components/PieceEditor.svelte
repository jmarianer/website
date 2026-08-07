<script lang="ts">
  import {
    NAMED_LEAPERS,
    NAMED_LEAPER_NAMES,
    letterForOffset,
    formatNotation,
    parseNotation,
    type Offset
  } from '$lib/leaper';
  import { MIN_COLOR_COUNT, MAX_COLOR_COUNT, KNIGHT_OFFSET, COLOR_PALETTE } from '$lib/constants';

  let { pieces = $bindable() }: { pieces: Offset[] } = $props();

  function letterOrCustom(offset: Offset): string {
    return letterForOffset(offset) ?? 'CUSTOM';
  }

  function setLetter(index: number, letter: string) {
    const offset = NAMED_LEAPERS.find(([l]) => l === letter)?.[1];
    if (offset) pieces[index] = { ...offset };
  }

  function setNumber(index: number, key: 'a' | 'b', raw: string) {
    const value = Math.max(0, Math.floor(Number(raw) || 0));
    pieces[index] = { ...pieces[index], [key]: value };
  }

  function addPiece() {
    if (pieces.length >= MAX_COLOR_COUNT) return;
    pieces = [...pieces, { ...KNIGHT_OFFSET }];
  }

  function removePiece(index: number) {
    if (pieces.length <= MIN_COLOR_COUNT) return;
    pieces = pieces.filter((_, i) => i !== index);
  }

  // --- Notation field: same data, kept in sync one way at a time. ---
  // While the field has focus, it's the source of truth and `pieces`
  // follows it on every valid keystroke. While unfocused, `pieces` (however
  // it was last changed, including via the list above) is the source of
  // truth and the field just displays it. This avoids the field's text
  // fighting the user's cursor mid-edit while still staying in sync.
  let notationDraft = $state(formatNotation(pieces));
  let notationError = $state<string | null>(null);
  let notationFocused = false;

  $effect(() => {
    const formatted = formatNotation(pieces);
    if (!notationFocused) {
      notationDraft = formatted;
      notationError = null;
    }
  });

  function onNotationInput() {
    const result = parseNotation(notationDraft);
    if (!result.ok) {
      notationError = result.error;
      return;
    }
    if (result.offsets.length < MIN_COLOR_COUNT || result.offsets.length > MAX_COLOR_COUNT) {
      notationError = `Must have between ${MIN_COLOR_COUNT} and ${MAX_COLOR_COUNT} pieces.`;
      return;
    }
    notationError = null;
    pieces = result.offsets;
  }

  function onNotationFocus() {
    notationFocused = true;
  }

  function onNotationBlur() {
    notationFocused = false;
    notationDraft = formatNotation(pieces);
    notationError = null;
  }
</script>

<div class="editor">
  <ul class="pieces">
    {#each pieces as piece, i (i)}
      <li class="piece">
        <span class="swatch" style:background={COLOR_PALETTE[i % COLOR_PALETTE.length]}></span>
        <select value={letterOrCustom(piece)} onchange={(e) => setLetter(i, e.currentTarget.value)}>
          {#each NAMED_LEAPERS as [letter, offset] (letter)}
            <option value={letter}>{NAMED_LEAPER_NAMES[letter]} ({offset.a},{offset.b})</option>
          {/each}
          <option value="CUSTOM" disabled>Custom</option>
        </select>
        <input
          class="coord"
          type="number"
          min="0"
          value={piece.a}
          oninput={(e) => setNumber(i, 'a', e.currentTarget.value)}
          aria-label="first offset"
        />
        <input
          class="coord"
          type="number"
          min="0"
          value={piece.b}
          oninput={(e) => setNumber(i, 'b', e.currentTarget.value)}
          aria-label="second offset"
        />
        <button
          type="button"
          class="remove"
          onclick={() => removePiece(i)}
          disabled={pieces.length <= MIN_COLOR_COUNT}
          aria-label="Remove piece"
        >
          ×
        </button>
      </li>
    {/each}
  </ul>

  <button type="button" class="add" onclick={addPiece} disabled={pieces.length >= MAX_COLOR_COUNT}>
    + Add piece
  </button>

  <label class="notation">
    Notation
    <input
      type="text"
      value={notationDraft}
      oninput={(e) => {
        notationDraft = e.currentTarget.value;
        onNotationInput();
      }}
      onfocus={onNotationFocus}
      onblur={onNotationBlur}
      class:invalid={notationError !== null}
      spellcheck="false"
    />
  </label>
  {#if notationError}
    <span class="error">{notationError}</span>
  {/if}
</div>

<style>
  .editor {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }

  .pieces {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
  }

  .piece {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.4rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--card);
  }

  .swatch {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  select,
  .coord {
    font: inherit;
    font-size: 0.85rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--card);
    color: var(--ink);
  }

  .coord {
    width: 2.8rem;
    padding: 0.15rem 0.3rem;
  }

  .remove {
    border: none;
    background: none;
    color: var(--ink-3);
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.2rem;
  }

  .remove:disabled {
    visibility: hidden;
  }

  .add {
    font-size: 0.85rem;
    color: var(--ink-2);
    border: 1px dashed var(--line);
    border-radius: var(--radius);
    background: none;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
  }

  .add:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .notation {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--ink-2);
  }

  .notation input {
    font-family: var(--mono);
    font-size: 0.85rem;
    width: 16rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--card);
    color: var(--ink);
  }

  .notation input.invalid {
    border-color: var(--bad);
  }

  .error {
    color: var(--bad);
    font-size: 0.8rem;
  }
</style>

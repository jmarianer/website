# Wordsearch — Design Summary

Outcome of the design grill on 2026-05-12. Decisions are v1 scope; deferred items live in [BACKLOG.md](BACKLOG.md).

## Stack & hosting

- Svelte + Vite + TypeScript.
- Hosted at `wordsearch.joeym.org` (sibling convention).

## Inputs (left column)

- Grid: textarea, paste plain text. Strip intra-line whitespace; preserve empty rows.
- Words: textarea, split on `/[\s,;]+/`.
- Empty-state: textareas with placeholder hints. No example puzzle in v1.
- Live re-solve on every keystroke.

## Normalization

- Uppercase both grid and word list before matching.
- Accept any non-whitespace character (digits, Unicode, accents). No silent accent stripping.

## Solver semantics

- All 8 directions (forward + backward, horizontal/vertical/both diagonals).
- Architecture: solver takes `directions: Vector[]`, so subsets become a one-line change later.
- Match identity = set of cells covered (palindromes deduped at same location; `ABA` in `ABABA` correctly counts twice).
- Jagged grids: solve at native row lengths, `grid[row]?.[col]` returns `undefined` past the edge, no padding, no warning.

## Layout

- Two-column desktop, stacked on mobile.
- Left: inputs + options panel (inline, collapsible, single header bar when collapsed).
- Right: solved grid + word status; muted instructional sentence shown when there's no input.
- Header: just the title (`Word Search Solver`) for v1. No links, no footer.

## Output rendering

- Strikethrough overlay: single blue line (`#00f`) per found word, SVG over the grid.
- Pluggable renderer interface; strikethrough is the only renderer shipped.

## Word status display

- Two lists: **good** (found once) and **bad** (missing or duplicate).
- **good** collapsed by default to `Found cleanly (n) ▸`; collapse state is component-local (persists across keystrokes, resets on reload).
- **bad** always expanded. Sorted: missing first, duplicates second; input order within each group. Leading chip differentiates kind (`✗` missing, `2×` duplicate; duplicate entries list their placements).

## Persistence

- localStorage only, debounced ~250ms. Single key (e.g. `wordsearch:state`) storing `{ grid, words }`.

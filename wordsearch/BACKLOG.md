# Wordsearch v2+ backlog

Features deferred from the initial design (2026-05-12). One-liners; expand into proper issues when picking up.

1. **Direction toggles** — checkboxes for which of the 8 directions to consider.
2. **Other renderer types** — ellipse/pill overlays, cell-background highlights, outline-path, etc.
3. **Multi-renderer color schemes** — palette / hash-color / user-pick once we have more than one renderer.
4. **Hover/click interactions** — hover a word in the list to isolate its strikethrough; click a strikethrough to scroll its entry in the word list into view.
5. **URL-hash sharing** — serialize puzzle state into a shareable URL.
6. **Leading whitespace in grid input** — to support irregularly-shaped grids (L-shapes, hexagonal embedments, etc.).
7. **Multi-word phrases with embedded spaces** — type `CLAUDE CODE` as one entry instead of `CLAUDECODE`.
8. **Image / OCR input** — snap a photo of a puzzle book page.
9. **Dynamic per-cell grid editor** — clickable cells, arrow-key navigation, paste-into-grid.
10. **Near-match suggestions** for missing words — "you typed APLE; the grid contains APPLE at row 3 col 5."
11. **"Try an example" button** — pre-fill a small demo puzzle (with a duplicate and a missing word) so first-time visitors see input format and solved-state at once.
12. **Header chrome: GitHub + homepage links** — add `← joeym.org` and `View source on GitHub` links to the header. Worth doing once across all four SPAs (combinators, crosswords, quickerpass, wordsearch) as a single visual-unification pass.

<script lang="ts">
  import { onMount } from 'svelte';
  import type { PlacedPiece } from '$lib/generate';
  import { COLOR_PALETTE } from '$lib/constants';

  // `placements` is mutated in place by the caller rather than reassigned
  // per batch (reassigning would mean copying the whole array every time,
  // which is O(pieces²) overall). `count` is the reactive signal that
  // tells this effect new pieces have arrived — reading `placements`
  // itself wouldn't, since it's a plain array, not $state.
  let { placements, count }: { placements: PlacedPiece[]; count: number } = $props();

  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;

  let scale = $state(24); // pixels per cell
  let centerX = $state(0);
  let centerY = $state(0);

  const MIN_SCALE = 1;
  const MAX_SCALE = 120;

  function clampScale(value: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }

  // Spatial index so draw() only touches pieces near the viewport instead of
  // all of them every frame — at a million pieces, scanning the full array
  // on every pan/zoom event is the difference between smooth and unusable.
  // Built incrementally (only the newly-arrived slice gets bucketed each
  // time) so indexing stays O(pieces) overall rather than O(pieces) *per
  // redraw*.
  const CHUNK_SIZE = 32; // cells per chunk side
  const CHUNK_KEY_OFFSET = 1_000_000;
  function chunkKey(cx: number, cy: number): number {
    return (cx + CHUNK_KEY_OFFSET) * (2 * CHUNK_KEY_OFFSET) + (cy + CHUNK_KEY_OFFSET);
  }

  // Deliberately a plain Map, not SvelteMap: this is a perf-sensitive
  // internal cache, not something the template reacts to — reactivity is
  // driven by `count` instead, so a reactive Map here would only add proxy
  // overhead to the hot path this exists to speed up.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  let chunks = new Map<number, PlacedPiece[]>();
  let indexedCount = 0;
  let indexedPlacements: PlacedPiece[] | null = null;

  function ensureIndexed() {
    if (placements !== indexedPlacements) {
      chunks = new Map();
      indexedCount = 0;
      indexedPlacements = placements;
    }
    for (let i = indexedCount; i < placements.length; i++) {
      const p = placements[i];
      const key = chunkKey(Math.floor(p.x / CHUNK_SIZE), Math.floor(p.y / CHUNK_SIZE));
      let bucket = chunks.get(key);
      if (!bucket) {
        bucket = [];
        chunks.set(key, bucket);
      }
      bucket.push(p);
    }
    indexedCount = placements.length;
  }

  /** The view never auto-fits to content — only this initial default, and
   *  whatever the user pans/zooms to from there. */
  const DEFAULT_BOX_CELLS = 100;

  function resetToDefaultView() {
    centerX = 0;
    centerY = 0;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    scale = clampScale(Math.min(rect.width, rect.height) / DEFAULT_BOX_CELLS);
  }

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ensureIndexed();

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const originX = rect.width / 2;
    const originY = rect.height / 2;
    const cellSize = scale;

    // Snap each cell edge to a pixel boundary shared with its neighbor
    // (both sides of the edge between cell x and x+1 round the same
    // x+0.5 input to the same pixel) rather than deriving each cell's
    // rect independently from its own center — the latter lets adjacent
    // cells round to non-touching pixels, leaving a seam that moirés at
    // certain zoom levels.
    const boardXToPixel = (gx: number) => Math.round(originX + (gx - centerX) * cellSize);
    const boardYToPixel = (gy: number) => Math.round(originY - (gy - centerY) * cellSize);

    // Only walk chunks overlapping the viewport (padded by one chunk) —
    // at large piece counts almost all of the board is off-screen, and
    // this is what keeps per-frame cost proportional to what's visible
    // instead of to total piece count.
    const visibleMinX = centerX - rect.width / 2 / scale;
    const visibleMaxX = centerX + rect.width / 2 / scale;
    const visibleMinY = centerY - rect.height / 2 / scale;
    const visibleMaxY = centerY + rect.height / 2 / scale;
    const minChunkX = Math.floor(visibleMinX / CHUNK_SIZE) - 1;
    const maxChunkX = Math.floor(visibleMaxX / CHUNK_SIZE) + 1;
    const minChunkY = Math.floor(visibleMinY / CHUNK_SIZE) - 1;
    const maxChunkY = Math.floor(visibleMaxY / CHUNK_SIZE) + 1;

    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        const bucket = chunks.get(chunkKey(cx, cy));
        if (!bucket) continue;

        for (const p of bucket) {
          const left = boardXToPixel(p.x - 0.5);
          const right = boardXToPixel(p.x + 0.5);
          const top = boardYToPixel(p.y + 0.5);
          const bottom = boardYToPixel(p.y - 0.5);
          if (right < 0 || left > rect.width || bottom < 0 || top > rect.height) {
            continue;
          }
          ctx.fillStyle = COLOR_PALETTE[p.color % COLOR_PALETTE.length];
          ctx.fillRect(left, top, right - left, bottom - top);
        }
      }
    }
  }

  // Tracks every finger/pointer currently down, keyed by pointerId — needed
  // (rather than a single "dragging" flag + last position) to support
  // two-finger pinch-to-zoom alongside single-finger pan. Plain Map, not
  // $state: purely internal gesture bookkeeping, never read by rendering.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const activePointers = new Map<number, { x: number; y: number }>();
  let lastPinchDistance = 0;
  let lastPinchMidX = 0;
  let lastPinchMidY = 0;

  function canvasPoint(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  /** Distance and midpoint between the first two active pointers. */
  function pinchState() {
    const [a, b] = [...activePointers.values()];
    return {
      distance: Math.hypot(b.x - a.x, b.y - a.y),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2
    };
  }

  function onPointerDown(event: PointerEvent) {
    activePointers.set(event.pointerId, canvasPoint(event));
    // Best-effort: keeps receiving events if a finger drags outside the
    // canvas, but our own tracking above doesn't depend on it succeeding.
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Ignored.
    }

    // A second finger just landed: (re)baseline the pinch gesture from
    // its current distance/midpoint so the next move doesn't jump.
    if (activePointers.size === 2) {
      ({ distance: lastPinchDistance, midX: lastPinchMidX, midY: lastPinchMidY } = pinchState());
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!activePointers.has(event.pointerId)) return;
    const rect = canvas.getBoundingClientRect();

    if (activePointers.size === 1) {
      const previous = activePointers.get(event.pointerId)!;
      const current = canvasPoint(event);
      activePointers.set(event.pointerId, current);
      centerX -= (current.x - previous.x) / scale;
      centerY += (current.y - previous.y) / scale;
      return;
    }

    // Two (or more, extras ignored) fingers down: pinch-to-zoom, anchored
    // on the midpoint, plus whatever pan falls out of the midpoint moving.
    activePointers.set(event.pointerId, canvasPoint(event));
    const { distance, midX, midY } = pinchState();

    const boardX = centerX + (lastPinchMidX - rect.width / 2) / scale;
    const boardY = centerY - (lastPinchMidY - rect.height / 2) / scale;

    const zoomFactor = lastPinchDistance > 0 ? distance / lastPinchDistance : 1;
    const newScale = clampScale(scale * zoomFactor);

    centerX = boardX - (midX - rect.width / 2) / newScale;
    centerY = boardY + (midY - rect.height / 2) / newScale;
    scale = newScale;

    lastPinchDistance = distance;
    lastPinchMidX = midX;
    lastPinchMidY = midY;
  }

  function onPointerUp(event: PointerEvent) {
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Ignored: already released, or capture never succeeded.
    }
    activePointers.delete(event.pointerId);
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const boardX = centerX + (pointerX - rect.width / 2) / scale;
    const boardY = centerY - (pointerY - rect.height / 2) / scale;

    const zoomFactor = Math.exp(-event.deltaY * 0.001);
    const newScale = clampScale(scale * zoomFactor);

    centerX = boardX - (pointerX - rect.width / 2) / newScale;
    centerY = boardY + (pointerY - rect.height / 2) / newScale;
    scale = newScale;
  }

  onMount(() => {
    resetToDefaultView();
    const resizeObserver = new ResizeObserver(() => draw());
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  });

  // Pure render: reacts to count/centerX/centerY/scale, never writes them.
  $effect(() => {
    const _count = count; // dependency: redraw whenever placements grows
    draw();
  });
</script>

<div class="board" bind:this={container}>
  <canvas
    bind:this={canvas}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    onwheel={onWheel}
  ></canvas>
</div>

<style>
  .board {
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: none;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
  }
  canvas:active {
    cursor: grabbing;
  }
</style>

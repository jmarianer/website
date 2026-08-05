<script lang="ts">
	import { onMount } from 'svelte';
	import type { PlacedPiece } from '$lib/generate';
	import { COLOR_PALETTE } from '$lib/constants';

	let { placements }: { placements: PlacedPiece[] } = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;

	let scale = $state(24); // pixels per cell
	let centerX = $state(0);
	let centerY = $state(0);

	const MAX_SCALE = 120;

	/** The view never auto-fits to content — only this initial default, and
	 *  whatever the user pans/zooms to from there. */
	const DEFAULT_BOX_CELLS = 100;

	function resetToDefaultView() {
		centerX = 0;
		centerY = 0;
		const rect = container.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;
		scale = Math.min(MAX_SCALE, Math.min(rect.width, rect.height) / DEFAULT_BOX_CELLS);
	}

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

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
		const cellSize = Math.max(scale, 1);

		// Snap each cell edge to a pixel boundary shared with its neighbor
		// (both sides of the edge between cell x and x+1 round the same
		// x+0.5 input to the same pixel) rather than deriving each cell's
		// rect independently from its own center — the latter lets adjacent
		// cells round to non-touching pixels, leaving a seam that moirés at
		// certain zoom levels.
		const boardXToPixel = (gx: number) => Math.round(originX + (gx - centerX) * cellSize);
		const boardYToPixel = (gy: number) => Math.round(originY - (gy - centerY) * cellSize);

		for (const p of placements) {
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

	let dragging = false;
	let lastPointerX = 0;
	let lastPointerY = 0;

	function onPointerDown(event: PointerEvent) {
		dragging = true;
		lastPointerX = event.clientX;
		lastPointerY = event.clientY;
		canvas.setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		const dx = event.clientX - lastPointerX;
		const dy = event.clientY - lastPointerY;
		lastPointerX = event.clientX;
		lastPointerY = event.clientY;
		centerX -= dx / scale;
		centerY += dy / scale;
	}

	function onPointerUp(event: PointerEvent) {
		dragging = false;
		canvas.releasePointerCapture(event.pointerId);
	}

	function onWheel(event: WheelEvent) {
		event.preventDefault();
		const rect = canvas.getBoundingClientRect();
		const pointerX = event.clientX - rect.left;
		const pointerY = event.clientY - rect.top;

		const boardX = centerX + (pointerX - rect.width / 2) / scale;
		const boardY = centerY - (pointerY - rect.height / 2) / scale;

		const zoomFactor = Math.exp(-event.deltaY * 0.001);
		const newScale = Math.min(MAX_SCALE, scale * zoomFactor);

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

	// Pure render: reacts to placements/centerX/centerY/scale, never writes them.
	$effect(() => {
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

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { PlacedPiece } from '$lib/generate';
	import { COLOR_PALETTE } from '$lib/constants';

	let { placements, generationId }: { placements: PlacedPiece[]; generationId: number } = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;

	let scale = $state(24); // pixels per cell
	let centerX = $state(0);
	let centerY = $state(0);

	const MAX_SCALE = 120;
	const FIT_MARGIN_CELLS = 2;

	let lastFitGenerationId = -1;

	interface Box {
		minX: number;
		maxX: number;
		minY: number;
		maxY: number;
	}

	function boundingBox(pieces: PlacedPiece[]): Box {
		let minX = 0;
		let maxX = 0;
		let minY = 0;
		let maxY = 0;
		for (const p of pieces) {
			minX = Math.min(minX, p.x);
			maxX = Math.max(maxX, p.x);
			minY = Math.min(minY, p.y);
			maxY = Math.max(maxY, p.y);
		}
		return { minX, maxX, minY, maxY };
	}

	function visibleBounds(): Box {
		const rect = container.getBoundingClientRect();
		return {
			minX: centerX - rect.width / 2 / scale,
			maxX: centerX + rect.width / 2 / scale,
			minY: centerY - rect.height / 2 / scale,
			maxY: centerY + rect.height / 2 / scale
		};
	}

	function exceedsVisibleBounds(box: Box): boolean {
		const visible = visibleBounds();
		return (
			box.minX < visible.minX ||
			box.maxX > visible.maxX ||
			box.minY < visible.minY ||
			box.maxY > visible.maxY
		);
	}

	function fitToBounds(box: Box) {
		if (!container) return;
		const width = box.maxX - box.minX + 1 + FIT_MARGIN_CELLS * 2;
		const height = box.maxY - box.minY + 1 + FIT_MARGIN_CELLS * 2;
		const rect = container.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;

		const fitScale = Math.min(rect.width / width, rect.height / height);
		scale = Math.min(MAX_SCALE, fitScale);
		centerX = (box.minX + box.maxX) / 2;
		centerY = (box.minY + box.maxY) / 2;
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

		for (const p of placements) {
			const screenX = originX + (p.x - centerX) * cellSize;
			const screenY = originY - (p.y - centerY) * cellSize;
			if (
				screenX < -cellSize ||
				screenX > rect.width + cellSize ||
				screenY < -cellSize ||
				screenY > rect.height + cellSize
			) {
				continue;
			}
			ctx.fillStyle = COLOR_PALETTE[p.color % COLOR_PALETTE.length];
			ctx.fillRect(screenX - cellSize / 2, screenY - cellSize / 2, cellSize, cellSize);
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
		const resizeObserver = new ResizeObserver(() => draw());
		resizeObserver.observe(container);
		return () => resizeObserver.disconnect();
	});

	// Decides whether the (possibly newly grown) pattern needs a fit. Reads
	// centerX/centerY/scale untracked since this effect also writes them via
	// fitToBounds — tracking a self-written dependency here would make the
	// effect re-trigger itself.
	$effect(() => {
		if (placements.length === 0) return;

		const box = boundingBox(placements);
		const isNewGeneration = generationId !== lastFitGenerationId;
		const needsRefit = isNewGeneration || untrack(() => exceedsVisibleBounds(box));
		if (needsRefit) {
			fitToBounds(box);
			lastFitGenerationId = generationId;
		}
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

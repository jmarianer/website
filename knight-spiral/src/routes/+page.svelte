<script lang="ts">
	import { untrack } from 'svelte';
	import Board from '$lib/components/Board.svelte';
	import { GenerationClient } from '$lib/generate-client';
	import type { PlacedPiece } from '$lib/generate';
	import {
		DEFAULT_COLOR_COUNT,
		MIN_COLOR_COUNT,
		MAX_COLOR_COUNT,
		MAX_TOTAL_PIECES
	} from '$lib/constants';

	let colorCount = $state(DEFAULT_COLOR_COUNT);
	let debouncedColorCount = $state(DEFAULT_COLOR_COUNT);

	let placements = $state.raw<PlacedPiece[]>([]);
	let generationId = $state(0);
	let generating = $state(false);

	$effect(() => {
		const value = colorCount;
		const timeout = setTimeout(() => {
			debouncedColorCount = value;
		}, 200);
		return () => clearTimeout(timeout);
	});

	const client = new GenerationClient();

	$effect(() => {
		const colors = debouncedColorCount;

		placements = [];
		generationId = untrack(() => generationId) + 1;
		generating = true;

		client.generate(
			{ colorCount: colors, pieceCount: MAX_TOTAL_PIECES },
			{
				onBatch: (batch) => {
					placements = [...placements, ...batch];
				},
				onDone: () => {
					generating = false;
				}
			}
		);

		return () => client.cancel();
	});
</script>

<div class="page">
	<header>
		<h1>Knight Spiral</h1>
		<label>
			Colors
			<input
				type="range"
				min={MIN_COLOR_COUNT}
				max={MAX_COLOR_COUNT}
				step="1"
				bind:value={colorCount}
			/>
			<span class="value">{colorCount}</span>
		</label>
		{#if generating}
			<span class="status">generating…</span>
		{/if}
	</header>
	<main>
		<Board {placements} {generationId} />
	</main>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid var(--line);
	}

	h1 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--ink);
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ink-2);
		font-size: 0.9rem;
	}

	.value {
		min-width: 1.5ch;
		text-align: right;
		font-family: var(--mono);
		color: var(--ink);
	}

	.status {
		color: var(--ink-3);
		font-size: 0.85rem;
		font-style: italic;
	}

	main {
		flex: 1;
		min-height: 0;
	}
</style>

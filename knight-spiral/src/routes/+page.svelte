<script lang="ts">
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

	// Mutated in place rather than reassigned+copied per batch: copying the
	// whole accumulated array on every batch made total main-thread work
	// O(pieces²). placementsCount is the reactive signal Board watches for
	// redraws — its value happens to be placements.length, but the write is
	// what matters, not the read.
	// svelte-ignore non_reactive_update
	let placements: PlacedPiece[] = [];
	let placementsCount = $state(0);
	let generating = $state(false);
	let lastGenerationMs = $state<number | null>(null);

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
		placementsCount = 0;
		generating = true;
		const startedAt = performance.now();

		client.generate(
			{ colorCount: colors, pieceCount: MAX_TOTAL_PIECES },
			{
				onBatch: (batch) => {
					placements.push(...batch);
					placementsCount = placements.length;
				},
				onDone: () => {
					generating = false;
					lastGenerationMs = Math.round(performance.now() - startedAt);
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
			<span class="status">
				generating…
				<progress class="progress" value={placementsCount} max={MAX_TOTAL_PIECES}></progress>
			</span>
		{:else if lastGenerationMs !== null}
			<span class="status">generation complete in {lastGenerationMs}ms</span>
		{/if}
	</header>
	<main>
		<Board {placements} count={placementsCount} />
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ink-3);
		font-size: 0.85rem;
		font-style: italic;
	}

	.progress {
		width: 8rem;
		height: 0.4rem;
		accent-color: var(--accent);
	}

	main {
		flex: 1;
		min-height: 0;
	}
</style>

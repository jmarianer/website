<script lang="ts">
	import { onMount } from 'svelte';
	import Board from '$lib/components/Board.svelte';
	import PieceEditor from '$lib/components/PieceEditor.svelte';
	import { GenerationClient } from '$lib/generate-client';
	import type { PlacedPiece } from '$lib/generate';
	import { formatNotation, parseNotation, type Offset } from '$lib/leaper';
	import {
		DEFAULT_PIECES,
		MAX_TOTAL_PIECES,
		MIN_COLOR_COUNT,
		MAX_COLOR_COUNT
	} from '$lib/constants';

	let pieces = $state<Offset[]>(DEFAULT_PIECES.map((o) => ({ ...o })));
	let debouncedPieces = $state<Offset[]>(DEFAULT_PIECES.map((o) => ({ ...o })));

	// The URL hash is a shareable/bookmarkable mirror of the notation field.
	// Read once on load (a malformed or out-of-range hash is ignored, keeping
	// the default); written back on every settled change via replaceState so
	// it doesn't spam browser history.
	onMount(() => {
		const hash = window.location.hash.slice(1);
		if (!hash) return;
		const result = parseNotation(hash);
		if (
			result.ok &&
			result.offsets.length >= MIN_COLOR_COUNT &&
			result.offsets.length <= MAX_COLOR_COUNT
		) {
			pieces = result.offsets;
		}
	});

	$effect(() => {
		const hash = `#${formatNotation(debouncedPieces)}`;
		if (window.location.hash !== hash) {
			history.replaceState(null, '', hash);
		}
	});

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
		const snapshot = pieces.map((o) => ({ ...o })); // deep read: registers on any edit
		const timeout = setTimeout(() => {
			debouncedPieces = snapshot;
		}, 200);
		return () => clearTimeout(timeout);
	});

	const client = new GenerationClient();

	$effect(() => {
		// Plain objects, not $state proxies — postMessage can't structured-clone
		// a Svelte reactive proxy across the worker boundary.
		const offsetsByColor = debouncedPieces.map((o) => ({ a: o.a, b: o.b }));

		placements = [];
		placementsCount = 0;
		generating = true;
		const startedAt = performance.now();

		client.generate(
			{ offsetsByColor, pieceCount: MAX_TOTAL_PIECES },
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
		<PieceEditor bind:pieces />
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

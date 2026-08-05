<script lang="ts">
	import './layout.scss';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>Knight Spiral</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

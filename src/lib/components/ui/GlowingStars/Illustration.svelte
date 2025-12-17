<script lang="ts">
	import { cn } from '$lib/utils';
	import Glow from './Glow.svelte';
	import Star from './Star.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let { mouseEnter = false }: { mouseEnter: boolean } = $props();

	const stars = 216;
	const columns = 18;
	let glowingStars = $state<number[]>([]);

	// Generate random glowing stars
	$effect(() => {
		const interval = setInterval(() => {
			const newHighlightedStars = Array.from({ length: 5 }, () =>
				Math.floor(Math.random() * stars)
			);
			glowingStars = [...newHighlightedStars];
		}, 3000);

		return () => clearInterval(interval);
	});
</script>

<div
	class="h-90 w-full p-1"
	style={`display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 1px;`}
>
	{#each [...Array(stars)] as star, starIdx (`matrix-col-${starIdx}}`)}
		{@const isGlowing = glowingStars.includes(starIdx)}
		{@const delay = (starIdx % 10) * 0.1}
		{@const staticDelay = starIdx * 0.01}

		<div class="relative flex items-center justify-center">
			<Star isGlowing={mouseEnter ? true : isGlowing} delay={mouseEnter ? staticDelay : delay} />
			{#if mouseEnter}
				<Glow delay={staticDelay} />
			{/if}
			{#if isGlowing}
				<Glow {delay} />
			{/if}
		</div>
	{/each}
</div>

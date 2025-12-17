<script lang="ts">
	import { onMount } from 'svelte';

	let randomMove = () => Math.random() * 4 - 2;

	interface Star {
		id: string;
		initialTop: number;
		initialLeft: number;
		randomTopMove: number;
		randomLeftMove: number;
		opacity: number;
		duration: number;
	}

	// Pre-calculate random values for each star to maintain consistency
	let stars = $state<Star[]>([]);

	// Initialize stars when component mounts
	onMount(() => {
		const newStars: Star[] = [];
		for (let i = 0; i < 40; i++) {
			newStars.push({
				id: `star-${i}`,
				initialTop: Math.random() * 100,
				initialLeft: Math.random() * 100,
				randomTopMove: randomMove(),
				randomLeftMove: randomMove(),
				opacity: Math.random(),
				duration: Math.random() * 10 + 20
			});
		}
		stars = newStars;
	});
</script>

<div class="absolute inset-0 z-40">
	{#each stars as star (`${star.id}`)}
		<span
			class="star-animation z-50 inline-block"
			style={`position: absolute;
				width: 2px;
				height: 2px;
				background-color: white;
				border-radius: 50%;
				top: calc(${star.initialTop}% + ${star.randomTopMove}px);
				left: calc(${star.initialLeft}% + ${star.randomLeftMove}px);
				z-index: 1;
				opacity: ${star.opacity};
				animation: sparkle-move ${star.duration}s linear infinite;`}
		></span>
	{/each}
</div>

<style>
	@keyframes star-move {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(0);
		}
	}

	.star-animation {
		position: absolute;
	}
</style>

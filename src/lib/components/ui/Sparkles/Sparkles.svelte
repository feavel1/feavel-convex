<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let randomMove = () => Math.random() * 4 - 2;

	let {
		minSize = 3,
		maxSize = 3,
		speed = 2,
		particleColor = '#000000',
		particleDensity = 60,
		className = undefined
	}: {
		minSize?: number;
		maxSize?: number;
		speed?: number;
		particleColor?: string;
		particleDensity?: number;
		className?: string;
	} = $props();

	function getRandomValue() {
		return minSize + Math.random() * (maxSize - minSize);
	}

	interface Particle {
		id: string;
		initialTop: number;
		initialLeft: number;
		randomTopMove: number;
		randomLeftMove: number;
		opacity: number;
		duration: number;
	}

	// Pre-calculate random values for each particle to maintain consistency
	let particles = $state<Particle[]>([]);

	// Initialize particles when component mounts
	onMount(() => {
		const newParticles: Particle[] = [];
		for (let i = 0; i < particleDensity; i++) {
			newParticles.push({
				id: `star-${i}`,
				initialTop: Math.random() * 100,
				initialLeft: Math.random() * 100,
				randomTopMove: randomMove(),
				randomLeftMove: randomMove(),
				opacity: Math.random(),
				duration: Math.random() * 10 + speed
			});
		}
		particles = newParticles;
	});
</script>

<div class={cn('relative h-48', className)}>
	<div class="absolute inset-0">
		{#each particles as particle (`${particle.id}`)}
			<span
				class="inline-block sparkle-animation"
				style={`position: absolute;
					width: ${getRandomValue()}px;
					height: ${getRandomValue()}px;
					background-color: ${particleColor};
					border-radius: 50%;
					top: calc(${particle.initialTop}% + ${particle.randomTopMove}px);
					left: calc(${particle.initialLeft}% + ${particle.randomLeftMove}px);
					animation: sparkle-move ${particle.duration}s linear infinite;
					opacity: ${particle.opacity};`
				}
			></span>
		{/each}
	</div>
</div>

<style>
	@keyframes sparkle-move {
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

	.sparkle-animation {
		position: absolute;
	}
</style>

<script lang="ts">
	import { cn } from '$lib/utils';

	let { isGlowing = false, delay = 0 }: { isGlowing: boolean; delay: number } = $props();

	let animationClass = $derived(
		isGlowing
			? `star-glow-animation ${delay > 0 ? 'animate-delay-' + Math.round(delay * 1000) : ''}`
			: ''
	);

	const bgColor = $derived(isGlowing ? '#fff' : '#666');
</script>

<div
	class={cn('relative z-20 h-[1px] w-[1px] rounded-full', animationClass)}
	style="background-color: {bgColor};"
></div>

<style>
	@keyframes star-glow {
		0% {
			transform: scale(1);
			background-color: #666;
		}
		20% {
			transform: scale(1.2);
			background-color: #fff;
		}
		50% {
			transform: scale(2.5);
			background-color: #fff;
		}
		70% {
			transform: scale(2.2);
			background-color: #fff;
		}
		100% {
			transform: scale(1.5);
			background-color: #fff;
		}
	}

	.star-glow-animation {
		animation: star-glow 2s ease-in-out;
	}

	/* Create delay utility classes */
	:global(.animate-delay-100) {
		animation-delay: 100ms;
	}
	:global(.animate-delay-200) {
		animation-delay: 200ms;
	}
	:global(.animate-delay-300) {
		animation-delay: 300ms;
	}
	:global(.animate-delay-400) {
		animation-delay: 400ms;
	}
	:global(.animate-delay-500) {
		animation-delay: 500ms;
	}
	:global(.animate-delay-600) {
		animation-delay: 600ms;
	}
	:global(.animate-delay-700) {
		animation-delay: 700ms;
	}
	:global(.animate-delay-800) {
		animation-delay: 800ms;
	}
	:global(.animate-delay-900) {
		animation-delay: 900ms;
	}
	:global(.animate-delay-1000) {
		animation-delay: 1000ms;
	}
	:global(.animate-delay-1500) {
		animation-delay: 1500ms;
	}
	:global(.animate-delay-2000) {
		animation-delay: 2000ms;
	}
</style>

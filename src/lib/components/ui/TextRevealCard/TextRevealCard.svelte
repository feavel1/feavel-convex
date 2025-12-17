<script lang="ts">
	import { cn } from '$lib/utils';
	import Stars from './Stars.svelte';

	let {
		children,
		text = '',
		revealText = '',
		className = undefined
	}: {
		children?: any;
		text: string;
		revealText: string;
		className?: string;
	} = $props();

	let widthPercentage = $state(0);
	let cardRef: HTMLDivElement | null = $state(null);
	let left = $state(0);
	let localWidth = $state(0);
	let isMouseOver = $state(false);

	$effect(() => {
		if (cardRef) {
			const { left: newLeft, width: newLocalWidth } = cardRef.getBoundingClientRect();
			left = newLeft;
			localWidth = newLocalWidth;
		}
	});

	function mouseMoveHandler(event: MouseEvent) {
		event.preventDefault();

		const { clientX } = event;
		if (cardRef) {
			const relativeX = clientX - left;
			widthPercentage = (relativeX / localWidth) * 100;
		}
	}

	function mouseLeaveHandler() {
		isMouseOver = false;
		widthPercentage = 0;
	}

	function mouseEnterHandler() {
		isMouseOver = true;
	}

	const rotateDeg = $derived((widthPercentage - 50) * 0.1);
</script>

<div
	onmouseenter={mouseEnterHandler}
	onmouseleave={mouseLeaveHandler}
	onmousemove={mouseMoveHandler}
	bind:this={cardRef}
	role="region"
	class={cn(
		'relative w-[40rem] overflow-hidden rounded-lg border border-white/[0.08] bg-[#1d1c20] p-8',
		className
	)}
>
	{@render children?.()}

	<div class="relative flex h-40 items-center overflow-hidden">
		<div
			class="reveal-text absolute z-20 bg-[#1d1c20] transition-all duration-300 ease-out will-change-transform"
			style={`opacity: ${isMouseOver && widthPercentage > 0 ? 1 : 0}; clip-path: inset(0 ${100 - widthPercentage}% 0 0);`}
		>
			<p
				style="text-shadow: 4px 4px 15px rgba(0,0,0,0.5);"
				class="bg-gradient-to-b from-white to-neutral-300 bg-clip-text py-10 text-base font-bold text-transparent text-white sm:text-[3rem]"
			>
				{revealText}
			</p>
		</div>

		<div
			class="absolute z-50 h-40 w-[8px] bg-gradient-to-b from-transparent via-neutral-800 to-transparent transition-all duration-300 ease-out will-change-transform"
			style={`left: ${widthPercentage}%; transform: rotate(${rotateDeg}deg); opacity: ${widthPercentage > 0 ? 1 : 0};`}
		></div>

		<div
			class="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]"
		>
			<p
				class="bg-[#323238] bg-clip-text py-10 text-base font-bold text-transparent sm:text-[3rem]"
			>
				{text}
			</p>
			<Stars />
		</div>
	</div>
</div>

<style>
	.reveal-text {
		width: 100%;
		transition:
			clip-path 0.3s ease-out,
			opacity 0.3s ease-out;
	}
</style>

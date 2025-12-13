<script lang="ts">
	import { Motion } from 'svelte-motion';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import Stars from './Stars.svelte';

	export let text: string;
	export let revealText: string;
	export let className: string | undefined = undefined;

	let widthPercentage = 0;
	let cardRef: HTMLDivElement;
	let left = 0;
	let localWidth = 0;
	let isMouseOver = false;

	onMount(() => {
		if (cardRef) {
			const { left: newLeft, width: newLocalWidth } = cardRef.getBoundingClientRect();
			left = newLeft;
			localWidth = newLocalWidth;
		}
	});

	function mouseMoveHandler(event: any) {
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

	const rotateDeg = (widthPercentage - 50) * 0.1;
</script>

<div
	on:mouseenter={mouseEnterHandler}
	on:mouseleave={mouseLeaveHandler}
	on:mousemove={mouseMoveHandler}
	bind:this={cardRef}
	class={cn(
		'relative w-[40rem] overflow-hidden rounded-lg border border-white/[0.08] bg-[#1d1c20] p-8',
		className
	)}
>
	<slot />

	<div class="relative flex h-40 items-center overflow-hidden">
		<Motion
			let:motion
			style={{
				width: '100%'
			}}
			animate={isMouseOver
				? {
						opacity: widthPercentage > 0 ? 1 : 0,
						clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`
					}
				: {
						clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`
					}}
			transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
		>
			<div use:motion class="absolute z-20 bg-[#1d1c20] will-change-transform">
				<p
					style="text-shadow: 4px 4px 15px rgba(0,0,0,0.5);"
					class="bg-gradient-to-b from-white to-neutral-300 bg-clip-text py-10 text-base font-bold text-transparent text-white sm:text-[3rem]"
				>
					{revealText}
				</p>
			</div>
		</Motion>
		<Motion
			let:motion
			animate={{
				left: `${widthPercentage}%`,
				rotate: `${rotateDeg}deg`,
				opacity: widthPercentage > 0 ? 1 : 0
			}}
			transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
		>
			<div
				use:motion
				class="absolute z-50 h-40 w-[8px] bg-gradient-to-b from-transparent via-neutral-800 to-transparent will-change-transform"
			></div>
		</Motion>

		<div
			class=" overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]"
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

<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		text = undefined,
		className = undefined
	}: {
		text?: string;
		className?: string;
	} = $props();

	let mouseX = $state(0);
	let mouseY = $state(0);
	let randomString = $state('');

	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const generateRandomString = (length: number) => {
		let result = '';
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		return result;
	};

	$effect(() => {
		// Initialize random string on mount
		randomString = generateRandomString(10);
	});

	function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
		if (currentTarget instanceof HTMLElement) {
			const { left, top } = currentTarget.getBoundingClientRect();
			mouseX = clientX - left;
			mouseY = clientY - top;

			randomString = generateRandomString(1500);
		}
	}
</script>

<div
	class={cn(
		'aspect-square relative flex h-full w-full items-center justify-center bg-transparent p-0.5',
		className
	)}
>
	<div
		onmousemove={onMouseMove}
		role="presentation"
		class="group/card relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-transparent"
		style={`--mouse-x: ${mouseX}px; --mouse-y: ${mouseY}px;`}
	>
		<div class="pointer-events-none">
			<div
				class="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"
			></div>
			<div
				class="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 to-blue-700 opacity-0 backdrop-blur-xl transition duration-500 group-hover/card:opacity-100"
				style={`mask-image: radial-gradient(250px at var(--mouse-x) var(--mouse-y), white, transparent); -webkit-mask-image: radial-gradient(250px at var(--mouse-x) var(--mouse-y), white, transparent);`}
			></div>
			<div
				class="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
				style={`mask-image: radial-gradient(250px at var(--mouse-x) var(--mouse-y), white, transparent); -webkit-mask-image: radial-gradient(250px at var(--mouse-x) var(--mouse-y), white, transparent);`}
			>
				<p
					class="absolute inset-x-0 h-full whitespace-pre-wrap break-words font-mono text-xs font-bold text-white transition duration-500"
				>
					{randomString}
				</p>
			</div>
		</div>
		<div class="relative z-10 flex items-center justify-center">
			<div
				class="relative flex h-44 w-44 items-center justify-center rounded-full text-4xl font-bold text-white"
			>
				<div
					class="absolute h-full w-full rounded-full bg-white/[0.8] blur-sm dark:bg-black/[0.8]"
				></div>
				{#if text}
					<span class="z-20 text-black dark:text-white">{text}</span>
				{/if}
			</div>
		</div>
	</div>
</div>

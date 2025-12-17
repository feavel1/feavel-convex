<script lang="ts">
	import { cn } from '$lib/utils';

	let { children, className = undefined }: { children?: any; className?: string } = $props();
</script>

<div
	class={cn(
		'relative z-0 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden rounded-md bg-slate-950',
		className
	)}
>
	<div
		class="animate-lamp-start relative isolate z-0 flex w-full flex-1 scale-y-125 items-center justify-center"
	>
		<div
			class="animate-lamp-grow-1 absolute inset-auto right-1/2 h-56 w-[15rem] overflow-visible text-white [--conic-position:from_70deg_at_center_top]"
			style="background-image: conic-gradient(var(--conic-position), var(--tw-gradient-stops));"
		>
			<div
				class="bg-gradient-conic absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible from-cyan-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
			>
				<div
					class="absolute bottom-0 left-0 z-20 h-40 w-[100%] bg-slate-950 [mask-image:linear-gradient(to_top,white,transparent)]"
				></div>
				<div
					class="absolute bottom-0 left-0 z-20 h-[100%] w-40 bg-slate-950 [mask-image:linear-gradient(to_right,white,transparent)]"
				></div>
			</div>
		</div>

		<div
			class="animate-lamp-grow-2 absolute inset-auto left-1/2 h-56 w-[15rem] overflow-visible text-white [--conic-position:from_290deg_at_center_top]"
			style="background-image: conic-gradient(var(--conic-position), var(--tw-gradient-stops));"
		>
			<div
				class="bg-gradient-conic absolute inset-auto left-1/2 h-56 w-[30rem] from-transparent via-transparent to-cyan-500 text-white [--conic-position:from_290deg_at_center_top]"
			>
				<div
					class="absolute right-0 bottom-0 z-20 h-[100%] w-40 bg-slate-950 [mask-image:linear-gradient(to_left,white,transparent)]"
				></div>
				<div
					class="absolute right-0 bottom-0 z-20 h-40 w-[100%] bg-slate-950 [mask-image:linear-gradient(to_top,white,transparent)]"
				></div>
			</div>
		</div>

		<div
			class="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-slate-950 blur-2xl"
		></div>
		<div class="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
		<div
			class="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-cyan-500 opacity-50 blur-3xl"
		></div>

		<div
			class="animate-lamp-grow-3 absolute inset-auto z-30 h-36 w-[8rem] -translate-y-[6rem] rounded-full bg-cyan-400 blur-2xl"
		></div>

		<div
			class="animate-lamp-grow-4 absolute inset-auto z-50 h-0.5 w-[15rem] -translate-y-[7rem] bg-cyan-400"
		></div>

		<div class="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-slate-950"></div>
	</div>

	<div class="relative z-50 flex -translate-y-80 flex-col items-center px-5">
		{@render children?.()}
	</div>
</div>

<style>
	@keyframes lamp-grow {
		0% {
			width: 15rem;
			opacity: 0.5;
		}
		100% {
			width: 30rem;
			opacity: 1;
		}
	}

	@keyframes lamp-grow-3 {
		0% {
			width: 8rem;
		}
		100% {
			width: 16rem;
		}
	}

	@keyframes lamp-grow-4 {
		0% {
			width: 15rem;
		}
		100% {
			width: 30rem;
		}
	}

	/* Trigger the animation after a delay */
	.animate-lamp-start .animate-lamp-grow-1 {
		animation: lamp-grow 0.8s ease-in-out 0.3s both;
	}

	.animate-lamp-start .animate-lamp-grow-2 {
		animation: lamp-grow 0.8s ease-in-out 0.3s both;
	}

	.animate-lamp-start .animate-lamp-grow-3 {
		animation: lamp-grow-3 0.8s ease-in-out 0.3s both;
	}

	.animate-lamp-start .animate-lamp-grow-4 {
		animation: lamp-grow-4 0.8s ease-in-out 0.3s both;
	}
</style>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	let { delay = 0 }: { delay: number } = $props();

	// The parent component controls visibility, so no need for state management here
</script>

<div
	in:fade={{
		duration: 2000,
		easing: cubicInOut,
		delay: delay * 1000
	}}
	out:fade={{
		duration: 2000,
		easing: cubicInOut
	}}
	class="absolute left-1/2 z-10 h-[4px] w-[4px] -translate-x-1/2 rounded-full bg-blue-500 shadow-2xl shadow-blue-400 blur-[1px]"
></div>

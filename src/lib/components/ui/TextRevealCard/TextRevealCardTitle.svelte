<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	export let className: string | undefined = undefined;
</script>

<h2 class={twMerge('mb-2 text-lg text-white', className)}>
	<slot />
</h2>

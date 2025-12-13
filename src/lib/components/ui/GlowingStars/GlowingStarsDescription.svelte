<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string | undefined = undefined;
</script>

<p class={cn('max-w-[16rem] text-base text-white', className)}>
	<slot />
</p>

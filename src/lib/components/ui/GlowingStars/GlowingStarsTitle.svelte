<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string | undefined = undefined;
</script>

<h2 class={cn('text-2xl font-bold text-[#eaeaea]', className)}>
	<slot />
</h2>

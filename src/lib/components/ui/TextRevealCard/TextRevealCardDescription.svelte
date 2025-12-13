<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	export let className: string | undefined = undefined;
</script>

<p class={twMerge('text-sm text-[#a9a9a9]', className)}><slot /></p>

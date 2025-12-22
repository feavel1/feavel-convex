<script lang="ts">
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import { cn } from '$lib/utils.js';
	import type { TreeViewFileProps } from './types';

	let {
		name,
		icon,
		children,
		type = 'button',
		class: className,
		...rest
	}: TreeViewFileProps = $props();
</script>

<div class="flex flex-col">
	<button {type} class={cn('flex place-items-center gap-1 pl-[3px]', className)} {...rest}>
		{#if icon}
			{@render icon({ name })}
		{:else}
			<MessageSquareIcon class="size-4" />
		{/if}
		<span>{name}</span>
	</button>
	{#if children}
		<div class="mt-2 ml-4">
			{@render children?.()}
		</div>
	{/if}
</div>

<script>
    import Button from "$lib/ui/button/button.svelte";

</script>
<Button
	variant={isLiked ? 'default' : 'outline'}
	onclick={handleToggleLike}
	disabled={!currentUserId || isSubmitting}
	class="gap-2"
>
	{#if isSubmitting}
		<div
			class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
		></div>
	{:else}
		<Heart class="h-4 w-4 {isLiked ? 'fill-red-500 text-red-500' : ''}" />
	{/if}
	{likeCount}
</Button>
